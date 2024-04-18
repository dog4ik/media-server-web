import { createAsync, useLocation, useParams } from "@solidjs/router";
import { NotFoundError } from "../utils/errors";
import VideoPlayer from "../components/VideoPlayer";
import {
  getVideoById,
  getVideoUrl,
  pullVideoSubtitle,
  updateHistory,
} from "../utils/serverApi";
import { Show } from "solid-js";

export type SubtitlesOrigin = "container" | "api" | "local" | "imported";

export type Subtitle = {
  fetch: () => Promise<string>;
  origin: SubtitlesOrigin;
  language?: string;
};

function videoUrl() {
  let params = useParams();
  let location = useLocation<{ variant: string }>();
  let query = location.query;

  let videoId = +params.video_id;
  if (isNaN(videoId)) {
    throw new NotFoundError();
  }
  let variant: string | undefined = query.variant;
  return getVideoUrl(videoId, variant);
}

function parseVideoParam() {
  let params = useParams();
  let videoId = +params.video_id;
  if (isNaN(videoId)) {
    throw new NotFoundError();
  }
  return () => +params.video_id;
}

export default function Watch() {
  let url = videoUrl();
  let videoId = parseVideoParam();
  let video = createAsync(async () => {
    return await getVideoById(videoId());
  });
  function handleAudioError() {
    console.log("audio error encountered");
  }

  function handleVideoError() {
    console.log("video error encountered");
  }

  let subtitles = () => {
    let subtitles: Subtitle[] = [];
    if (video()) {
      for (let i = 0; i < video()!.subtitle_tracks.length; i++) {
        let subtitleTrack = video()!.subtitle_tracks[i];
        subtitles.push({
          fetch: () => pullVideoSubtitle(video()!.id, i),
          origin: "container",
          language: subtitleTrack.language,
        });
      }
    }
    return subtitles;
  };

  return (
    <Show when={video()}>
      <VideoPlayer
        initialTime={video()?.history?.time ?? 0}
        onAudioError={handleAudioError}
        onVideoError={handleVideoError}
        onHistoryUpdate={(time) =>
          updateHistory({ video_id: videoId(), time, is_finished: false })
        }
        subtitles={subtitles()}
        src={url.toString()}
        title="Test title, very good title"
      />
    </Show>
  );
}
