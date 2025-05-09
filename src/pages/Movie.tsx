import { createEffect, createSignal, Show } from "solid-js";
import { fullUrl } from "@/utils/serverApi";
import Description from "@/components/Description";
import DownloadTorrentModal from "@/components/modals/TorrentDownload";
import { createAsync } from "@solidjs/router";
import { useProvider } from "@/utils/metadataProviders";
import { HoverArea, setBackdrop } from "@/context/BackdropContext";
import Title from "@/utils/Title";
import Icon from "@/components/ui/Icon";
import { FiDownload } from "solid-icons/fi";
import VideoActions from "@/components/Description/VideoActions";
import VideoInformation, {
  VideoSelection,
} from "@/components/Description/VideoInformation";
import { fetchMovie, posterList } from "@/utils/library";
import ExternalLocalIdButtons from "@/components/ExternalLocalIdButtons";

export default function Movie() {
  let [movieId, provider] = useProvider();
  let [downloadModal, setDownloadModal] = createSignal(false);
  let [selectedVideo, setSelectedVideo] = createSignal<VideoSelection>();

  let movie = createAsync(async () => {
    let movie = await fetchMovie(movieId(), provider());

    let local_id = await movie.localId();
    return {
      ...movie,
      local_id,
    };
  });

  createEffect(() => {
    if (movie()) {
      let localImage =
        movie()?.metadata_provider == "local"
          ? fullUrl("/api/movie/{id}/backdrop", {
              path: { id: +movie()!.metadata_id },
            })
          : undefined;
      setBackdrop([localImage, movie()!.backdrop ?? undefined]);
    }
  });

  let videos = createAsync(async () => {
    let videos = await movie()?.fetchVideos();
    if (!videos) return undefined;
    let firstVideo = videos.at(0);
    if (firstVideo) {
      setSelectedVideo({ video_id: firstVideo.details.id });
    }
    return videos;
  });
  let video = () => videos()?.at(0);

  let watchUrl = () => {
    let selection = selectedVideo();
    if (!selection) return;
    let { video_id, variant_id } = selection;
    let id = provider() == "local" ? +movieId() : movie()?.local_id;
    if (!id) return;
    let params = new URLSearchParams();
    let video = videos()?.find((v) => v.details.id == video_id);
    if (!video) return;
    if (variant_id !== undefined) {
      params.append("variant", variant_id);
    }
    params.append("video", video.details.id.toString());
    return `/movies/${id}/watch?${params.toString()}`;
  };

  return (
    <>
      <Title text={movie()?.title} />
      <div class="space-y-5 p-4">
        <Show when={movie()}>
          {(movie) => (
            <>
              <DownloadTorrentModal
                open={downloadModal()}
                metadata_id={movie().metadata_id}
                onClose={() => setDownloadModal(false)}
                metadata_provider={provider()}
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
                        ? [{ info: movie().release_date! }]
                        : undefined
                    }
                    posterList={posterList(movie())}
                    imageDirection="horizontal"
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
                        provider={provider()}
                        id={movieId()}
                      />
                    </div>
                  </Description>
                </div>
                <div class="z-20 col-span-1">
                  <HoverArea />
                </div>
              </div>
              <div class="hover-hide mt-8">
                <Show when={selectedVideo()}>
                  <Show when={videos()}>
                    {(videos) => (
                      <>
                        <VideoInformation
                          videos={videos()}
                          selectedVideo={selectedVideo()!}
                        />
                      </>
                    )}
                  </Show>
                </Show>
              </div>
            </>
          )}
        </Show>
      </div>
    </>
  );
}
