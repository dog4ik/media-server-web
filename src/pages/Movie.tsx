import { createEffect, Show } from "solid-js";
import { fullUrl } from "@/utils/serverApi";
import Description from "@/components/Description";
import DownloadTorrentModal from "@/components/modals/TorrentDownload";
import { createAsync } from "@solidjs/router";
import { useProvider } from "@/utils/metadataProviders";
import { setBackdrop } from "@/context/BackdropContext";
import Title from "@/utils/Title";
import Icon from "@/components/ui/Icon";
import { FiDownload } from "solid-icons/fi";
import VideoActions from "@/components/Description/VideoActions";
import VideoInformation from "@/components/Description/VideoInformation";
import { fetchMovie } from "@/utils/library";

export default function Movie() {
  let [movieId, provider] = useProvider();
  let downloadModal: HTMLDialogElement;

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

  let video = createAsync(async () => await movie()?.fetchVideo());

  let watchUrl = () => {
    let id = provider() == "local" ? +movieId() : movie()?.local_id;
    if (id) return `/movies/${id}/watch`;
  };

  return (
    <>
      <Title text={movie()?.title} />
      <Show when={movie()}>
        {(movie) => (
          <>
            <DownloadTorrentModal
              metadata_id={movie().metadata_id}
              onClose={() => downloadModal?.close()}
              metadata_provider={provider()}
              query={movie().friendlyTitle()}
              content_type="movie"
              ref={downloadModal!}
            />
            <div class="space-y-5 p-4">
              <Description
                title={movie().title}
                localPoster={movie().localPoster()}
                progress={
                  video()?.history
                    ? {
                        history: video()!.history!,
                        runtime: video()!.duration.secs,
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
                        onClick={() => downloadModal?.showModal()}
                      >
                        <FiDownload size={30} />
                      </Icon>
                    }
                  >
                    {(video) => (
                      <VideoActions video={video()} watchUrl={watchUrl()}>
                        <Icon
                          tooltip="Download"
                          onClick={() => downloadModal?.showModal()}
                        >
                          <FiDownload size={30} />
                        </Icon>
                      </VideoActions>
                    )}
                  </Show>
                </div>
              </Description>
              <Show when={video()}>
                {(video) => <VideoInformation video={video()} />}
              </Show>
            </div>
          </>
        )}
      </Show>
    </>
  );
}
