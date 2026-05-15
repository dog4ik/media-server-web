import { createEffect, createMemo, createSignal, Match, Show, Suspense, Switch } from "solid-js";
import { Description, DescriptionSkeleton } from "@/components/Description";
import { SeasonTabs } from "@/components/SeasonTabs";
import { fullUrl, server } from "@/utils/serverApi";
import { HoverArea, setBackdrop } from "@/context/BackdropContext";
import DownloadTorrentModal from "@/components/modals/TorrentDownload";
import { extendShow, posterList } from "@/utils/library";
import Icon from "@/components/ui/Icon";
import { FiDownload, FiSkipForward } from "solid-icons/fi";
import Season from "./Season";
import { queryApi } from "@/utils/queryApi";
import { getRouteApi } from "@tanstack/solid-router";
import { SuspenseLoader } from "@/components/Loader";
import { ExternalLocalIdButtons } from "@/components/ExternalLocalIdButtons";
import * as torrentQuery from "@/lib/torrentQuery";
import { ActorSection } from "@/components/Cast/ActorSection";

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

  let seasonNumber = createMemo(() => search().season ?? show.latest()?.seasons?.at(0));

  let capabilities = queryApi.useQuery("get", "/api/configuration/capabilities");

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
                  query={(p) => torrentQuery.SHOW_FORMATTER[p](show())}
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
                    releaseDate={show().release_date ?? undefined}
                    genres={show().genres ?? undefined}
                  >
                    <div class="flex items-center gap-2">
                      <Icon tooltip="Download" onClick={() => setDownloadModal(true)}>
                        <FiDownload size={30} />
                      </Icon>
                      <Show when={show().metadata_provider == "local"}>
                        <Suspense>
                          <Icon
                            tooltip={
                              capabilities.data?.chromaprint_enabled
                                ? `Detect intros for season ${seasonNumber()}`
                                : "Intro detection is not supported by local ffmpeg build"
                            }
                            disabled={!capabilities.data?.chromaprint_enabled}
                            onClick={() => detectIntros()}
                          >
                            <FiSkipForward size={30} />
                          </Icon>
                        </Suspense>
                      </Show>
                      <ExternalLocalIdButtons
                        contentType="show"
                        current_provider={search().provider}
                        season={seasonNumber()}
                        ids={show().external_ids || []}
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
        <Show when={show.latest()?.seasons}>
          {(seasons) => (
            <SeasonTabs tabs={seasons()} onChange={(season) => setSelectedSeason(season)} />
          )}
        </Show>
        <SuspenseLoader name={`"Season ${seasonNumber()}`}>
          <Show when={seasonNumber()}>
            {(season) => (
              <Season
                season={season()}
                localShowId={show.data?.local?.id}
                initialTorrentQuery={(p) =>
                  torrentQuery.SEASON_FORMATTER[p](show.latest()!, season())
                }
                showId={params().id}
                canDetectIntros={true}
              />
            )}
          </Show>
        </SuspenseLoader>
        <Suspense>
          <Show when={show.data?.cast?.length}>{<ActorSection actors={show.data!.cast!} />}</Show>
        </Suspense>
      </div>
    </Suspense>
  );
}
