import {
  NotFoundError,
  notifyResponseErrors,
  throwResponseErrors,
} from "../utils/errors";
import VideoPlayer, { NextVideo } from "../components/VideoPlayer";
import { Schemas, fullUrl, server } from "../utils/serverApi";
import {
  createEffect,
  createMemo,
  onCleanup,
  ParentProps,
  Show,
} from "solid-js";
import { Meta } from "@solidjs/meta";
import { formatSE } from "../utils/formats";
import Title from "../utils/Title";
import {
  ExtendedEpisode,
  ExtendedShow,
  extendEpisode,
  extendMovie,
  extendShow,
  Media,
  Video,
} from "@/utils/library";
import tracing from "@/utils/tracing";
import TracksSelectionProvider from "./Watch/TracksSelectionContext";
import { useServerStatus } from "@/context/ServerStatusContext";
import { useNotificationsContext } from "@/context/NotificationContext";
import { containerSupport } from "@/utils/mediaCapabilities";
import Hls from "hls.js";
import { getRouteApi, Link, linkOptions } from "@tanstack/solid-router";
import { queryApi } from "@/utils/queryApi";
import { useQuery } from "@tanstack/solid-query";

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
  let route = getRouteApi("/watch/movies/$id/watch");
  let params = route.useParams();
  let movie = queryApi.useQuery(
    "get",
    "/api/movie/{id}",
    () => ({
      params: { path: { id: params().id }, query: { provider: "local" } },
    }),
    () => ({ select: extendMovie }),
  );

  let videos = queryApi.useQuery(
    "get",
    "/api/video/by_content",
    () => ({
      params: { query: { content_type: "movie", id: +params().id } },
    }),
    () => ({
      select: (videos) => videos.map((v) => new Video(v)),
    }),
  );

  createEffect(() => {
    if ("mediaSession" in navigator && movie.data) {
      navigator.mediaSession.metadata = movieMediaSessionMetadata(movie.data);
    } else {
      tracing.warn("Media session api is not supported by the browser");
    }
  });

  return (
    <>
      <Show when={movie.data && videos.data}>
        {(data) => (
          <Watch media={movie.data!} videos={videos.data!}>
            <div class="absolute top-5 left-5">
              <Link
                to={"/movies/$id"}
                params={{ id: params().id }}
                search={{ provider: movie.data!.metadata_provider }}
              >
                <span class="text-2xl hover:underline">
                  {movie.data!.title}
                </span>
              </Link>
            </div>
          </Watch>
        )}
      </Show>
    </>
  );
}

function showMediaSessionMetadata(
  episode: ExtendedEpisode,
  show: ExtendedShow,
) {
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
  let route = getRouteApi("/watch/shows/$id/$season/$episode/watch");
  let params = route.useParams();
  let search = route.useSearch();

  let episode = queryApi.useQuery(
    "get",
    "/api/show/{id}/{season}/{episode}",
    () => ({
      params: {
        query: { provider: "local" },
        path: {
          id: params().id,
          season: +params().season,
          episode: +params().episode,
        },
      },
    }),
    () => ({
      select: (episode) => extendEpisode(episode, params().id),
    }),
  );

  let show = queryApi.useQuery(
    "get",
    "/api/show/{id}",
    () => ({
      params: {
        query: { provider: "local" },
        path: {
          id: params().id,
        },
      },
    }),
    () => ({ select: extendShow }),
  );

  let videos = queryApi.useQuery(
    "get",
    "/api/video/by_content",
    () => ({
      params: {
        query: { content_type: "show", id: +episode.data?.metadata_id! },
      },
    }),
    () => ({
      select: (videos) => videos.map((v) => new Video(v)),
      enabled: !!episode,
    }),
  );

  let nextEpisode = queryApi.useQuery(
    "get",
    "/api/show/{id}/{season}/{episode}",
    () => ({
      params: {
        path: {
          id: params().id,
          season: +params().season,
          episode: +params().episode,
        },
        query: { provider: "local" },
      },
    }),
    () => ({
      select: (next) => ({
        url: linkOptions({
          to: "/shows/$id/$season/$episode/watch",
          params: {
            id: params().id,
            season: next.season_number.toString(),
            episode: next.number.toString(),
          },
          // todo fix that
          search: { video_id: 0, variant_id: undefined },
        }),
        nextTitle: `S${formatSE(next.season_number)}E${formatSE(next.number)}`,
      }),
    }),
  );

  createEffect(() => {
    if ("mediaSession" in navigator && episode.data && show.data) {
      navigator.mediaSession.metadata = showMediaSessionMetadata(
        episode.data,
        show.data,
      );
    }
  });

  return (
    <>
      <Show when={episode.data && videos.data}>
        {(data) => (
          <>
            <Title
              text={`${show.data!.title} S${formatSE(episode.data!.season_number)}E${formatSE(episode.data!.number)}`}
            />
            <Meta property="og-image" content={episode.data!.poster ?? ""} />
            <Watch
              media={episode.data}
              next={nextEpisode.data}
              videos={videos.data!}
            >
              <div class="absolute top-5 left-5 flex flex-col">
                <span class="text-2xl">{episode.data!.title}</span>
                <div class="flex gap-2">
                  <Link
                    to={"/shows/$id"}
                    params={{ id: params().id }}
                    search={{ provider: "local" }}
                  >
                    <span class="text-sm hover:underline">
                      {show.data!.title}
                    </span>
                  </Link>
                  <Link
                    to={"/shows/$id"}
                    params={{ id: params().id }}
                    search={{ provider: "local", season: +params().season }}
                  >
                    <span class="text-sm hover:underline">
                      Season {episode.data!.season_number}
                    </span>
                  </Link>
                  <Link
                    to={"/shows/$id/$season/$episode"}
                    params={{
                      id: params().id,
                      season: params().season,
                      episode: params().episode,
                    }}
                    search={{ provider: "local" }}
                  >
                    <span class="text-sm hover:underline">
                      Episode {episode.data!.number}
                    </span>
                  </Link>
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
  // todo: deligate a separate route
  let route = getRouteApi("/watch");
  let search = route.useSearch();
  let [{ serverStatus }] = useServerStatus();
  let [, { addNotification }] = useNotificationsContext();

  let streamPending = false;

  let hls = initHls();

  let video = createMemo(() => {
    let query = search().video_id;
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

  let streamParams = useQuery(() => ({
    queryFn: async () => {
      if (streamPending) {
        await handleUnload();
      }
      let compatibility = await video().videoCompatibility();
      if (
        compatibility?.combined?.supported &&
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
        } as const;
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
        } as const;
      }
    },
    refetchOnWindowFocus: false,
    queryKey: ["video_capabilities"],
  }));

  function handleAudioError() {
    tracing.error("audio error encountered");
  }

  function handleVideoError() {
    tracing.error("video error encountered");
  }

  async function handleUnload() {
    let stream = streamParams.data;
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
  onCleanup(() => {
    window.removeEventListener("beforeunload", handleUnload);
    handleUnload();
  });

  function updateHistory(time: number) {
    let totalDuration = video().details.duration.secs;
    if (!totalDuration) return;
    let is_finished = (time / totalDuration) * 100 >= 90;

    server.PUT("/api/video/{id}/history", {
      body: { time: Math.floor(time), is_finished },
      params: {
        path: { id: video().details.id },
        query: { id: streamParams.data?.streamId },
      },
    });
  }

  return (
    <TracksSelectionProvider video={video()}>
      <Show when={streamParams.data}>
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
