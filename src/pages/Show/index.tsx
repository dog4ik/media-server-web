import {
  createEffect,
  createMemo,
  createSignal,
  Match,
  Show,
  Suspense,
  Switch,
} from "solid-js";
import { Description, DescriptionSkeleton } from "@/components/Description";
import SeasonsCarousel from "@/components/ShowView/SeasonsCarousel";
import { fullUrl, Schemas, server } from "@/utils/serverApi";
import { HoverArea, setBackdrop } from "@/context/BackdropContext";
import DownloadTorrentModal from "@/components/modals/TorrentDownload";
import { extendShow, posterList } from "@/utils/library";
import Icon from "@/components/ui/Icon";
import { FiDownload, FiSkipForward } from "solid-icons/fi";
import { useServerStatus } from "@/context/ServerStatusContext";
import Season from "./Season";
import { queryApi } from "@/utils/queryApi";
import { getRouteApi } from "@tanstack/solid-router";
import { SuspenseLoader } from "@/components/Loader";
import { ExternalLocalIdButtons } from "@/components/ExternalLocalIdButtons";

export default function ShowPage() {
  let route = getRouteApi("/page/shows/$id");
  let params = route.useParams();
  let search = route.useSearch();
  let navigate = route.useNavigate();

  let show = queryApi.useQuery(
    "get",
    "/api/show/{id}",
    () => ({
      params: {
        query: { provider: search().provider },
        path: { id: params().id },
      },
    }),
    () => ({ select: extendShow }),
  );

  let [downloadModal, setDownloadModal] = createSignal(false);

  let seasonNumber = createMemo(
    () => search().season ?? show.latest()?.seasons?.at(0),
  );

  let [{ capabilities }] = useServerStatus();

  createEffect(() => {
    console.log("running show backdrop effect");
    if (show.data) {
      let localImage =
        show.data.metadata_provider == "local"
          ? fullUrl("/api/show/{id}/backdrop", {
              path: { id: +show.data.metadata_id! },
            })
          : undefined;
      setBackdrop([localImage, show.data.backdrop ?? undefined]);
    }
  });

  // let localSeason = createAsync(async () => {
  //   let localId = show()?.localId?.toString();
  //   if (!localId) return undefined;
  //   let local_season = await fetchSeason(localId, selectedSeason(), "local");
  //   if (!local_season) return undefined;
  //
  //   let settled = await Promise.allSettled(
  //     local_season.extended_episodes.map((e) => e.fetchVideos()),
  //   );
  //
  //   let videos = settled.reduce(
  //     (acc, n) => {
  //       n.status === "fulfilled"
  //         ? acc.push(n.value?.at(0)?.details)
  //         : acc.push(undefined);
  //       return acc;
  //     },
  //     [] as (Schemas["DetailedVideo"] | undefined)[],
  //   );
  //
  //   return {
  //     ...local_season,
  //     episodes: local_season.episodes.map((ep, i) => {
  //       return { ...ep, video: videos[i] };
  //     }),
  //   };
  // });

  async function detectIntros() {
    if (show.data?.metadata_provider === "local" && seasonNumber() !== undefined) {
      await server.POST("/api/show/{show_id}/{season}/detect_intros", {
        params: {
          path: { season: seasonNumber()!, show_id: +show.data.metadata_id },
        },
      });
    }
  }

  function setSelectedSeason(season: number) {
    navigate({ search: { season: season, provider: search().provider } });
  }

  return (
    <Suspense>
      <div class="space-y-5 p-4">
        <Switch>
          <Match when={show.isLoading}>
            <DescriptionSkeleton direction="vertical" />
          </Match>
          <Match when={show.latest()}>
            {(show) => (
              <>
                <Suspense>
                  <DownloadTorrentModal
                    open={downloadModal()}
                    onClose={() => setDownloadModal(false)}
                    metadata_id={show().metadata_id}
                    metadata_provider={search().provider}
                    query={() => show().friendlyTitle()}
                    content_type="show"
                  />
                </Suspense>
                <div class="grid grid-cols-4 items-center gap-2">
                  <div class="hover-hide col-span-3">
                    <Description
                      title={show().title}
                      posterList={posterList(show())}
                      plot={show().plot}
                      imageDirection="vertical"
                      additionalInfo={
                        show().release_date
                          ? [{ info: show().release_date!, link: undefined }]
                          : undefined
                      }
                    >
                      <div class="flex items-center gap-2">
                        <Icon
                          tooltip="Download"
                          onClick={() => setDownloadModal(true)}
                        >
                          <FiDownload size={30} />
                        </Icon>
                        <Show when={show().metadata_provider == "local"}>
                          <Icon
                            tooltip={
                              capabilities.latest()?.chromaprint_enabled
                                ? `Detect intros for season ${seasonNumber()}`
                                : "Intro detection is not supported by local ffmpeg build"
                            }
                            disabled={!capabilities.latest()?.chromaprint_enabled}
                            onClick={() => detectIntros()}
                          >
                            <FiSkipForward size={30} />
                          </Icon>
                        </Show>
                        <ExternalLocalIdButtons
                          contentType="show"
                          provider={search().provider}
                          season={seasonNumber()}
                          id={params().id}
                        />
                      </div>
                    </Description>
                  </div>
                  <div class="z-20 col-span-1">
                    <HoverArea />
                  </div>
                </div>
              </>
            )}
          </Match>
        </Switch>
        <div class="hover-hide">
          <Show when={show.latest()}>
            <SeasonsCarousel
              tabs={show.latest()!.seasons!}
              onChange={(season) => setSelectedSeason(season)}
            />
          </Show>
          <SuspenseLoader name={`"Season ${seasonNumber()}`}>
            <Show when={seasonNumber()}>
              {(season) => {
                let torrentQuery = (
                  provider: Schemas["TorrentIndexIdentifier"],
                ) => {
                  if (provider == "tpb") {
                    return `${show.latest()?.title} Season ${seasonNumber()}`;
                  }
                  if (provider == "rutracker") {
                    return `${show.latest()?.title} Сезон: ${seasonNumber()}`;
                  }
                  throw Error(`Provider ${provider} is not supported`);
                };
                return (
                  <Season
                    season={season()}
                    initialTorrentQuery={torrentQuery}
                    showId={params().id}
                    canDetectIntros={true}
                  />
                );
              }}
            </Show>
          </SuspenseLoader>
        </div>
      </div>
    </Suspense>
  );
}
