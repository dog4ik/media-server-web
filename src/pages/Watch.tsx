import {
  A,
  BeforeLeaveEventArgs,
  createAsync,
  useBeforeLeave,
  useLocation,
  useParams,
} from "@solidjs/router";
import {
  InternalServerError,
  NotFoundError,
  notifyResponseErrors,
  throwResponseErrors,
} from "../utils/errors";
import VideoPlayer, { NextVideo } from "../components/VideoPlayer";
import { Schemas, fullUrl, server } from "../utils/serverApi";
import { onCleanup, ParentProps, Show } from "solid-js";
import { Meta } from "@solidjs/meta";
import { formatSE } from "../utils/formats";
import Title from "../utils/Title";
import {
  fetchEpisode,
  fetchMovie,
  fetchShow,
  Media,
  Video,
} from "@/utils/library";
import tracing from "@/utils/tracing";
import TracksSelectionProvider from "./Watch/TracksSelectionContext";
import { useServerStatus } from "@/context/ServerStatusContext";
import { useNotificationsContext } from "@/context/NotificationContext";
import { containerSupport } from "@/utils/mediaCapabilities";

export type SubtitlesOrigin = "container" | "api" | "local" | "imported";

export type Subtitle = {
  fetch: () => Promise<string>;
  origin: SubtitlesOrigin;
  language?: Schemas["DetailedSubtitleTrack"]["language"];
};

function hlsStreamUrl(streamId: string) {
  return fullUrl("/api/watch/hls/{id}/manifest", { path: { id: streamId } });
}

function directStreamUrl(videoId: number) {
  let url = fullUrl("/api/video/{id}/watch", {
    query: undefined,
    path: { id: videoId },
  });
  return url;
}

function parseShowParams() {
  let params = useParams();
  return {
    showId: () => params.id,
    season: () => +params.season,
    episode: () => +params.episode,
  };
}

function parseMovieParams() {
  let params = useParams();
  return () => params.id;
}

function parseVideoIdQuery() {
  let l = useLocation();
  return () => {
    if (Array.isArray(l.query.video)) {
      return undefined;
    }
    let int = parseInt(l.query.video);
    if (isNaN(int)) {
      return;
    }
    return int;
  };
}

