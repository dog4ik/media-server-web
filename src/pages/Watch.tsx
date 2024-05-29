import { createAsync, useLocation, useParams } from "@solidjs/router";
import { NotFoundError, ServerError } from "../utils/errors";
import VideoPlayer from "../components/VideoPlayer";
import { MEDIA_SERVER_URL, Schemas, fullUrl, server } from "../utils/serverApi";
import { Show } from "solid-js";

export type SubtitlesOrigin = "container" | "api" | "local" | "imported";

export type Subtitle = {
  fetch: () => Promise<string>;
  origin: SubtitlesOrigin;
  language?: Schemas["DetailedSubtitleTrack"]["language"];
};

function videoUrl(videoId: number) {
  let location = useLocation<{ variant: string }>();
  let query = location.query;

  let variant: string | undefined = query.variant;
  return fullUrl("/api/video/{id}/watch", {
    query: variant ? { variant } : undefined,
    path: { id: videoId },
  });
}

function parseShowParams() {
  let params = useParams();
  return {
    showId: params.id,
    season: +params.season,
    episode: +params.episode,
  };
}

function parseMovieParams() {
  let params = useParams();
  return params.id;
}

type WatchProps = {
  videoId: number;
  title: string;
};

export function WatchMovie() {
  let movieId = parseMovieParams();
  let movie = createAsync(async () => {
    let movie = await server.GET("/api/movie/{id}", {
      params: { query: { provider: "local" }, path: { id: movieId } },
    });
    if (movie.error) {
      if (movie.error.kind == "NotFound")
        throw new NotFoundError("Movie is not found");
      throw new ServerError(movie.error.message);
    }
    let video = await server.GET("/api/video/by_content", {
      params: { query: { id: +movie.data.metadata_id, content_type: "movie" } },
    });
    if (video.error) {
      throw new ServerError("Video is not found, consider refreshing library");
    }
    return { video: video.data, movie: movie.data };
  });
  return (
    <>
      <Show when={movie()}>
        {(data) => (
          <Watch videoId={data().video.id} title={data().movie.title} />
        )}
      </Show>
    </>
  );
}

export function WatchShow() {
  let params = parseShowParams();
  let episode = createAsync(async () => {
    let episode = await server.GET("/api/show/{id}/{season}/{episode}", {
      params: {
        query: { provider: "local" },
        path: {
          id: params.showId,
          season: params.season,
          episode: params.episode,
        },
      },
    });
    if (episode.error) {
      if (episode.error.kind == "NotFound")
        throw new NotFoundError("Episode is not found");
      throw new ServerError(episode.error.message);
    }
    let video = await server.GET("/api/video/by_content", {
      params: {
        query: { id: +episode.data.metadata_id, content_type: "show" },
      },
    });
    if (video.error) {
      throw new ServerError("Video is not found, consider refreshing library");
    }
    return { video: video.data, show: episode.data };
  });
  return (
    <>
      <Show when={episode()}>
        {(data) => (
          <Watch videoId={data().video.id} title={`${data().show.title}`} />
        )}
      </Show>
    </>
  );
}

function Watch(props: WatchProps) {
  let url = videoUrl(props.videoId);
  let video = createAsync(async () => {
    return await server.GET("/api/video/{id}", {
      params: { path: { id: props.videoId } },
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
    let totalDuration = video()?.data?.duration.secs;
    if (!totalDuration) return;
    let is_finished = (time / totalDuration) * 100 >= 90;

    server.PUT("/api/history/{id}", {
      body: { time: time, is_finished },
      params: { path: { id: props.videoId } },
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
          title={props.title}
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
