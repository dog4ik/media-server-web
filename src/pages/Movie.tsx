import { getRouteApi, linkOptions } from "@tanstack/solid-router";
import { FiDownload } from "solid-icons/fi";
import {
  createEffect,
  createSignal,
  Match,
  Show,
  Suspense,
  Switch,
} from "solid-js";
import { ActorSection } from "@/components/Cast/ActorSection";
import { Description, DescriptionSkeleton } from "@/components/Description";
import { ListActions } from "@/components/Description/ListActions";
import VideoActions from "@/components/Description/VideoActions";
import {
  ListItemSkeleton,
  VideoList,
  type VideoSelection,
} from "@/components/Description/VideoList";
import { ExternalLocalIdButtons } from "@/components/ExternalLocalIdButtons";
import DownloadTorrentModal from "@/components/modals/TorrentDownload";
import Icon from "@/components/ui/Icon";
import { HoverArea, setBackdrop } from "@/context/BackdropContext";
import { movieListItems } from "@/lib/lists";
import * as torrentQuery from "@/lib/torrentQuery";
import { extendMovie, posterList, Video } from "@/utils/library";
import { queryApi } from "@/utils/queryApi";
import { fullUrl } from "@/utils/serverApi";

export default function Movie() {
  let route = getRouteApi("/page/movies/$id");
  let search = route.useSearch();
  let params = route.useParams();
  let [downloadModal, setDownloadModal] = createSignal(false);
  let [selectedVideo, setSelectedVideo] = createSignal<VideoSelection>();

  let movie = queryApi.useQuery(
    "get",
    "/api/movie/{id}",
    () => ({
      params: {
        query: { provider: search().provider },
        path: { id: params().id },
      },
    }),
    () => ({ select: extendMovie }),
  );

  createEffect(() => {
    if (movie.data) {
      let localImage =
        movie.data?.provider === "local"
          ? fullUrl("/api/movie/{id}/backdrop", {
              path: { id: +movie.data?.provider_id },
            })
          : undefined;
      setBackdrop([localImage, movie.data?.backdrop ?? undefined]);
    }
  });

  let videos = queryApi.useQuery(
    "get",
    "/api/video/by_content",
    () => ({
      params: {
        query: {
          content_type: "movie",
          id: +(movie.latest()?.provider_id || "0"),
        },
      },
    }),
    () => ({
      select: (videos) => videos.map((v) => new Video(v)),
      enabled: movie.latest()?.provider === "local",
    }),
  );

  createEffect(() => {
    let firstVideo = videos.data?.at(0);
    if (firstVideo) {
      setSelectedVideo({ video_id: firstVideo.details.id });
    }
  });

  let video = () => videos.latest()?.at(0);

  let watchUrl = () => {
    let selection = selectedVideo();
    if (!selection) return;
    let { video_id, variant_id } = selection;
    let id = movie.data?.local?.id;
    if (!id) return;
    return linkOptions({
      to: "/movies/$id/watch",
      params: { id: params().id },
      search: { variant_id, video_id },
    });
  };

  return (
    <>
      <Switch>
        <Match when={movie.isLoading}>
          <DescriptionSkeleton direction="vertical" />
        </Match>
        <Match when={movie.latest()}>
          {(movie) => {
            const progress = () => {
              const history = movie().local?.history;
              const runtime = video()?.details.duration;
              if (!history || runtime === undefined) return undefined;
              return { history, runtime };
            };
            return (
              <>
                <DownloadTorrentModal
                  open={downloadModal()}
                  metadata_id={movie().provider_id}
                  onClose={() => setDownloadModal(false)}
                  metadata_provider={search().provider}
                  query={(p) => torrentQuery.MOVIE_FORMATTER[p](movie())}
                  content_type="movie"
                />
                <div class="grid grid-cols-1 items-center gap-2 md:grid-cols-4">
                  <div class="hover-hide md:col-span-3">
                    <Description
                      title={movie().title}
                      progress={progress()}
                      plot={movie().plot}
                      releaseDate={movie().release_date ?? undefined}
                      genres={movie().genres ?? undefined}
                      posterList={posterList(movie())}
                      imageDirection="vertical"
                    >
                      <div class="flex items-center gap-2">
                        <Show
                          when={video()}
                          fallback={
                            <Icon
                              tooltip="Download"
                              onClick={() => setDownloadModal(true)}
                            >
                              <FiDownload />
                            </Icon>
                          }
                        >
                          {(video) => (
                            <VideoActions video={video()} watchUrl={watchUrl()}>
                              <Icon
                                tooltip="Download"
                                onClick={() => setDownloadModal(true)}
                              >
                                <FiDownload />
                              </Icon>
                            </VideoActions>
                          )}
                        </Show>
                        <ListActions
                          items={() => movieListItems(movie())}
                          memberships={movie().local?.lists}
                          metadataId={movie().local?.metadata_id}
                        />
                        <ExternalLocalIdButtons
                          contentType="movie"
                          current_provider={search().provider}
                          ids={movie().external_ids ?? []}
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
            );
          }}
        </Match>
      </Switch>
      <div class="hover-hide mt-8">
        <Switch>
          <Match
            when={videos.isLoading || (!videos.isEnabled && movie.isLoading)}
          >
            <ListItemSkeleton />
          </Match>
          <Match when={videos.latest()}>
            {(videos) => (
              <>
                <Show
                  when={
                    selectedVideo() &&
                    (videos().length > 0 ||
                      videos().some((v) => v.details.variants.length > 0))
                  }
                >
                  <VideoList
                    selectedVideo={selectedVideo()!}
                    onVideoSelect={setSelectedVideo}
                    videos={videos()}
                  />
                </Show>
              </>
            )}
          </Match>
        </Switch>
        <Suspense>
          <Show when={movie.data?.cast?.length ? movie.data?.cast : undefined}>
            {(cast) => <ActorSection actors={cast()} />}
          </Show>
        </Suspense>
      </div>
    </>
  );
}
