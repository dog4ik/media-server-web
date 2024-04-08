import { createAsync, useParams } from "@solidjs/router";
import { Show } from "solid-js";
import Description from "../components/Description";
import {
  getLocalByExternalId,
  getContentsVideo,
  getEpisode,
} from "../utils/serverApi";
import VersionSlider from "../components/VersionSlider";
import { TranscodePayload, transcodeVideo } from "../utils/serverApi";
import { useNotifications } from "../context/NotificationContext";
import { useProvider } from "../utils/metadataProviders";
import ContentSectionContainer, {
  Info,
} from "../components/generic/ContentSectionContainer";
import DownloadTorrentModal from "../components/modals/TorrentDownload";
import { NotFoundError } from "../utils/errors";

function parseParams() {
  let params = useParams();
  if (!+params.episode || !+params.season) {
    throw Error("params are wrong");
  }
  return [() => +params.episode, () => +params.season] as const;
}

function catchNotFound(e: any) {
  if (e instanceof NotFoundError) {
    return undefined;
  }
  throw e;
}

export default function Episode() {
  let notificator = useNotifications();
  let [episodeNumber, seasonNumber] = parseParams();
  let [showId, provider] = useProvider();
  let downloadModal: HTMLDialogElement;

  let episode = createAsync(async () => {
    let episode = await getEpisode(
      showId(),
      seasonNumber(),
      episodeNumber(),
      provider(),
    );

    let local_id: number | undefined;
    if (episode.metadata_provider === "local") {
      local_id = +showId();
    } else {
      local_id = await getLocalByExternalId(showId(), episode.metadata_provider)
        .then((r) => r.show_id)
        .catch(() => undefined);
    }
    return {
      ...episode,
      local_id,
    };
  });

  let video = createAsync(async () => {
    if (!episode()?.local_id) return undefined;
    let show_id = episode()!.local_id!.toString();
    let local_episode = await getEpisode(
      show_id,
      seasonNumber(),
      episodeNumber(),
      "local",
    ).catch(catchNotFound);
    if (!local_episode) return undefined;
    let video = await getContentsVideo(local_episode.metadata_id, "show");
    return video;
  });

  let commitVariant = async (payload: TranscodePayload["payload"]) => {
    let videoId = video()?.id;
    if (videoId) {
      transcodeVideo({ payload, video_id: +videoId })
        .then(() => notificator("success", "Created transcode job"))
        .catch(() => notificator("error", "Failed to create transcode job"));
    }
  };

  return (
    <>
      <Show when={episode()}>
        <DownloadTorrentModal
          metadata_id={showId()}
          metadata_provider={provider()}
          content_type="show"
          name={episode()!.title}
          ref={downloadModal!}
        />
      </Show>
      <div class="space-y-5 p-4">
        <Show when={episode()}>
          <Description
            title={episode()!.title}
            plot={episode()!.plot}
            poster={episode()!.poster}
            imageDirection="horizontal"
            additionalInfo={[]}
          >
            <Show when={video()}>
              <span>Available locally</span>
            </Show>
            <button
              onClick={() => downloadModal?.showModal()}
              class="btn btn-success"
            >
              Download
            </button>
          </Description>
        </Show>
        <Show when={video()}>
          <ContentSectionContainer title="Video configuration">
            <div class="flex flex-wrap gap-20">
              <Info
                key="Resolution"
                value={`${video()!.video_tracks[0].resolution.width}x${video()!.video_tracks[0].resolution.height}`}
              ></Info>
              <Info
                key="Framerate"
                value={`@${Math.round(video()!.video_tracks[0].framerate)}`}
              ></Info>
            </div>
          </ContentSectionContainer>
        </Show>
        <Show when={video()}>
          <VersionSlider
            videoId={video()!.id}
            variants={[video()!, ...video()!.variants]}
            onCommit={commitVariant}
          />
        </Show>
      </div>
    </>
  );
}
