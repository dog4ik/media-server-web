import {
  BeforeLeaveEventArgs,
  createAsync,
  useBeforeLeave,
  useLocation,
  useParams,
} from "@solidjs/router";
import { NotFoundError, ServerError } from "../utils/errors";
import VideoPlayer, { StreamingMethod } from "../components/VideoPlayer";
import { Schemas, fullUrl, server } from "../utils/serverApi";
import { onCleanup, Show } from "solid-js";
import { Meta } from "@solidjs/meta";
import { formatSE } from "../utils/formats";
import Title from "../utils/Title";

export type SubtitlesOrigin = "container" | "api" | "local" | "imported";

export type Subtitle = {
  fetch: () => Promise<string>;
  origin: SubtitlesOrigin;
  language?: Schemas["DetailedSubtitleTrack"]["language"];
};

function streamUrl(streamId: string) {
  return fullUrl("/api/transcode/{id}/manifest", { path: { id: streamId } });
}

function getUrl(videoId: number): { url: string; method: StreamingMethod } {
  let location = useLocation<{ variant: string }>();
  let query = location.query;
  let streamId: string | undefined = query.stream_id;
  if (streamId) {
    return { url: streamUrl(streamId), method: "hls" };
  }
  let variant: string | undefined = query.variant;
  let url = fullUrl("/api/video/{id}/watch", {
    query: variant ? { variant } : undefined,
    path: { id: videoId },
  });
  return { url, method: "progressive" };
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
  url: string;
  streamingMethod: StreamingMethod;
  title: string;
  video: Schemas["DetailedVideo"];
};

function movieMediaSessionMetadata(movie: Schemas["MovieMetadata"]) {
  let posterUrl = fullUrl("/api/movie/{id}/poster", {
    path: { id: +movie.metadata_id },
  });
  let artwork: NonNullable<MediaMetadataInit["artwork"]> = [];
  let moviePosterSize = "120x180";
  artwork.push({
    src: posterUrl,
    sizes: moviePosterSize,
    type: "image/jpeg",
  });
  if (movie.poster) {
    artwork.push({
      src: movie.poster,
      sizes: moviePosterSize,
      type: "image/jpeg",
    });
  }
  return new MediaMetadata({
    title: movie.title,
    artwork: artwork,
  });
}

export function WatchMovie() {
  let movieId = parseMovieParams();
  let movie = createAsync(async () => {
    let movieQuery = await server.GET("/api/movie/{id}", {
      params: { query: { provider: "local" }, path: { id: movieId } },
    });
    let videoQuery = await server.GET("/api/video/by_content", {
      params: { query: { id: +movieId, content_type: "movie" } },
    });
    let [movie, video] = await Promise.all([movieQuery, videoQuery]);

    if (movie.error) {
      if (movie.error.kind == "NotFound")
        throw new NotFoundError("Movie is not found");
      throw new ServerError(movie.error.message);
    }

    if (video.error) {
      throw new ServerError("Video is not found, consider refreshing library");
    }
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = movieMediaSessionMetadata(movie.data);
    }
    return { video: video.data, movie: movie.data, stream };
  });
  let stream = () => (movie() ? getUrl(movie()!.video.id) : undefined);
  return (
    <>
      <Show when={movie()}>
        {(data) => (
          <Watch
            url={stream()!.url}
            streamingMethod={stream()!.method}
            video={data().video}
            title={data().movie.title}
          />
        )}
      </Show>
    </>
  );
}

async function showMediaSessionMetadata(
  showId: string,
  episode: Schemas["EpisodeMetadata"],
) {
  let show = await server
    .GET("/api/show/{id}", {
      params: {
        query: { provider: "local" },
        path: {
          id: showId,
        },
      },
    })
    .then((res) => res.data);
  let posterUrl = fullUrl("/api/episode/{id}/poster", {
    path: { id: +episode.metadata_id },
  });
  let artwork: NonNullable<MediaMetadataInit["artwork"]> = [];
  let episodePosterSize = "342x192";
  artwork.push({
    src: posterUrl,
    sizes: episodePosterSize,
    type: "image/jpeg",
  });
  if (episode.poster) {
    artwork.push({
      src: episode.poster,
      sizes: episodePosterSize,
      type: "image/jpeg",
    });
  }
  return new MediaMetadata({
    title: `S${formatSE(episode.season_number)}E${formatSE(episode.number)}: ${episode.title}`,
    artist: show?.title,
    artwork: artwork,
  });
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

    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = await showMediaSessionMetadata(
        params.showId,
        episode.data,
      );
    }
    return { video: video.data, episode: episode.data };
  });

  let stream = () => (episode() ? getUrl(episode()!.video.id) : undefined);

  return (
    <>
      <Show when={episode()}>
        {(data) => (
          <>
            <Title
              text={`S${formatSE(data().episode.season_number)}E${formatSE(data().episode.number)}`}
            />
            <Meta property="og-image" content={data().episode.poster ?? ""} />
            <Watch
              video={data().video}
              url={stream()!.url}
              streamingMethod={stream()!.method}
              title={`${data().episode.title}`}
            />
          </>
        )}
      </Show>
    </>
  );
}

function Watch(props: WatchProps) {
  function handleAudioError() {
    console.log("audio error encountered");
  }

  function handleVideoError() {
    console.log("video error encountered");
  }
  let link = props.url;
  let streaming_method = props.streamingMethod;

  async function handleUnload(_: BeforeUnloadEvent | BeforeLeaveEventArgs) {
    if (streaming_method == "hls") {
      let url = new URL(link);
      let id = url.pathname.split("/").at(3);
      if (id) {
        await server.DELETE("/api/tasks/{id}", {
          params: { path: { id } },
          keepalive: true,
        });
      }
    }
  }

  window.addEventListener("beforeunload", handleUnload);
  useBeforeLeave(handleUnload);
  onCleanup(() => {
    window.removeEventListener("beforeunload", handleUnload);
  });

  let subtitles = () => {
    let subtitles: Subtitle[] = [];
    let video = props.video;
    if (video) {
      for (let i = 0; i < video.subtitle_tracks.length; i++) {
        let subtitleTrack = video.subtitle_tracks[i];
        subtitles.push({
          fetch: () =>
            server
              .GET("/api/video/{id}/pull_subtitle", {
                params: {
                  path: { id: video.id },
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
    let totalDuration = props.video.duration.secs;
    if (!totalDuration) return;
    let is_finished = (time / totalDuration) * 100 >= 90;

    server.PUT("/api/video/{id}/history", {
      body: { time: time, is_finished },
      params: { path: { id: props.video.id } },
    });
  }

  return (
    <VideoPlayer
      streamingMethod={props.streamingMethod}
      initialTime={props.video.history?.time ?? 0}
      onAudioError={handleAudioError}
      onVideoError={handleVideoError}
      onHistoryUpdate={(time) => updateHistory(time)}
      subtitles={subtitles()}
      src={props.url}
      title={props.title}
      previews={
        props.video.previews_count > 0
          ? {
              previewsAmount: props.video.previews_count,
              videoId: props.video.id,
            }
          : undefined
      }
    />
  );
}
