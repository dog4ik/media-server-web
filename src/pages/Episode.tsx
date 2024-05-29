import { createAsync, useLocation, useParams } from "@solidjs/router";
import { Show, createEffect } from "solid-js";
import Description from "../components/Description";
import VersionSlider from "../components/VersionSlider";
import {
  Schemas,
  defaultTrack,
  formatCodec,
  fullUrl,
  revalidatePath,
  server,
} from "../utils/serverApi";
import { useNotifications } from "../context/NotificationContext";
import { useProvider } from "../utils/metadataProviders";
import ContentSectionContainer, {
  Info,
} from "../components/generic/ContentSectionContainer";
import DownloadTorrentModal from "../components/modals/TorrentDownload";
import { NotFoundError, ServerError } from "../utils/errors";
import { useBackdrop } from "../context/BackdropContext";
import MoreButton, { Row } from "../components/ContextMenu/MoreButton";
import PlayButton from "../components/Description/PlayButton";
import { TranscodeModal } from "../components/modals/TranscodeModal";
import { isCompatible } from "../utils/mediaCapabilities/mediaCapabilities";
import VariantMenuRow from "../components/Description/VariantMenuRow";
import { createStore } from "solid-js/store";

function parseParams() {
  let params = useParams();
  if (!+params.episode || !+params.season) {
    throw Error("params are wrong");
  }
  return [() => +params.episode, () => +params.season] as const;
}

function pad(num: number) {
  return num.toString().padStart(2, "0");
}

export default function Episode() {
  let notificator = useNotifications();
  let [episodeNumber, seasonNumber] = parseParams();
  let [showId, provider] = useProvider();
  let downloadModal: HTMLDialogElement;
  let transcodeModal: HTMLDialogElement;

  let episode = createAsync(async () => {
    let episodeQuery = await server.GET("/api/show/{id}/{season}/{episode}", {
      params: {
        path: {
          id: showId(),
          season: seasonNumber(),
          episode: episodeNumber(),
        },
        query: {
          provider: provider(),
        },
      },
    });

    if (episodeQuery.error) {
      if (episodeQuery.error.kind == "NotFound") {
        throw new NotFoundError(episodeQuery.error.message);
      }
      throw new ServerError(episodeQuery.error.message);
    }

    let episode = episodeQuery.data;

    let local_id: number | undefined;
    if (episode.metadata_provider === "local") {
      local_id = +showId();
    } else {
      local_id = await server
        .GET("/api/external_to_local/{id}", {
          params: {
            query: { provider: episode.metadata_provider },
            path: { id: episode.metadata_id },
          },
        })
        .then((r) => r.data?.show_id ?? undefined)
        .catch(() => undefined);
    }
    return {
      ...episodeQuery,
      local_id,
    };
  });

  let show = createAsync(async () => {
    return await server.GET("/api/show/{id}", {
      params: { path: { id: showId() }, query: { provider: provider() } },
    });
  });

  createEffect(() => {
    let showData = show()?.data;
    if (showData) {
      let localImage =
        showData?.metadata_provider == "local"
          ? fullUrl("/api/show/{id}/backdrop", {
              path: { id: +showData.metadata_id },
            })
          : undefined;
      useBackdrop([localImage, showData.backdrop ?? undefined]);
    }
  });

  let video = createAsync(async () => {
    if (!episode()?.local_id) return undefined;
    let show_id = episode()!.local_id!.toString();
    let local_episode = await server.GET("/api/show/{id}/{season}/{episode}", {
      params: {
        path: {
          id: show_id,
          season: seasonNumber(),
          episode: episodeNumber(),
        },
        query: { provider: "local" },
      },
    });
    if (!local_episode.data) return undefined;
    let video = await server.GET("/api/video/by_content", {
      params: {
        query: { id: +local_episode.data.metadata_id, content_type: "show" },
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
      setContextMenu(4, {
        title: "Watch Variant",
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

  let commitVariant = async (payload: Schemas["TranscodePayload"]) => {
    let videoId = video()?.data?.id;
    if (videoId) {
      server
        .POST("/api/video/{id}/transcode", {
          params: { path: { id: +videoId } },
          body: payload,
        })
        .then(() => notificator("success", "Created transcode job"))
        .catch(() => notificator("error", "Failed to create transcode job"));
    }
  };

  let deletePreviews = async () => {
    return await server
      .DELETE("/api/video/{id}/previews", {
        params: { path: { id: +video()!.data!.id } },
      })
      .then(() => {
        notificator("success", "Cleared previews");
      })
      .catch(() => {
        notificator("error", "Failed to clear previews");
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
    let showData = show()?.data;
    let episodeData = episode()?.data;
    if (!episodeData || !showData) return undefined;
    return `${showData.title} S${pad(episodeData.season_number)}E${pad(episodeData.number)}`;
  };

  let defaultVideo = () =>
    video()?.data && defaultTrack(video()!.data!.video_tracks);
  let defaultAudio = () =>
    video()?.data && defaultTrack(video()!.data!.audio_tracks);

  let [contextMenu, setContextMenu] = createStore<Row[]>([
    { title: "Download", onClick: () => downloadModal?.showModal() },
    { title: "Transcode", onClick: () => transcodeModal?.showModal() },
    { title: "Generate previews", onClick: generatePreviews },
    { title: "Delete previews", onClick: deletePreviews },
    { title: "Watch variant", expanded: [] },
  ]);

  let watchUrl = () =>
    `/shows/${showId()}/${seasonNumber()}/${episodeNumber()}/watch`;

  return (
    <>
      <Show when={torrentQuery() && show()?.data}>
        <DownloadTorrentModal
          metadata_id={show()!.data!.metadata_id}
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
        <Show when={episode()?.data}>
          {(episode) => {
            let descriptionImage =
              episode().metadata_provider == "local"
                ? fullUrl("/api/episode/{id}/poster", {
                    path: { id: +episode()!.metadata_id },
                  })
                : undefined;

            return (
              <Description
                title={episode().title}
                localPoster={descriptionImage}
                plot={episode().plot}
                poster={episode().poster}
                imageDirection="horizontal"
                additionalInfo={[
                  {
                    info: `${show()?.data?.title}`,
                    href: `/shows/${showId()}`,
                  },
                  {
                    info: `Season ${episode().season_number}`,
                    href: `/shows/${showId()}?season=${episode().season_number}`,
                  },
                  { info: `Episode ${episode().number}` },
                ]}
              >
                <div class="flex items-center gap-2 pt-4">
                  <Show when={video()?.response}>
                    {(_) => (
                      <PlayButton
                        href={watchUrl()}
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
              <VersionSlider
                video={data()}
                videoId={data().id}
                variants={data().variants}
                onCommit={commitVariant}
              />
            </>
          )}
        </Show>
      </div>
    </>
  );
}
