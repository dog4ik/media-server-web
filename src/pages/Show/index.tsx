import { getRouteApi } from "@tanstack/solid-router";
import Download from "lucide-solid/icons/download";
import Search from "lucide-solid/icons/search";
import {
  createEffect,
  createMemo,
  createSignal,
  Match,
  Show,
  Suspense,
  Switch,
} from "solid-js";
import { ActorSection } from "@/components/Cast/ActorSection";
import { Description, DescriptionSkeleton } from "@/components/Description";
import { ListActions } from "@/components/Description/ListActions";
import { ExternalLocalIdButtons } from "@/components/ExternalLocalIdButtons";
import { SuspenseLoader } from "@/components/Loader";
import DownloadTorrentModal from "@/components/modals/TorrentDownload";
import { SeasonTabs } from "@/components/SeasonTabs";
import Icon from "@/components/ui/Icon";
import { HoverArea, setBackdrop } from "@/context/BackdropContext";
import { showListItems } from "@/lib/lists";
import * as torrentQuery from "@/lib/torrentQuery";
import { extendShow, posterList } from "@/utils/library";
import { queryApi } from "@/utils/queryApi";
import { fullUrl, server } from "@/utils/serverApi";
import Season from "./Season";

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

  let capabilities = queryApi.useQuery(
    "get",
    "/api/configuration/capabilities",
  );

  createEffect(() => {
    if (show.data) {
      let localImage =
        show.data.provider === "local"
          ? fullUrl("/api/show/{id}/backdrop", {
              path: { id: +show.data.provider_id },
            })
          : undefined;
      setBackdrop([localImage, show.data.backdrop ?? undefined]);
    }
  });

  async function detectIntros() {
    const season = seasonNumber();
    if (show.data?.provider === "local" && season !== undefined) {
      await server.POST("/api/show/{show_id}/{season}/detect_intros", {
        params: {
          path: { season, show_id: +show.data.provider_id },
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
                  metadata_id={show().provider_id}
                  metadata_provider={search().provider}
                  query={(p) => torrentQuery.SHOW_FORMATTER[p](show())}
                  content_type="show"
                />
              </Suspense>
              <div class="grid grid-cols-1 items-center gap-2 md:grid-cols-4">
                <div class="hover-hide md:col-span-3">
                  <Description
                    title={show().title}
                    posterList={posterList(show())}
                    plot={show().plot}
                    imageDirection="vertical"
                    releaseDate={show().release_date ?? undefined}
                    genres={show().genres ?? undefined}
                  >
                    <div class="flex items-center gap-2">
                      <Icon
                        tooltip="Download"
                        onClick={() => setDownloadModal(true)}
                      >
                        <Download size="1em" />
                      </Icon>
                      <Show when={show().provider === "local"}>
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
                            <Search size="1em" />
                          </Icon>
                        </Suspense>
                      </Show>
                      <ListActions
                        items={() => showListItems(show())}
                        memberships={show().local?.lists}
                        metadataId={show().local?.metadata_id}
                      />
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
                <div class="z-20 hidden md:col-span-1 md:block">
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
            <SeasonTabs
              tabs={seasons()}
              onChange={(season) => setSelectedSeason(season)}
            />
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
          <Show when={show.data?.cast?.length ? show.data?.cast : undefined}>
            {(cast) => <ActorSection actors={cast()} />}
          </Show>
        </Suspense>
      </div>
    </Suspense>
  );
}
