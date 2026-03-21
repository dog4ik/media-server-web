import { NotFoundError, notifyResponseErrors } from "../utils/errors";
import VideoPlayer, { NextVideo } from "../components/VideoPlayer";
import { Schemas, fullUrl, server } from "../utils/serverApi";
import {
  createEffect,
  createMemo,
  onCleanup,
  ParentProps,
  Show,
} from "solid-js";
import { formatSE } from "../utils/formats";
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
import { useNotificationsContext } from "@/context/NotificationContext";
import { getRouteApi, Link, linkOptions } from "@tanstack/solid-router";
import { queryApi } from "@/utils/queryApi";
import WatchSessionProvider from "./Watch/WatchSessionContext";
import { MediaSessionState } from "@/lib/mediaSession";

export type SubtitlesOrigin = "container" | "api" | "local" | "imported";

export type Subtitle = {
  fetch: () => Promise<string>;
  origin: SubtitlesOrigin;
  language?: Schemas["DetailedSubtitleTrack"]["language"];
};

type WatchProps = {
  videos: Video[];
  media?: Media;
  intro?: Schemas["Intro"];
  history?: Schemas["History"];
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
    if ("mediaSession" in navigator && movie.isSuccess) {
      navigator.mediaSession.metadata = movieMediaSessionMetadata(
        movie.latest()!,
      );
    } else {
      tracing.warn("Media session api is not supported by the browser");
    }
  });

  return (
    <>
      <Show when={movie.isSuccess && videos.isSuccess}>
        <Watch
          history={movie.latest()?.local?.history ?? undefined}
          media={movie.latest()!}
          videos={videos.latest()!}
        >
          <div class="absolute top-5 left-5">
            <Link
              to={"/movies/$id"}
              params={{ id: params().id }}
              search={{ provider: movie.latest()!.metadata_provider }}
            >
              <span class="text-2xl hover:underline">
                {movie.latest()!.title}
              </span>
            </Link>
          </div>
        </Watch>
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
        query: { content_type: "show", id: +episode.latest()?.metadata_id! },
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
          episode: +params().episode + 1,
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
    if ("mediaSession" in navigator && episode.isSuccess && show.isSuccess) {
      navigator.mediaSession.metadata = showMediaSessionMetadata(
        episode.latest()!,
        show.latest()!,
      );
    }
  });

  return (
    <>
      <Show when={episode.latest() && videos.latest()}>
        <>
          <Watch
            history={episode.latest()?.local?.history ?? undefined}
            intro={episode.latest()?.local?.intro ?? undefined}
            media={episode.latest()}
            next={nextEpisode.latest()}
            videos={videos.latest()!}
          >
            <div class="absolute top-5 left-5 flex flex-col">
              <span class="text-2xl">{episode.latest()!.title}</span>
              <div class="flex gap-2">
                <Link
                  to={"/shows/$id"}
                  params={{ id: params().id }}
                  search={{ provider: "local" }}
                >
                  <span class="text-sm hover:underline">
                    {show.latest()!.title}
                  </span>
                </Link>
                <Link
                  to={"/shows/$id"}
                  params={{ id: params().id }}
                  search={{ provider: "local", season: +params().season }}
                >
                  <span class="text-sm hover:underline">
                    Season {episode.latest()!.season_number}
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
                    Episode {episode.latest()!.number}
                  </span>
                </Link>
              </div>
            </div>
          </Watch>
        </>
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

function Watch(props: WatchProps) {
  // todo: deligate a separate route
  let route = getRouteApi("/watch");
  let search = route.useSearch();
  let [, { addNotification }] = useNotificationsContext();

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

  let mediaSession = new MediaSessionState(video(), search().variant_id);

  async function handleUnload() {
    let id = mediaSession.session?.id;
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
  onCleanup(() => {
    window.removeEventListener("beforeunload", handleUnload);
    handleUnload();
  });

  function updateHistory(time: number) {
    // convert to ms
    time = time * 1000;
    let totalDuration = video().details.duration;
    if (!totalDuration) return;
    let is_finished = (time / totalDuration) * 100 >= 90;

    server.PUT("/api/video/{id}/history", {
      body: { time: Math.floor(time), is_finished },
      params: {
        path: { id: video().details.id },
        query: { id: mediaSession.session?.id },
      },
    });
  }

  return (
    <WatchSessionProvider>
      <TracksSelectionProvider video={mediaSession}>
        <VideoPlayer
          mediaSession={mediaSession}
          intro={props.intro}
          nextVideo={props.next}
          initialTime={(props.history?.time ?? 0) / 1000}
          initialDuration={video().details.duration}
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
      </TracksSelectionProvider>
    </WatchSessionProvider>
  );
}