type WatchProps = {
  video: Video;
  media?: Media;
  next?: NextVideo;
} & ParentProps;

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
  let videoIdQuery = parseVideoIdQuery();
  let movie = createAsync(async () => {
    let moviePromise = fetchMovie(movieId(), "local");
    let videoQuery = server.GET("/api/video/by_content", {
      params: { query: { id: +movieId(), content_type: "movie" } },
    });
    let [movie, videos] = await Promise.all([moviePromise, videoQuery]);

    if (videos.error !== undefined || !videos.data) {
      throw new InternalServerError(
        "Video is not found, consider refreshing library",
      );
    }
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = movieMediaSessionMetadata(movie);
    } else {
      tracing.warn("Media session api is not supported by the browser");
    }

    let video = (() => {
      let v = videoIdQuery()
        ? videos.data.find((v) => v.id == videoIdQuery())
        : videos.data.at(0);
      if (!v) {
        throw new NotFoundError(`Show does not contain `);
      }
      return new Video(v);
    })();
    return { video, movie };
  });

  return (
    <>
      <Show when={movie()}>
        {(data) => (
          <Watch media={data().movie} video={data().video}>
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
  let videoIdQuery = parseVideoIdQuery();
  let episode = createAsync(async () => {
    let episode = await fetchEpisode(
      params.showId(),
      params.season(),
      params.episode(),
      "local",
    );
    let videos = await server.GET("/api/video/by_content", {
      params: {
        query: { id: +episode.metadata_id, content_type: "show" },
      },
    });
    let show = await fetchShow(params.showId(), "local");
    if (videos.error || !videos.data) {
      throw new InternalServerError(
        "Video is not found, consider refreshing library",
      );
    }

    if ("mediaSession" in navigator) {
      showMediaSessionMetadata(params.showId(), episode).then(
        (data) => (navigator.mediaSession.metadata = data),
      );
    }
    let video = (() => {
      let v = videoIdQuery()
        ? videos.data.find((v) => v.id == videoIdQuery())
        : videos.data.at(0);
      if (!v) {
        throw new NotFoundError(`Show does not contain `);
      }
      return new Video(v);
    })();
    return { video, episode, show };
  });

  let showUrl = () => `/shows/${params.showId()}`;
  let seasonUrl = () => `/shows/${params.showId()}/?season=${params.season()}`;
  let episodeUrl = (number: number) =>
    `/shows/${params.showId()}/${params.season()}/${number}`;

  let nextEpisode = createAsync<NextVideo | undefined>(async () => {
    try {
      let next = await fetchEpisode(
        params.showId(),
        params.season(),
        params.episode() + 1,
      );
      return {
        url: `${episodeUrl(next.number)}/watch`,
        nextTitle: `S${formatSE(next.season_number)}E${formatSE(next.number)}`,
      };
    } catch {}
  });
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
              media={data().episode}
              next={nextEpisode()}
              video={data().video}
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
                  <A href={episodeUrl(params.episode())}>
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

type StreamParams = (
  | {
      method: "hls";
      audioCodec?: string;
      videoCodec?: string;
    }
  | {
      method: "direct";
    }
) & {
  streamId: string;
  watchUrl: string;
};

function Watch(props: WatchProps) {
  let [{ serverStatus }] = useServerStatus();
  let [, { addNotification }] = useNotificationsContext();
  let streamParams = createAsync<StreamParams>(async () => {
    let compatibility = await props.video.videoCompatibility();
    if (
      compatibility.combined?.supported &&
      containerSupport(props.video.details.container)
    ) {
      tracing.debug("Selected direct playback method");
      let streamId = await server
        .POST("/api/watch/direct/start/{id}", {
          params: { path: { id: props.video.details.id } },
          body: { variant_id: undefined },
        })
        .then(
          notifyResponseErrors(
            addNotification,
            "start direct play job",
            props.media,
          ),
        )
        .then(throwResponseErrors)
        .then((d) => {
          serverStatus.trackWatchSession(d.task_id);
          return d.task_id;
        });
      return {
        method: "direct",
        streamId,
        watchUrl: directStreamUrl(props.video.details.id),
      };
    } else {
      let audio_codec: Schemas["AudioCodec"] | undefined = undefined;
      let video_codec: Schemas["VideoCodec"] | undefined = undefined;
      if (!compatibility.audio?.supported) {
        audio_codec = "aac";
      }
      if (!compatibility.video?.supported) {
        video_codec = "h264";
      }
      tracing.debug(
        {
          video_codec,
          audio_codec,
        },
        "Selected hls playback method",
      );
      let streamId = await server
        .POST("/api/watch/hls/start/{id}", {
          params: { path: { id: props.video.details.id } },
          body: {
            variant_id: undefined,
            audio_codec,
            video_codec,
          },
        })
        .then(
          notifyResponseErrors(addNotification, "start hls job", props.media),
        )
        .then(throwResponseErrors)
        .then(({ task_id }) => {
          serverStatus.trackWatchSession(task_id);
          return task_id;
        });
      return {
        method: "hls",
        audioCodec: audio_codec,
        videoCodec: video_codec,
        streamId,
        watchUrl: hlsStreamUrl(streamId),
      };
    }
  });
  function handleAudioError() {
    tracing.error("audio error encountered");
  }

  function handleVideoError() {
    tracing.error("video error encountered");
  }

  async function handleUnload(_: BeforeUnloadEvent | BeforeLeaveEventArgs) {
    let stream = streamParams();
    let id = stream?.streamId;
    if (id) {
      tracing.debug({ id }, "Cleaning up stream");
      await server
        .DELETE("/api/tasks/watch_session/{id}", {
          params: { path: { id } },
          keepalive: true,
        })
        .then(
          notifyResponseErrors(
            addNotification,
            "clean up watch session",
            props.media,
          ),
        );
    }
  }

  window.addEventListener("beforeunload", handleUnload);
  useBeforeLeave(handleUnload);
  onCleanup(() => {
    window.removeEventListener("beforeunload", handleUnload);
  });

  function updateHistory(time: number) {
    let totalDuration = props.video.details.duration.secs;
    if (!totalDuration) return;
    let is_finished = (time / totalDuration) * 100 >= 90;

    server.PUT("/api/video/{id}/history", {
      body: { time: time, is_finished },
      params: {
        path: { id: props.video.details.id },
        query: { id: streamParams()?.streamId },
      },
    });
  }

  return (
    <TracksSelectionProvider video={props.video}>
      <Show when={streamParams()}>
        {(params) => (
          <VideoPlayer
            intro={props.video.details.intro ?? undefined}
            nextVideo={props.next}
            streamingMethod={params().method}
            initialTime={props.video.details.history?.time ?? 0}
            onAudioError={handleAudioError}
            onVideoError={handleVideoError}
            onHistoryUpdate={updateHistory}
            src={params().watchUrl}
            previews={
              props.video.details.previews_count > 0
                ? {
                    previewsAmount: props.video.details.previews_count,
                    videoId: props.video.details.id,
                  }
                : undefined
            }
          >
            {props.children}
          </VideoPlayer>
        )}
      </Show>
    </TracksSelectionProvider>
  );
}
