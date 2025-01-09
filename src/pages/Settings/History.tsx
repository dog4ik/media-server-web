import { A, createAsync } from "@solidjs/router";
import { Schemas, server } from "../../utils/serverApi";
import { For, Match, Show, Switch } from "solid-js";
import Showspense from "../../utils/Showspense";
import ProgressBar from "../../components/Cards/ProgressBar";
import { FiX } from "solid-icons/fi";
import FallbackImage from "../../components/FallbackImage";
import useInfiniteScroll from "../../utils/useInfiniteScroll";
import {
  extendMovie,
  extendEpisode,
  extendShow,
  posterList,
} from "@/utils/library";
import { Card } from "@/ui/card";
import { Button } from "@/ui/button";

type DisplayEpisodeProps = {
  metadata: Schemas["VideoContentMetadata"] & { content_type: "episode" };
  history: Schemas["DbHistory"];
  onRemove: () => void;
};

function DisplayEpisode(props: DisplayEpisodeProps) {
  let show = () => extendShow(props.metadata.show);
  let episode = () =>
    extendEpisode(props.metadata.episode, props.metadata.show.metadata_id);
  let seasonUrl = () => {
    return `/shows/${show().metadata_id}?season=${episode().season_number}&provider=${show().metadata_provider}`;
  };
  return (
    <Card class="relative grid grid-cols-4 gap-2">
      <A
        href={episode().url()}
        class="relative aspect-video h-fit overflow-hidden rounded-xl"
      >
        <FallbackImage
          width={342}
          height={192}
          alt="Episode poster"
          class="h-full w-full"
          srcList={posterList(episode())}
        />
        <Show when={episode().runtime}>
          {(r) => <ProgressBar runtime={r().secs} history={props.history} />}
        </Show>
      </A>
      <div class="col-span-3 flex flex-col p-2">
        <A href={episode().url()}>
          <span class="text-2xl">{episode().title}</span>
        </A>
        <div class="flex items-center gap-2 text-sm">
          <A href={show().url()}>
            <span class="hover:underline">{show().title}</span>
          </A>
          <span>-</span>
          <A href={seasonUrl()}>
            <span class="hover:underline">
              Season {episode().season_number}
            </span>
          </A>
          <span>-</span>
          <A href={episode().url()}>
            <span class="hover:underline">Episode {episode().number}</span>
          </A>
        </div>
        <p title={episode().plot ?? undefined} class="mt-2 line-clamp-2">
          {episode().plot}
        </p>
      </div>
      <Button
        variant={"destructive"}
        class="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full"
        onClick={props.onRemove}
      >
        <FiX size={20} />
      </Button>
    </Card>
  );
}

type DisplayMovieProps = {
  metadata: Schemas["VideoContentMetadata"] & { content_type: "movie" };
  history: Schemas["DbHistory"];
  onRemove: () => void;
};

function DisplayMovie(props: DisplayMovieProps) {
  let movie = () => extendMovie(props.metadata.movie);
  return (
    <Card class="relative grid grid-cols-4 gap-2">
      <A
        href={movie().url()}
        class="relative aspect-poster h-fit overflow-hidden rounded-xl"
      >
        <FallbackImage
          width={100}
          height={192}
          alt="Movie poster"
          class="h-full w-full"
          srcList={posterList(movie())}
        />
        <Show when={movie().runtime}>
          {(r) => <ProgressBar runtime={r().secs} history={props.history} />}
        </Show>
      </A>
      <div class="col-span-3 flex flex-col p-2">
        <A href={movie().url()}>
          <span class="text-2xl">{movie().friendlyTitle()}</span>
        </A>
        <div class="flex items-center gap-2 text-sm">
          <A href={movie().url()}>
            <span class="hover:underline">{movie().friendlyTitle()}</span>
          </A>
        </div>
        <p title={movie().plot ?? undefined} class="mt-2 line-clamp-6">
          {movie().plot}
        </p>
      </div>
      <Button
        variant={"destructive"}
        class="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full"
        onClick={props.onRemove}
      >
        <FiX size={20} />
      </Button>
    </Card>
  );
}

type HistoryEntryProps = {
  history: Schemas["DbHistory"];
  onRemove: () => void;
};

function HistoryEntry(props: HistoryEntryProps) {
  let metadata = createAsync(async () => {
    let metadata = await server.GET("/api/video/{id}/metadata", {
      params: { path: { id: props.history.video_id } },
    });
    return metadata.data;
  });

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
                    onRemove={props.onRemove}
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
                    onRemove={props.onRemove}
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

  let observable: HTMLDivElement = {} as any;

  let [history, { isLoading, reachedEnd, removeIdx }] = useInfiniteScroll(
    fetchHistory,
    () => observable,
  );

  function handleRemove(idx: number) {
    let id = history()[idx].video_id;
    server
      .DELETE("/api/video/{id}/history", { params: { path: { id } } })
      .then((res) => {
        if (!res.error) {
          removeIdx(idx);
        }
      });
  }

  return (
    <>
      <div class="max-w-5xl space-y-4">
        <For each={history()}>
          {(entry, i) => (
            <HistoryEntry history={entry} onRemove={() => handleRemove(i())} />
          )}
        </For>
      </div>
      <Show when={isLoading()}>
        <span class="loading loading-spinner loading-lg" />
      </Show>
      <Show when={reachedEnd()}>
        <div class="mt-12 flex items-center justify-center">
          <span class="text-3xl">You are all caught up</span>
        </div>
      </Show>
      <div class="min-h-1" ref={observable!} />
    </>
  );
}
