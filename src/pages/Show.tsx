import { createEffect, createSignal, For, Show, Suspense } from "solid-js";
import { createAsync, useLocation } from "@solidjs/router";
import Description from "../components/Description";
import SeasonsCarousel from "../components/ShowView/SeasonsCarousel";
import EpisodeCard from "../components/Cards/EpisodeCard";
import ElementsGrid from "../components/ElementsGrid";
import { getLocalByExternalId, getSeason, getShow } from "../utils/serverApi";
import { useProvider } from "../utils/metadataProviders";
import { NotFoundError, UnavailableError } from "../utils/errors";
import { useBackdrop } from "../context/BackdropContext";

export default function ShowPage() {
  let [id, provider] = useProvider();

  let show = createAsync(async () => {
    let show = await getShow(id(), provider());
    if (!show.seasons?.includes(selectedSeason())) {
      setSelectedSeason(show.seasons?.at(0) || selectedSeason());
    }
    let local_id: number | undefined;
    if (show.metadata_provider !== "local") {
      let localSeason = await getLocalByExternalId(id(), provider()).catch(
        (e) => {
          if (e instanceof NotFoundError || e instanceof UnavailableError) {
            return undefined;
          }
          throw e;
        },
      );
      if (localSeason?.show_id) {
        local_id = localSeason.show_id;
      }
    } else {
      local_id = +show.metadata_id;
    }
    return { ...show, local_id };
  });

  createEffect(() => {
    if (show()?.backdrop) useBackdrop(show()?.backdrop);
  });

  let seasonQuery = +useLocation().query.season || 1;
  let [selectedSeason, setSelectedSeason] = createSignal<number>(seasonQuery);

  let season = createAsync(async () => {
    let season = await getSeason(id(), selectedSeason(), provider()).catch(
      (e) => {
        if (e instanceof NotFoundError) {
          return undefined;
        }
        throw e;
      },
    );
    return season;
  });

  let localSeason = createAsync(async () => {
    if (!show()?.local_id) return undefined;
    let local_id = show()!.local_id!.toString();
    return await getSeason(local_id, selectedSeason(), "local").catch((e) => {
      if (e instanceof NotFoundError) {
        return undefined;
      }
      throw e;
    });
  });

  return (
    <>
      <Show when={show()}>
        <Description
          title={show()!.title}
          plot={show()!.plot}
          poster={show()!.poster}
          imageDirection="vertical"
        ></Description>
      </Show>
      <Suspense>
        <Show when={show() && selectedSeason()}>
          <SeasonsCarousel
            tabs={show()!.seasons!}
            onClick={(season) => setSelectedSeason(season)}
          />
        </Show>
      </Suspense>
      <Suspense>
        <Show when={season()}>
          <ElementsGrid elementSize={320}>
            <For each={season()!.episodes}>
              {(ep) => {
                let local_ep = () =>
                  localSeason()?.episodes?.find(
                    (e) =>
                      e.number == ep.number &&
                      localSeason()!.number == season()!.number,
                  );
                return (
                  <EpisodeCard
                    url={`${selectedSeason()}/${ep.number}?provider=${ep.metadata_provider}`}
                    onFixMetadata={() => null}
                    onOptimize={() => null}
                    onDelete={() => null}
                    episode={{
                      ...ep,
                      runtime: local_ep()?.runtime ?? ep.runtime,
                    }}
                    availableLocally={
                      ep.metadata_provider == "local" ||
                      local_ep() !== undefined
                    }
                  />
                );
              }}
            </For>
          </ElementsGrid>
        </Show>
      </Suspense>
    </>
  );
}
