import { createEffect, createSignal, For, Show, Suspense } from "solid-js";
import { createAsync, useLocation } from "@solidjs/router";
import Description from "../components/Description";
import SeasonsCarousel from "../components/ShowView/SeasonsCarousel";
import EpisodeCard from "../components/Cards/EpisodeCard";
import ElementsGrid from "../components/ElementsGrid";
import { fullUrl, Schemas, server } from "../utils/serverApi";
import { useProvider } from "../utils/metadataProviders";
import { NotFoundError } from "../utils/errors";
import { useBackdrop } from "../context/BackdropContext";

export default function ShowPage() {
  let [id, provider] = useProvider();

  let show = createAsync(async () => {
    let show = await server.GET("/api/show/{id}", {
      params: {
        path: { id: id() },
        query: { provider: provider() },
      },
    });
    if (show.error) return undefined;
    if (!show.data.seasons?.includes(selectedSeason())) {
      setSelectedSeason(show.data.seasons?.at(0) || selectedSeason());
    }
    let local_id: number | undefined;
    if (show.data.metadata_provider !== "local") {
      let localSeason = await server.GET("/api/external_to_local/{id}", {
        params: { path: { id: id() }, query: { provider: provider() } },
      });
      if (localSeason.data?.show_id) {
        local_id = localSeason.data.show_id;
      }
    } else {
      local_id = +show.data.metadata_id;
    }
    return { ...show, local_id };
  });

  createEffect(() => {
    let showData = show()?.data;
    if (showData) {
      let localImage =
        showData.metadata_provider == "local"
          ? fullUrl("/api/show/{id}/backdrop", {
            path: { id: +showData.metadata_id },
          })
          : undefined;
      useBackdrop([localImage, showData.backdrop ?? undefined]);
    }
  });

  let seasonQuery = +useLocation().query.season || 1;
  let [selectedSeason, setSelectedSeason] = createSignal<number>(seasonQuery);

  let season = createAsync(async () => {
    let season = await server
      .GET("/api/show/{id}/{season}", {
        params: {
          query: { provider: provider() },
          path: { id: id(), season: selectedSeason() },
        },
      })
      .catch((e) => {
        if (e instanceof NotFoundError) {
          return undefined;
        }
        throw e;
      });
    return season;
  });

  let localSeason = createAsync(async () => {
    if (!show()?.local_id) return undefined;
    let local_id = show()!.local_id!.toString();
    let local_season = await server
      .GET("/api/show/{id}/{season}", {
        params: {
          path: {
            id: local_id,
            season: selectedSeason(),
          },
          query: {
            provider: "local",
          },
        },
      })
      .then((d) => d.data)
      .catch((e) => {
        if (e instanceof NotFoundError) {
          return undefined;
        }
        throw e;
      });
    if (local_season) {
      let settled = await Promise.allSettled(
        local_season.episodes.map((e) =>
          server.GET("/api/video/by_content", {
            params: { query: { id: +e.metadata_id, content_type: "show" } },
          }),
        ),
      );
      let videos: (Schemas["DetailedVideo"] | undefined)[] = [];
      for (let result of settled) {
        if (result.status === "fulfilled" && result.value.data) {
          videos.push(result.value.data);
        } else {
          console.warn("Could not get video for local episode");
          videos.push(undefined);
        }
      }
      return {
        ...local_season,
        episodes: local_season.episodes.map((ep, i) => {
          return { ...ep, video: videos[i] };
        }),
      };
    }
    return undefined;
  });

  return (
    <>
      <Show when={show()?.data}>
        {(data) => {
          let descriptionImage = () =>
            show()?.data.metadata_provider == "local"
              ? fullUrl("/api/show/{id}/poster", {
                path: { id: +data().metadata_id },
              })
              : undefined;

          return (
            <Description
              title={data().title}
              localPoster={descriptionImage()}
              plot={data().plot}
              poster={data().poster}
              imageDirection="vertical"
            />
          );
        }}
      </Show>
      <Suspense>
        <Show when={show() && selectedSeason()}>
          <SeasonsCarousel
            tabs={show()!.data.seasons!}
            onClick={(season) => setSelectedSeason(season)}
          />
        </Show>
      </Suspense>
      <Suspense>
        <Show when={season()?.data}>
          {(data) => (
            <ElementsGrid elementSize={320}>
              <For each={data().episodes}>
                {(ep) => {
                  let local_ep = () =>
                    localSeason()?.episodes?.find(
                      (e) =>
                        e.number == ep.number &&
                        localSeason()?.number == data()!.number,
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
                      history={local_ep()?.video?.history ?? undefined}
                    />
                  );
                }}
              </For>
            </ElementsGrid>
          )}
        </Show>
      </Suspense>
    </>
  );
}
