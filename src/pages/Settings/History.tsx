import { A, createAsync } from "@solidjs/router";
import {
  fullUrl,
  revalidatePath,
  Schemas,
  server,
} from "../../utils/serverApi";
import { For, Match, Show, Switch } from "solid-js";
import Showspense from "../../utils/Showspense";
import ProgressBar from "../../components/Cards/ProgressBar";
import { FiX } from "solid-icons/fi";
import FallbackImage from "../../components/FallbackImage";
import useInfiniteScroll from "../../utils/useInifiniteScroll";

type DisplayEpisodeProps = {
  metadata: Schemas["VideoContentMetadata"] & { content_type: "episode" };
  history: Schemas["DbHistory"];
  onRemove: () => void;
};

function DisplayEpisode(props: DisplayEpisodeProps) {
  let show = () => props.metadata.show;
  let episode = () => props.metadata.episode;
  let showUrl = () => {
    return `/shows/${show().metadata_id}`;
  };
  let episodeUrl = () => {
    return `${showUrl()}/${episode().season_number}/${episode().number}?provider=${show().metadata_provider}`;
  };
  let seasonUrl = () => {
    return `${showUrl()}?season=${episode().season_number}&provider=${show().metadata_provider}`;
  };
  let localImg = () =>
    episode().metadata_provider == "local"
      ? fullUrl("/api/episode/{id}/poster", {
          path: { id: +episode().metadata_id },
        })
      : undefined;
  return (
    <div class="relative grid grid-cols-4 gap-2">
      <A
        href={episodeUrl()}
        class="relative aspect-video h-fit overflow-hidden rounded-xl"
      >
        <FallbackImage
          width={342}
          height={192}
          alt="Episode poster"
          class="h-full w-full"
          srcList={[localImg(), episode().poster ?? undefined]}
        />
        <Show when={episode().runtime}>
          {(r) => <ProgressBar runtime={r().secs} history={props.history} />}
        </Show>
      </A>
      <div class="col-span-3 flex flex-col">
        <A href={episodeUrl()}>
          <span class="text-2xl">{episode().title}</span>
        </A>
        <div class="flex items-center gap-2 text-sm">
          <A href={showUrl()}>
            <span class="hover:underline">{show().title}</span>
          </A>
          <span>-</span>
          <A href={seasonUrl()}>
            <span class="hover:underline">
              Season {episode().season_number}
            </span>
          </A>
          <span>-</span>
          <A href={episodeUrl()}>
            <span class="hover:underline">Episode {episode().number}</span>
          </A>
        </div>
        <p title={episode().plot ?? undefined} class="line-clamp-2">
          {episode().plot}
        </p>
      </div>
      <button
        class="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-stone-100 hover:bg-stone-300/80"
        onClick={props.onRemove}
      >
        <FiX size={20} />
      </button>
    </div>
  );
}

type DisplayMovieProps = {
  metadata: Schemas["VideoContentMetadata"] & { content_type: "movie" };
  history: Schemas["DbHistory"];
  onRemove: () => void;
};

function DisplayMovie(props: DisplayMovieProps) {
  let movie = () => props.metadata.movie;
  let movieUrl = () =>
    `/movies/${movie().metadata_id}?provider=${movie().metadata_provider}`;
  let localImg = () =>
    movie().metadata_provider == "local"
      ? fullUrl("/api/movie/{id}/poster", {
          path: { id: +movie().metadata_id },
        })
      : undefined;
  return (
    <div class="flex">
      <A href={movieUrl()} class="relative aspect-poster">
        <FallbackImage
          width={60}
          height={90}
          alt="Movie poster"
          class="h-full w-full"
          srcList={[localImg(), movie().poster ?? undefined]}
        />
        <Show when={movie().runtime}>
          {(r) => <ProgressBar runtime={r().secs} history={props.history} />}
        </Show>
      </A>
      <div class="flex flex-col">
        <span class="text-2xl">{props.metadata.movie.title}</span>
      </div>
    </div>
  );
}

type HistoryEntryProps = {
  history: Schemas["DbHistory"];
};

function HistoryEntry(props: HistoryEntryProps) {
  let metadata = createAsync(async () => {
    let metadata = await server.GET("/api/video/{id}/metadata", {
      params: { path: { id: props.history.video_id } },
    });
    return metadata.data;
  });

  async function handleRemove() {
    await server.DELETE("/api/video/{id}/history", {
      params: { path: { id: props.history.video_id } },
    });
    revalidatePath("/api/history");
  }

  return (
    <Showspense when={metadata()} fallback={<div>Loading</div>}>
      {(data) => (
        <Switch>
          <Match when={data().content_type === "episode"}>
            {(_) => {
              let metadata = data();
              if (metadata.content_type === "episode")
                return (
                  <DisplayEpisode
                    onRemove={handleRemove}
                    history={props.history}
                    metadata={metadata}
                  />
                );
            }}
          </Match>
          <Match when={data().content_type === "movie"}>
            {(_) => {
              let metadata = data();
              if (metadata.content_type === "movie")
                return (
                  <DisplayMovie
                    onRemove={handleRemove}
                    history={props.history}
                    metadata={metadata}
                  />
                );
            }}
          </Match>
        </Switch>
      )}
    </Showspense>
  );
}

export default function History() {
  async function fetchHistory(
    cursor: string | undefined | null,
    signal: AbortSignal,
  ) {
    return await server
      .GET("/api/history", {
        params: { query: { cursor, take: 10 } },
        signal,
      })
      .then((d) => d.data);
  }

  let observable: HTMLDivElement;

  let [history, { isLoading, reachedEnd }] = useInfiniteScroll(
    fetchHistory,
    () => observable,
  );

  return (
    <>
      <div class="max-w-5xl space-y-4">
        <For each={history()}>
          {(entry) => <HistoryEntry history={entry} />}
        </For>
      </div>
      <Show when={isLoading()}>
        <span class="loading loading-spinner loading-lg" />
      </Show>
      <Show when={reachedEnd()}>
        <div class="flex items-center justify-center">
          <span class="text-3xl">You are all caught up</span>
        </div>
      </Show>
      <div class="min-h-1" ref={observable!} />
    </>
  );
}
