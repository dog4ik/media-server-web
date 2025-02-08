import { createEffect, createSignal, For, Show, Suspense } from "solid-js";
import { createAsync, useLocation } from "@solidjs/router";
import Description from "@/components/Description";
import SeasonsCarousel from "@/components/ShowView/SeasonsCarousel";
import EpisodeCard from "@/components/Cards/EpisodeCard";
import ElementsGrid from "@/components/ElementsGrid";
import { fullUrl, Schemas, server } from "../utils/serverApi";
import { useProvider } from "@/utils/metadataProviders";
import { setBackdrop } from "@/context/BackdropContext";
import DownloadTorrentModal from "@/components/modals/TorrentDownload";
import { fetchSeason, fetchShow } from "@/utils/library";
import Title from "@/utils/Title";
import Icon from "@/components/ui/Icon";
import { FiDownload, FiSkipForward } from "solid-icons/fi";
import { useServerStatus } from "@/context/ServerStatusContext";

export default function ShowPage() {
  let [id, provider] = useProvider();
  let [downloadModal, setDownloadModal] = createSignal(false);

  let [{ capabilities }] = useServerStatus();

  let show = createAsync(async () => {
    let show = await fetchShow(id(), provider());
    if (!show) return undefined;

    if (!show.seasons?.includes(selectedSeason())) {
      setSelectedSeason(show?.seasons?.at(0) || selectedSeason());
    }
    let localId = await show?.localId();

    return { ...show, localId };
  });

  createEffect(() => {
    let showData = show();
    if (showData) {
      let localImage =
        showData.metadata_provider == "local"
          ? fullUrl("/api/show/{id}/backdrop", {
              path: { id: +showData.metadata_id },
            })
          : undefined;
      setBackdrop([localImage, showData.backdrop ?? undefined]);
    }
  });

  let seasonQuery = +useLocation().query.season || 1;
  let [selectedSeason, setSelectedSeason] = createSignal<number>(seasonQuery);

  let season = createAsync(async () => {
    return await fetchSeason(id(), selectedSeason(), provider());
  });

  let localSeason = createAsync(async () => {
    let localId = show()?.localId?.toString();
    if (!localId) return undefined;
    let local_season = await fetchSeason(localId, selectedSeason(), "local");
    if (!local_season) return undefined;

    let settled = await Promise.allSettled(
      local_season.extended_episodes.map((e) => e.fetchVideos()),
    );

    let videos = settled.reduce(
      (acc, n) => {
        n.status === "fulfilled"
          ? acc.push(n.value?.at(0)?.details)
          : acc.push(undefined);
        return acc;
      },
      [] as (Schemas["DetailedVideo"] | undefined)[],
    );

    return {
      ...local_season,
      episodes: local_season.episodes.map((ep, i) => {
        return { ...ep, video: videos[i] };
      }),
    };
  });

  async function detectIntros() {
    if (show()?.metadata_provider === "local") {
      await server.POST("/api/show/{show_id}/{season}/detect_intros", {
        params: { path: { season: selectedSeason(), show_id: +id() } },
      });
    }
  }

  return (
    <>
      <Title text={show()?.title} />
      <Show when={show()}>
        {(show) => (
          <>
            <DownloadTorrentModal
              open={downloadModal()}
              onClose={() => setDownloadModal(false)}
              metadata_id={show().metadata_id}
              metadata_provider={provider()}
              query={show().friendlyTitle()}
              content_type="show"
            />
            <Description
              title={show().title}
              localPoster={show().localPoster()}
              plot={show().plot}
              poster={show().poster}
              imageDirection="vertical"
              additionalInfo={
                show().release_date
                  ? [{ info: show().release_date! }]
                  : undefined
              }
            >
              <div class="flex items-center gap-2">
                <Icon tooltip="Download" onClick={() => setDownloadModal(true)}>
                  <FiDownload size={30} />
                </Icon>
                <Show when={show().metadata_provider == "local"}>
                  <Icon
                    tooltip={
                      capabilities()?.chromaprint_enabled
                        ? `Detect intros for season ${selectedSeason()}`
                        : "Intro detection is not supported by local ffmpeg build"
                    }
                    disabled={!capabilities()?.chromaprint_enabled}
                    onClick={() => detectIntros()}
                  >
                    <FiSkipForward size={30} />
                  </Icon>
                </Show>
              </div>
            </Description>
          </>
        )}
      </Show>
      <Suspense>
        <Show when={show() && selectedSeason()}>
          <SeasonsCarousel
            tabs={show()!.seasons!}
            onChange={(season) => setSelectedSeason(season)}
          />
        </Show>
      </Suspense>
      <Suspense>
        <Show when={season()}>
          {(seasonData) => (
            <ElementsGrid elementSize={320}>
              <For each={seasonData().extended_episodes}>
                {(ep) => {
                  let local_ep = () =>
                    localSeason()?.episodes?.find(
                      (e) =>
                        e.number == ep.number &&
                        localSeason()?.number == seasonData().number,
                    );
                  return (
                    <EpisodeCard
                      url={ep.url()}
                      onFixMetadata={() => null}
                      onOptimize={() => null}
                      onDelete={() => null}
                      video={local_ep()?.video}
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
