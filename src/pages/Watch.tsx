import {
  A,
  BeforeLeaveEventArgs,
  createAsync,
  useBeforeLeave,
  useLocation,
  useParams,
} from "@solidjs/router";
import { NotFoundError, InternalServerError } from "../utils/errors";
import VideoPlayer, { StreamingMethod } from "../components/VideoPlayer";
import { Schemas, fullUrl, server } from "../utils/serverApi";
import { onCleanup, ParentProps, Show } from "solid-js";
import { Meta } from "@solidjs/meta";
import { formatSE } from "../utils/formats";
import Title from "../utils/Title";
import { fetchEpisode, fetchMovie, fetchShow } from "@/utils/library";

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
  video: Schemas["DetailedVideo"];
  intro?: Schemas["Intro"];
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
    let moviePromise = fetchMovie(movieId, "local");
    let videoQuery = server.GET("/api/video/by_content", {
      params: { query: { id: +movieId, content_type: "movie" } },
    });
    let [movie, video] = await Promise.all([moviePromise, videoQuery]);

    if (video.error) {
      throw new InternalServerError(
        "Video is not found, consider refreshing library",
      );
    }
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = movieMediaSessionMetadata(movie);
    }
    return { video: video.data, movie, stream };
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
          >
            <div class="absolute left-5 top-5">
              <A href={`/movies/${data().movie.metadata_id}`}>
                <span class="text-2xl hover:underline">
                  {data().movie.title}
                </span>
              </A>
            </div>
          </Watch>
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
    let episode = await fetchEpisode(
      params.showId,
      params.season,
      params.episode,
      "local",
    );
    let video = await server.GET("/api/video/by_content", {
      params: {
        query: { id: +episode.metadata_id, content_type: "show" },
      },
    });
    let show = await fetchShow(params.showId, "local");
    if (video.error) {
      throw new InternalServerError(
        "Video is not found, consider refreshing library",
      );
    }

    if ("mediaSession" in navigator) {
      showMediaSessionMetadata(params.showId, episode).then(
        (data) => (navigator.mediaSession.metadata = data),
      );
    }
    return { video: video.data, episode, show };
  });

  let stream = () => (episode() ? getUrl(episode()!.video.id) : undefined);

  let showUrl = () => `/shows/${params.showId}`;
  let seasonUrl = () => `/shows/${params.showId}/?season=${params.season}`;
  let episodeUrl = () =>
    `/shows/${params.showId}/${params.season}/${params.episode}`;
  return (
    <>
      <Show when={episode()}>
        {(data) => (
          <>
            <Title
              text={`${data().show.title} S${formatSE(data().episode.season_number)}E${formatSE(data().episode.number)}`}
            />
            <Meta property="og-image" content={data().episode.poster ?? ""} />
            <Watch
              intro={data().video.intro ?? undefined}
              video={data().video}
              url={stream()!.url}
              streamingMethod={stream()!.method}
            >
              <div class="absolute left-5 top-5 flex flex-col">
                <span class="text-2xl">{data().episode.title}</span>
                <div class="flex gap-2">
                  <A href={showUrl()}>
                    <span class="text-sm hover:underline">
                      {data().show.title}
                    </span>
                  </A>
                  <A href={seasonUrl()}>
                    <span class="text-sm hover:underline">
                      Season {data().episode.season_number}
                    </span>
                  </A>
                  <A href={episodeUrl()}>
                    <span class="text-sm hover:underline">
                      Episode {data().episode.number}
                    </span>
                  </A>
                </div>
              </div>
            </Watch>
          </>
        )}
      </Show>
    </>
  );
}

function Watch(props: WatchProps & ParentProps) {
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
      intro={props.intro}
      streamingMethod={props.streamingMethod}
      initialTime={props.video.history?.time ?? 0}
      onAudioError={handleAudioError}
      onVideoError={handleVideoError}
      onHistoryUpdate={(time) => updateHistory(time)}
      subtitles={subtitles()}
      src={props.url}
      previews={
        props.video.previews_count > 0
          ? {
              previewsAmount: props.video.previews_count,
              videoId: props.video.id,
            }
          : undefined
      }
    >
      {props.children}
    </VideoPlayer>
  );
}
