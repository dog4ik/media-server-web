import { Schemas, server } from "../../utils/serverApi";
import { For, Match, Show, Switch } from "solid-js";
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
import { Card, CardContent } from "@/ui/card";
import { Button } from "@/ui/button";
import { Link, linkOptions } from "@tanstack/solid-router";
import { queryApi } from "@/utils/queryApi";

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
    return linkOptions({
      to: "/shows/$id",
      params: { id: show().metadata_id },
      search: {
        provider: show().metadata_provider,
        season: episode().season_number,
      },
    });
  };
  return (
    <Card class="relative grid grid-cols-4 gap-2 py-0">
      <Link
        class="relative aspect-video h-fit overflow-hidden rounded-xl"
        {...episode().url()}
      >
        <FallbackImage
          width={342}
          height={192}
          alt="Episode poster"
          class="min-h-full min-w-full object-cover"
          srcList={posterList(episode())}
        />
        <Show when={episode().runtime}>
          {(r) => <ProgressBar runtime={r().secs} history={props.history} />}
        </Show>
      </Link>
      <div class="col-span-3 flex flex-col p-2">
        <Link {...episode().url()}>
          <span class="text-2xl">{episode().title}</span>
        </Link>
        <div class="flex items-center gap-2 text-sm">
          <Link {...show().url()}>
            <span class="hover:underline">{show().title}</span>
          </Link>
          <span>-</span>
          <Link {...seasonUrl()}>
            <span class="hover:underline">
              Season {episode().season_number}
            </span>
          </Link>
          <span>-</span>
          <Link {...episode().url()}>
            <span class="hover:underline">Episode {episode().number}</span>
          </Link>
        </div>
        <p title={episode().plot ?? undefined} class="mt-2 line-clamp-2">
          {episode().plot}
        </p>
      </div>
      <Button
        variant={"destructive"}
        class="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full"
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
    <Card class="py-0">
      <CardContent class="relative grid grid-cols-4 gap-2">
        <Link
          class="aspect-poster relative h-fit overflow-hidden rounded-xl"
          {...movie().url()}
        >
          <FallbackImage
            width={100}
            height={192}
            alt="Movie poster"
            class="min-h-full min-w-full object-cover"
            srcList={posterList(movie())}
          />
          <Show when={movie().runtime}>
            {(r) => <ProgressBar runtime={r().secs} history={props.history} />}
          </Show>
        </Link>
        <div class="col-span-3 flex flex-col p-2">
          <Link {...movie().url()}>
            <span class="text-2xl">{movie().friendlyTitle()}</span>
          </Link>
          <div class="flex items-center gap-2 text-sm">
            <Link {...movie().url()}>
              <span class="hover:underline">{movie().friendlyTitle()}</span>
            </Link>
          </div>
          <p title={movie().plot ?? undefined} class="mt-2 line-clamp-6">
            {movie().plot}
          </p>
        </div>
        <Button
          variant={"destructive"}
          class="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full"
          onClick={props.onRemove}
        >
          <FiX size={20} />
        </Button>
      </CardContent>
    </Card>
  );
}

type HistoryEntryProps = {
  history: Schemas["DbHistory"];
  onRemove: () => void;
};

function HistoryEntry(props: HistoryEntryProps) {
  let metadata = queryApi.useQuery("get", "/api/video/{id}/metadata", () => ({
    params: { path: { id: props.history.video_id } },
  }));

  return (
    <Show when={metadata.latest()} fallback={<div>Loading</div>}>
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
    </Show>
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
