import {
  A,
  createAsync,
  useBeforeLeave,
  useLocation,
  useParams,
} from "@solidjs/router";
import {
  NotFoundError,
  notifyResponseErrors,
  throwResponseErrors,
} from "../utils/errors";
import VideoPlayer, { NextVideo } from "../components/VideoPlayer";
import { Schemas, fullUrl, server } from "../utils/serverApi";
import { createMemo, onCleanup, ParentProps, Show } from "solid-js";
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
import Hls from "hls.js";

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
  videos: Video[];
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
  let movie = createAsync(async () => {
    let moviePromise = fetchMovie(movieId(), "local");
    let videoQuery = server
      .GET("/api/video/by_content", {
        params: { query: { id: +movieId(), content_type: "movie" } },
      })
      .then(throwResponseErrors)
      .then((r) => r.map((v) => new Video(v)));
    let [movie, videos] = await Promise.all([moviePromise, videoQuery]);

    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = movieMediaSessionMetadata(movie);
    } else {
      tracing.warn("Media session api is not supported by the browser");
    }

    return { videos, movie };
  });

  return (
    <>
      <Show when={movie()}>
        {(data) => (
          <Watch media={data().movie} videos={data().videos}>
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
      params.showId(),
      params.season(),
      params.episode(),
      "local",
    );
    let videos = await server
      .GET("/api/video/by_content", {
        params: {
          query: { id: +episode.metadata_id, content_type: "show" },
        },
      })
      .then(throwResponseErrors)
      .then((r) => r.map((v) => new Video(v)));
    let show = await fetchShow(params.showId(), "local");

    if ("mediaSession" in navigator) {
      showMediaSessionMetadata(params.showId(), episode).then(
        (data) => (navigator.mediaSession.metadata = data),
      );
    }
    return { videos, episode, show };
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
    } catch { }
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
              videos={data().videos}
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

export type StreamParams = (
  | {
    method: "hls";
    audioCodec?: string;
    videoCodec?: string;
  }
  | {
    method: "direct";
    watchUrl: string;
  }
) & {
  streamId: string;
};

function initHls() {
  let hls = new Hls({
    maxBufferLength: 30,
    lowLatencyMode: false,
    backBufferLength: Infinity,
  });
  hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
    tracing.debug(
      "Manifest loaded, found " + data.levels.length + " quality level",
    );
  });
  hls.on(Hls.Events.BACK_BUFFER_REACHED, (_event, _data) => {
    console.log("back buffer reached");
  });
  hls.on(Hls.Events.BUFFER_EOS, (_event, _data) => {
    console.log("Buffer eos");
  });
  hls.on(Hls.Events.ERROR, (_event, data) => {
    console.log(data);
    if (data.fatal) {
      switch (data.type) {
        case Hls.ErrorTypes.MEDIA_ERROR:
          tracing.error("Fatal media error encountered, trying to recover");
          hls.recoverMediaError();
          break;
        case Hls.ErrorTypes.NETWORK_ERROR:
          tracing.error("Fatal network error encountered trying to recover");
          hls.startLoad();
          break;
        default:
          // cannot recover
          hls.destroy();
          break;
      }
    }
  });
  return hls;
}

function Watch(props: WatchProps) {
  let [{ serverStatus }] = useServerStatus();
  let [, { addNotification }] = useNotificationsContext();

  let streamPending = false;

  let videoIdQuery = parseVideoIdQuery();
  let hls = initHls();

  let video = createMemo(() => {
    let query = videoIdQuery();
    if (props.videos.length === 0) {
      throw new NotFoundError("videos length is 0");
    }
    if (query) {
      return (
        props.videos.find((v) => v.details.id === query) ?? props.videos[0]
      );
    }
    return props.videos[0];
  });

  let streamParams = createAsync<StreamParams>(async () => {
    if (streamPending) {
      await handleUnload();
    }
    let compatibility = await video().videoCompatibility();
    if (
      compatibility.combined?.supported &&
      containerSupport(video().details.container)
    ) {
      tracing.debug("Selected direct playback method");
      let streamId = await server
        .POST("/api/watch/direct/start/{id}", {
          params: { path: { id: video().details.id } },
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
      streamPending = true;
      return {
        method: "direct",
        streamId,
        watchUrl: directStreamUrl(video().details.id),
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
          params: { path: { id: video().details.id } },
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
      streamPending = true;
      hls.loadSource(hlsStreamUrl(streamId));
      return {
        method: "hls",
        audioCodec: audio_codec,
        videoCodec: video_codec,
        streamId,
      };
    }
  });

  function handleAudioError() {
    tracing.error("audio error encountered");
  }

  function handleVideoError() {
    tracing.error("video error encountered");
  }

  async function handleUnload() {
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
    streamPending = false;
  }

  window.addEventListener("beforeunload", handleUnload);
  useBeforeLeave(handleUnload);
  onCleanup(() => {
    window.removeEventListener("beforeunload", handleUnload);
  });

  function updateHistory(time: number) {
    let totalDuration = video().details.duration.secs;
    if (!totalDuration) return;
    let is_finished = (time / totalDuration) * 100 >= 90;

    server.PUT("/api/video/{id}/history", {
      body: { time: Math.floor(time), is_finished },
      params: {
        path: { id: video().details.id },
        query: { id: streamParams()?.streamId },
      },
    });
  }

  return (
    <TracksSelectionProvider video={video()}>
      <Show when={streamParams()}>
        {(params) => (
          <VideoPlayer
            hls={hls}
            intro={video().details.intro ?? undefined}
            nextVideo={props.next}
            streamParams={params()}
            initialTime={video().details.history?.time ?? 0}
            onAudioError={handleAudioError}
            onVideoError={handleVideoError}
            onHistoryUpdate={updateHistory}
            previews={
              video().details.previews_count > 0
                ? {
                  previewsAmount: video().details.previews_count,
                  videoId: video().details.id,
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
