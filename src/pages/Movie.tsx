import { createEffect, createSignal, Match, Show, Switch } from "solid-js";
import { fullUrl } from "@/utils/serverApi";
import { Description, DescriptionSkeleton } from "@/components/Description";
import DownloadTorrentModal from "@/components/modals/TorrentDownload";
import { HoverArea, setBackdrop } from "@/context/BackdropContext";
import Title from "@/utils/Title";
import Icon from "@/components/ui/Icon";
import { FiDownload } from "solid-icons/fi";
import VideoActions from "@/components/Description/VideoActions";
import { extendMovie, posterList, Video } from "@/utils/library";
import { ExternalLocalIdButtons } from "@/components/ExternalLocalIdButtons";
import {
  ListItemSkeleton,
  VideoList,
  VideoSelection,
} from "@/components/Description/VideoList";
import { useQuery } from "@tanstack/solid-query";
import { queryApi } from "@/utils/queryApi";
import { getRouteApi, linkOptions } from "@tanstack/solid-router";

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

  let local_id = useQuery(() => ({
    queryFn: async () => movie.latest()?.localId(),
    queryKey: ["local_id"],
    enabled: !!movie.latest(),
  }));

  createEffect(() => {
    if (movie.data) {
      let localImage =
        movie.data?.metadata_provider == "local"
          ? fullUrl("/api/movie/{id}/backdrop", {
              path: { id: +movie.data!.metadata_id },
            })
          : undefined;
      setBackdrop([localImage, movie.data!.backdrop ?? undefined]);
    }
  });

  let videos = queryApi.useQuery(
    "get",
    "/api/video/by_content",
    () => ({
      params: {
        query: {
          content_type: "movie",
          id: +(movie.latest()?.metadata_id || "0"),
        },
      },
    }),
    () => ({
      select: (videos) => videos.map((v) => new Video(v)),
      enabled: movie.latest()?.metadata_provider == "local",
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
    let id = local_id.data;
    if (!id) return;
    return linkOptions({
      to: "/movies/$id/watch",
      params: { id: params().id },
      search: { variant_id, video_id },
    });
  };

  return (
    <>
      <Title text={movie.latest()?.title} />
      <div class="space-y-5 p-4">
        <Switch>
          <Match when={movie.isLoading}>
            <DescriptionSkeleton direction="vertical" />
          </Match>
          <Match when={movie.latest()}>
            {(movie) => (
              <>
                <DownloadTorrentModal
                  open={downloadModal()}
                  metadata_id={movie().metadata_id}
                  onClose={() => setDownloadModal(false)}
                  metadata_provider={search().provider}
                  query={() => movie().friendlyTitle()}
                  content_type="movie"
                  ref={downloadModal!}
                />
                <div class="grid grid-cols-4 items-center gap-2">
                  <div class="hover-hide col-span-3">
                    <Description
                      title={movie().title}
                      progress={
                        video()?.details.history
                          ? {
                              history: video()!.details.history!,
                              runtime: video()!.details.duration.secs,
                            }
                          : undefined
                      }
                      plot={movie().plot}
                      additionalInfo={
                        movie().release_date
                          ? [{ info: movie().release_date!, link: undefined }]
                          : undefined
                      }
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
                              <FiDownload size={30} />
                            </Icon>
                          }
                        >
                          {(video) => (
                            <VideoActions video={video()} watchUrl={watchUrl()}>
                              <Icon
                                tooltip="Download"
                                onClick={() => setDownloadModal(true)}
                              >
                                <FiDownload size={30} />
                              </Icon>
                            </VideoActions>
                          )}
                        </Show>
                        <ExternalLocalIdButtons
                          contentType="movie"
                          provider={search().provider}
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
        </div>
      </div>
    </>
  );
}
