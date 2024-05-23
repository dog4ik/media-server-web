import { createAsync, useLocation, useParams } from "@solidjs/router";
import { NotFoundError } from "../utils/errors";
import VideoPlayer from "../components/VideoPlayer";
import { MEDIA_SERVER_URL, fullUrl, server } from "../utils/serverApi";
import { Show } from "solid-js";
import { components } from "../client/types";

export type SubtitlesOrigin = "container" | "api" | "local" | "imported";

export type Subtitle = {
  fetch: () => Promise<string>;
  origin: SubtitlesOrigin;
  language?: components["schemas"]["DetailedSubtitleTrack"]["language"];
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
  return fullUrl("/api/video/{id}/watch", {
    query: variant ? { variant } : undefined,
    path: { id: videoId },
  });
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
    return await server.GET("/api/video/{id}", {
      params: { path: { id: videoId() } },
    });
  });
  function handleAudioError() {
    console.log("audio error encountered");
  }

  function handleVideoError() {
    console.log("video error encountered");
  }

  let subtitles = () => {
    let subtitles: Subtitle[] = [];
    let data = video()?.data;
    if (data) {
      for (let i = 0; i < video()!.data!.subtitle_tracks.length; i++) {
        let subtitleTrack = video()!.data!.subtitle_tracks[i];
        subtitles.push({
          fetch: () =>
            server
              .GET("/api/video/{id}/pull_subtitle", {
                params: {
                  path: { id: data.id },
                  query: { number: i },
                },
                parseAs: "text",
              })
              .then((d) => d.data!),
          origin: "container",
          language: subtitleTrack.language,
        });
      }
    }
    return subtitles;
  };

  function updateHistory(time: number) {
    server.PUT("/api/history/{id}", {
      body: { time: time, is_finished: false },
      params: { path: { id: videoId() } },
    });
  }

  return (
    <Show when={video()?.data}>
      {(data) => (
        <VideoPlayer
          initialTime={data().history?.time ?? 0}
          onAudioError={handleAudioError}
          onVideoError={handleVideoError}
          onHistoryUpdate={(time) => updateHistory(time)}
          subtitles={subtitles()}
          src={url.toString()}
          title="Test title, very good title"
          previews={
            data().previews_count > 0
              ? {
                previewsAmount: data().previews_count,
                previewsSource:
                  MEDIA_SERVER_URL + `/api/previews?id=${data().id}`,
              }
              : undefined
          }
        />
      )}
    </Show>
  );
}
