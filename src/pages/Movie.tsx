import { createEffect, Show } from "solid-js";
import ContentSectionContainer, {
  Info,
} from "../components/generic/ContentSectionContainer";
import {
  defaultTrack,
  formatCodec,
  fullUrl,
  revalidatePath,
  server,
} from "../utils/serverApi";
import MoreButton, { Row } from "../components/ContextMenu/MoreButton";
import Description from "../components/Description";
import { TranscodeModal } from "../components/modals/TranscodeModal";
import DownloadTorrentModal from "../components/modals/TorrentDownload";
import { createStore } from "solid-js/store";
import { useNotifications } from "../context/NotificationContext";
import { createAsync, useNavigate } from "@solidjs/router";
import { useProvider } from "../utils/metadataProviders";
import { ServerError } from "../utils/errors";
import { useBackdrop } from "../context/BackdropContext";
import { isCompatible } from "../utils/mediaCapabilities/mediaCapabilities";
import PlayButton from "../components/Description/PlayButton";
import VariantMenuRow from "../components/Description/VariantMenuRow";
import Title from "../utils/Title";

export default function Movie() {
  let notificator = useNotifications();
  let navigator = useNavigate();
  let [movieId, provider] = useProvider();
  let downloadModal: HTMLDialogElement;
  let transcodeModal: HTMLDialogElement;

  let movie = createAsync(async () => {
    let movieQuery = await server.GET("/api/movie/{id}", {
      params: {
        path: {
          id: movieId(),
        },
        query: {
          provider: provider(),
        },
      },
    });

    if (movieQuery.error) {
      if (movieQuery.error.kind == "NotFound") {
        return undefined;
      }
      throw new ServerError(movieQuery.error.message);
    }

    let episode = movieQuery.data;

    let local_id: number | undefined;
    if (episode.metadata_provider === "local") {
      local_id = +movieId();
    } else {
      local_id = await server
        .GET("/api/external_to_local/{id}", {
          params: {
            query: { provider: episode.metadata_provider },
            path: { id: movieId() },
          },
        })
        .then((r) => r.data?.movie_id ?? undefined);
    }
    return {
      ...movieQuery,
      local_id,
    };
  });

  createEffect(() => {
    let movieData = movie()?.data;
    if (movieData) {
      let localImage =
        movieData?.metadata_provider == "local"
          ? fullUrl("/api/movie/{id}/backdrop", {
              path: { id: +movieData.metadata_id },
            })
          : undefined;
      useBackdrop([localImage, movieData.backdrop ?? undefined]);
    }
  });

  let video = createAsync(async () => {
    if (!movie()?.local_id) return undefined;
    let movie_id = movie()!.local_id!.toString();
    let local_movie = await server.GET("/api/movie/{id}", {
      params: {
        path: {
          id: movie_id,
        },
        query: { provider: "local" },
      },
    });
    if (!local_movie.data) return undefined;
    let video = await server.GET("/api/video/by_content", {
      params: {
        query: { id: +local_movie.data.metadata_id, content_type: "movie" },
      },
    });
    if (video.data) {
      let rows: Row[] = [];
      for (let variant of video.data.variants) {
        let capabilities = await isCompatible(
          variant.video_tracks.find((t) => t.is_default)!,
          variant.audio_tracks.find((t) => t.is_default)!,
        );
        let href = `${watchUrl()}?variant=${variant.id}`;
        rows.push({
          custom: (
            <VariantMenuRow
              variant={variant}
              href={href}
              compatability={capabilities.combined}
            />
          ),
        });
      }
      setContextMenu(5, {
        title: `Watch variant (${rows.length})`,
        expanded: rows,
      });
    }
    return video;
  });

  let videoCompatability = createAsync(async () => {
    let videoData = video()?.data;
    return videoData
      ? await isCompatible(
          videoData.video_tracks.find((t) => t.is_default) ??
            videoData.video_tracks[0],
          videoData.audio_tracks.find((t) => t.is_default) ??
            videoData.audio_tracks[0],
        )
      : undefined;
  });

  let deletePreviews = async () => {
    return await server
      .DELETE("/api/video/{id}/previews", {
        params: { path: { id: +video()!.data!.id } },
      })
      .then(() => {
        notificator("Cleared previews");
      })
      .catch(() => {
        notificator("Failed to clear previews");
      })
      .finally(() => {
        revalidatePath("/api/video/by_content");
      });
  };

  let generatePreviews = async () => {
    return server
      .POST("/api/video/{id}/previews", {
        params: { path: { id: +video()!.data!.id } },
      })
      .finally(() => {
        revalidatePath("/api/video/by_content");
      });
  };

  let torrentQuery = () => {
    let movieData = movie()?.data;
    if (!movieData) return undefined;
    return `${movieData.title}`;
  };

  async function startLiveTranscoding() {
    let videoId = video()?.data?.id;
    if (!videoId) return;
    let res = await server.POST("/api/video/{id}/stream_transcode", {
      params: { path: { id: videoId } },
    });
    if (res.data) {
      navigator(watchUrl() + `?stream_id=${res.data.id}`);
    }
  }

  let defaultVideo = () =>
    video()?.data && defaultTrack(video()!.data!.video_tracks);
  let defaultAudio = () =>
    video()?.data && defaultTrack(video()!.data!.audio_tracks);

  let [contextMenu, setContextMenu] = createStore<Row[]>([
    { title: "Download", onClick: () => downloadModal?.showModal() },
    { title: "Transcode", onClick: () => transcodeModal?.showModal() },
    { title: "Live transcode", onClick: startLiveTranscoding },
    { title: "Generate previews", onClick: generatePreviews },
    { title: "Delete previews", onClick: deletePreviews },
    {
      title: "Watch variant (0)",
      expanded: [],
    },
  ]);

  let watchUrl = () => {
    let id = provider() == "local" ? +movieId() : movie()?.local_id;
    if (id) return `/movies/${id}/watch`;
  };

  return (
    <>
      <Title text={movie()?.data.title} />
      <Show when={torrentQuery() && movie()?.data}>
        <DownloadTorrentModal
          metadata_id={movie()!.data!.metadata_id}
          onClose={() => downloadModal!.close()}
          metadata_provider={provider()}
          query={torrentQuery()!}
          content_type="show"
          ref={downloadModal!}
        />
      </Show>
      <Show when={video()?.data}>
        {(data) => <TranscodeModal ref={transcodeModal!} video={data()} />}
      </Show>
      <div class="space-y-5 p-4">
        <Show when={movie()?.data}>
          {(movie) => {
            let localPosterUrl =
              movie().metadata_provider == "local"
                ? fullUrl("/api/episode/{id}/poster", {
                    path: { id: +movie()!.metadata_id },
                  })
                : undefined;

            return (
              <Description
                title={movie().title}
                localPoster={localPosterUrl}
                plot={movie().plot}
                poster={movie().poster}
                imageDirection="horizontal"
              >
                <div class="flex items-center gap-2 pt-4">
                  <Show when={video()?.data && watchUrl()}>
                    {(_) => (
                      <PlayButton
                        href={watchUrl()!}
                        canPlay={videoCompatability()}
                      />
                    )}
                  </Show>
                  <MoreButton rows={contextMenu} />
                </div>
              </Description>
            );
          }}
        </Show>
        <Show when={video()?.data}>
          {(data) => (
            <>
              <ContentSectionContainer title="Video configuration">
                <div class="flex flex-wrap gap-20">
                  <Info
                    key="Resolution"
                    value={`${defaultVideo()!.resolution.width}x${defaultVideo()!.resolution.height}`}
                  ></Info>
                  <Info
                    key="Framerate"
                    value={`@${Math.round(defaultVideo()!.framerate)}`}
                  ></Info>
                  <Info
                    key="Video codec"
                    value={`${formatCodec(defaultVideo()!.codec)}`}
                  ></Info>
                  <Info
                    key="Audio codec"
                    value={`${formatCodec(defaultAudio()!.codec)}`}
                  ></Info>
                </div>
              </ContentSectionContainer>
            </>
          )}
        </Show>
      </div>
    </>
  );
}
