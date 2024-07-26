import { createEffect, createSignal, For, Show, Suspense } from "solid-js";
import { createAsync, useLocation } from "@solidjs/router";
import Description from "../components/Description";
import SeasonsCarousel from "../components/ShowView/SeasonsCarousel";
import EpisodeCard from "../components/Cards/EpisodeCard";
import ElementsGrid from "../components/ElementsGrid";
import { fullUrl, Schemas, server } from "../utils/serverApi";
import { useProvider } from "../utils/metadataProviders";
import { useBackdrop } from "../context/BackdropContext";
import DownloadTorrentModal from "../components/modals/TorrentDownload";
import { Meta } from "@solidjs/meta";
import Title from "../utils/Title";

export default function ShowPage() {
  let [id, provider] = useProvider();
  let downloadModal: HTMLDialogElement;

  let show = createAsync(async () => {
    let show = await server
      .GET("/api/show/{id}", {
        params: {
          path: { id: id() },
          query: { provider: provider() },
        },
      })
      .then((r) => r.data);
    if (!show?.seasons?.includes(selectedSeason())) {
      setSelectedSeason(show?.seasons?.at(0) || selectedSeason());
    }
    let localId: number | undefined = undefined;
    if (show && show?.metadata_provider !== "local") {
      let localShowId = await server.GET("/api/external_to_local/{id}", {
        params: {
          path: { id: show.metadata_id },
          query: { provider: show.metadata_provider },
        },
      });
      if (localShowId.data?.show_id) {
        localId = localShowId.data.show_id;
      }
    } else if (show) {
      localId = +show.metadata_id;
    }
    if (!show) return undefined;

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
      useBackdrop([localImage, showData.backdrop ?? undefined]);
    }
  });

  let seasonQuery = +useLocation().query.season || 1;
  let [selectedSeason, setSelectedSeason] = createSignal<number>(seasonQuery);

  let season = createAsync(async () => {
    let season = await server.GET("/api/show/{id}/{season}", {
      params: {
        query: { provider: provider() },
        path: { id: id(), season: selectedSeason() },
      },
    });
    return season;
  });

  let localSeason = createAsync(async () => {
    let localId = show()?.localId?.toString();
    if (!localId) return undefined;
    let local_season = await server
      .GET("/api/show/{id}/{season}", {
        params: {
          path: {
            id: localId,
            season: selectedSeason(),
          },
          query: {
            provider: "local",
          },
        },
      })
      .then((d) => d.data);
    if (local_season) {
      let settled = await Promise.allSettled(
        local_season.episodes.map((e) =>
          server
            .GET("/api/video/by_content", {
              params: { query: { id: +e.metadata_id, content_type: "show" } },
            })
            .then((r) => r.data),
        ),
      );
      let videos: (Schemas["DetailedVideo"] | undefined)[] = [];
      for (let result of settled) {
        if (result.status === "fulfilled" && result.value) {
          videos.push(result.value);
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

  let torrentQuery = () => {
    if (!show()) return undefined;
    return `${show()!.title}`;
  };

  return (
    <>
      <Title text={show()?.title} />
      <Show when={show()}>
        {(data) => <Meta property="og-image" content={data().poster ?? ""} />}
      </Show>
      <Show when={torrentQuery() && show()}>
        <DownloadTorrentModal
          onClose={() => downloadModal!.close()}
          metadata_id={show()!.metadata_id}
          metadata_provider={provider()}
          query={torrentQuery()!}
          content_type="show"
          ref={downloadModal!}
        />
      </Show>
      <Show when={show()}>
        {(show) => {
          let descriptionImage = () =>
            show()?.metadata_provider == "local"
              ? fullUrl("/api/show/{id}/poster", {
                  path: { id: +show().metadata_id },
                })
              : undefined;

          return (
            <Description
              title={show().title}
              localPoster={descriptionImage()}
              plot={show().plot}
              poster={show().poster}
              imageDirection="vertical"
            >
              <button class="btn" onClick={() => downloadModal.showModal()}>
                Download
              </button>
            </Description>
          );
        }}
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
        <Show when={season()?.data}>
          {(seasonData) => (
            <ElementsGrid elementSize={320}>
              <For each={seasonData().episodes}>
                {(ep) => {
                  let local_ep = () =>
                    localSeason()?.episodes?.find(
                      (e) =>
                        e.number == ep.number &&
                        localSeason()?.number == seasonData().number,
                    );
                  return (
                    <EpisodeCard
                      url={`${selectedSeason()}/${ep.number}?provider=${ep.metadata_provider}`}
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
