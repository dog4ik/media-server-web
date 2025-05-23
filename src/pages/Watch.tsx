import {
  A,
  BeforeLeaveEventArgs,
  createAsync,
  useBeforeLeave,
  useLocation,
  useParams,
  useSearchParams,
} from "@solidjs/router";
import { InternalServerError, NotFoundError } from "../utils/errors";
import VideoPlayer, {
  NextVideo,
  StreamingMethod,
} from "../components/VideoPlayer";
import { Schemas, fullUrl, server } from "../utils/serverApi";
import { onCleanup, ParentProps, Show } from "solid-js";
import { Meta } from "@solidjs/meta";
import { formatSE } from "../utils/formats";
import Title from "../utils/Title";
import { fetchEpisode, fetchMovie, fetchShow, Video } from "@/utils/library";
import tracing from "@/utils/tracing";
import TracksSelectionProvider from "./Watch/TracksSelectionContext";

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
  let [params] = useSearchParams<{ stream_id: string; variant: string }>();
  let streamId: string | undefined = params.stream_id;
  if (streamId) {
    return { url: streamUrl(streamId), method: "hls" };
  }
  let variant: string | undefined = params.variant;
  let url = fullUrl("/api/video/{id}/watch", {
    query: variant ? { variant } : undefined,
    path: { id: videoId },
  });
  return { url, method: "progressive" };
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
  next?: NextVideo;
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
          <Watch video={data().video!}>
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
            <Watch next={nextEpisode()} video={data().video}>
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

function Watch(props: WatchProps & ParentProps) {
  let url = () => getUrl(props.video.details.id).url;
  let method = () => getUrl(props.video.details.id).method;
  function handleAudioError() {
    tracing.error("audio error encountered");
  }

  function handleVideoError() {
    tracing.error("video error encountered");
  }
  let link = url();
  let streaming_method = method();

  async function handleUnload(_: BeforeUnloadEvent | BeforeLeaveEventArgs) {
    if (streaming_method == "hls") {
      let url = new URL(link);
      let id = url.pathname.split("/").at(3);
      if (id) {
        throw Error("Unimplemented: Live transcode cancellation");
        //await server.DELETE("/api/tasks/{id}", {
        //  params: { path: { id } },
        //  keepalive: true,
        //});
      }
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
      params: { path: { id: props.video.details.id } },
    });
  }

  return (
    <TracksSelectionProvider video={props.video}>
      <VideoPlayer
        intro={props.video.details.intro ?? undefined}
        nextVideo={props.next}
        streamingMethod={method()}
        initialTime={props.video.details.history?.time ?? 0}
        onAudioError={handleAudioError}
        onVideoError={handleVideoError}
        onHistoryUpdate={updateHistory}
        src={url()}
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
    </TracksSelectionProvider>
  );
}
