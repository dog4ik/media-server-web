import { createEffect, createSignal, For, Show } from "solid-js";
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
import VideoInformation from "@/components/Description/VideoInformation";
import { fetchMovie } from "@/utils/library";
import ExternalLocalIdButtons from "@/components/ExternalLocalIdButtons";

export default function Movie() {
  let [movieId, provider] = useProvider();
  let [downloadModal, setDownloadModal] = createSignal(false);
  let [selectedVideo, setSelectedVideo] = createSignal<
    [number, number | undefined]
  >([0, undefined]);

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

  let videos = createAsync(async () => await movie()?.fetchVideos());
  let video = () => videos()?.at(0);

  let watchUrl = () => {
    let [videoIdx, variantIdx] = selectedVideo();
    let id = provider() == "local" ? +movieId() : movie()?.local_id;
    if (!id) return;
    let params = new URLSearchParams();
    if (variantIdx !== undefined) {
      let variant = videos()![videoIdx].variants()[variantIdx];
      params.append("variant", variant.details.id);
    }
    let video = videos()![videoIdx];
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
                query={movie().friendlyTitle()}
                content_type="movie"
                ref={downloadModal!}
              />
              <div class="grid grid-cols-4 items-center gap-2">
                <div class="hover-hide col-span-3">
                  <Description
                    title={movie().title}
                    localPoster={movie().localPoster()}
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
                    poster={movie().poster}
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
                <For each={videos()}>
                  {(video, idx) => (
                    <>
                      <VideoInformation
                        onSelect={() => setSelectedVideo([idx(), undefined])}
                        isSelected={
                          selectedVideo()[0] == idx() &&
                          selectedVideo()[1] === undefined
                        }
                        title={`Video file #${idx() + 1}`}
                        video={video}
                      />
                      <For each={video.variants()}>
                        {(variant, vidx) => (
                          <VideoInformation
                            title={`#${idx() + 1} Video variant #${vidx() + 1}`}
                            video={variant}
                            onSelect={() => setSelectedVideo([idx(), vidx()])}
                            isSelected={
                              selectedVideo()[0] == idx() &&
                              selectedVideo()[1] == vidx()
                            }
                          />
                        )}
                      </For>
                    </>
                  )}
                </For>
              </div>
            </>
          )}
        </Show>
      </div>
    </>
  );
}
