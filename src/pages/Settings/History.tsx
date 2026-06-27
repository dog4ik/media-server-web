import { Schemas, server } from "../../utils/serverApi";
import {
  createMemo,
  ErrorBoundary,
  For,
  Match,
  onCleanup,
  onMount,
  Show,
  Switch,
} from "solid-js";
import { WatchProgressBar } from "../../components/Cards/ProgressBar";
import { FiX } from "solid-icons/fi";
import FallbackImage from "../../components/FallbackImage";
import { extendMovie, extendEpisode, posterList } from "@/utils/library";
import { Card } from "@/ui/card";
import { Button } from "@/ui/button";
import { Link } from "@tanstack/solid-router";
import { queryClient } from "@/utils/queryApi";
import { errorBoundaryFallback } from "@/components/Error";
import { useInfiniteQuery } from "@tanstack/solid-query";
import { throwResponseErrors } from "@/utils/errors";
import { timeAgo } from "@/utils/formats";

type DisplayEpisodeProps = {
  entry: Schemas["HistoryEntry"] & { type: "episode" };
  onRemove: () => void;
};

function DisplayEpisode(props: DisplayEpisodeProps) {
  let episode = createMemo(() =>
    extendEpisode(
      {
        ...props.entry,
        provider_id: props.entry.episode_id.toString(),
        provider: "local",
      },
      props.entry.show_id.toString(),
    ),
  );
  return (
    <Card class="relative py-0">
      <div class="flex items-center gap-3 pl-3 sm:gap-4 sm:pl-4">
        <Link
          class="relative aspect-video w-36 shrink-0 overflow-hidden rounded-xl sm:w-64"
          {...episode().url()}
        >
          <FallbackImage
            fluid
            width={342}
            height={192}
            alt="Episode poster"
            srcList={posterList(episode())}
          />
          <Show when={episode().runtime}>
            {(r) => (
              <WatchProgressBar runtime={r()} history={props.entry.history} />
            )}
          </Show>
        </Link>
        <div class="flex min-w-0 flex-1 flex-col py-3 pr-3 sm:pr-4">
          <Link
            class="flex flex-wrap items-baseline gap-x-4 gap-y-1 pr-9 sm:pr-0"
            {...episode().url()}
          >
            <span class="text-lg sm:text-2xl">{episode().title}</span>
            <span
              title={props.entry.history.update_time}
              class="text-muted-foreground text-sm"
            >
              {timeAgo(new Date(props.entry.history.update_time))}
            </span>
          </Link>
          <div class="flex flex-wrap items-center gap-2 text-sm">
            <Link {...episode().url()}>
              <span class="hover:underline">{props.entry.show_title}</span>
            </Link>
            <span>-</span>
            <Link {...episode().seasonUrl()}>
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
  entry: Schemas["HistoryEntry"] & { type: "movie" };
  onRemove: () => void;
};

function DisplayMovie(props: DisplayMovieProps) {
  let movie = () =>
    extendMovie({
      ...props.entry,
      provider: "local",
      provider_id: props.entry.movie_id.toString(),
    });
  return (
    <Card class="relative py-0">
      <div class="flex items-start gap-3 pl-3 sm:gap-4 sm:pl-4">
        <Link
          class="aspect-poster relative w-28 shrink-0 overflow-hidden rounded-xl sm:w-56"
          {...movie().url()}
        >
          <FallbackImage
            fluid
            width={100}
            height={192}
            alt="Movie poster"
            srcList={posterList(movie())}
          />
          <Show when={movie().runtime}>
            {(r) => (
              <WatchProgressBar runtime={r()} history={props.entry.history} />
            )}
          </Show>
        </Link>
        <div class="flex min-w-0 flex-1 flex-col py-3 pr-3 sm:pr-4">
          <Link
            class="flex flex-wrap items-baseline gap-x-4 gap-y-1 pr-9 sm:pr-0"
            {...movie().url()}
          >
            <span class="text-lg sm:text-2xl">{movie().friendlyTitle()}</span>
            <span class="text-muted-foreground text-sm">
              {timeAgo(new Date(props.entry.history.update_time))}
            </span>
          </Link>
          <p title={movie().plot ?? undefined} class="mt-2 line-clamp-6">
            {movie().plot}
          </p>
        </div>
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

type HistoryEntryProps = {
  history: Schemas["HistoryEntry"];
  onRemove: () => void;
};

function HistoryEntry(props: HistoryEntryProps) {
  return (
    <Switch>
      <Match when={props.history.type === "episode"}>
        <DisplayEpisode
          onRemove={props.onRemove}
          entry={props.history as Schemas["HistoryEntry"] & { type: "episode" }}
        />
      </Match>
      <Match when={props.history.type === "movie"}>
        <DisplayMovie
          onRemove={props.onRemove}
          entry={props.history as Schemas["HistoryEntry"] & { type: "movie" }}
        />
      </Match>
    </Switch>
  );
}

export default function History() {
  let observable!: HTMLDivElement;

  const history = useInfiniteQuery(() => ({
    queryKey: ["history"],
    queryFn: async ({ pageParam, signal }) => {
      const res = await server
        .GET("/api/history", {
          params: { query: { cursor: pageParam, take: 10 } },
          signal,
        })
        .then(throwResponseErrors);
      return res;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor ?? undefined,
  }));

  const allHistory = () => history.data?.pages.flatMap((p) => p.data) ?? [];

  onMount(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          history.hasNextPage &&
          !history.isFetchingNextPage
        ) {
          history.fetchNextPage();
        }
      },
      { threshold: 0 },
    );
    observer.observe(observable);
    onCleanup(() => observer.disconnect());
  });

  function handleRemove(id: number) {
    server
      .DELETE("/api/history/{id}", {
        params: { path: { id } },
      })
      .then((res) => {
        if (!res.error) {
          queryClient.invalidateQueries({ queryKey: ["history"] });
        }
      });
  }

  return (
    <ErrorBoundary fallback={errorBoundaryFallback("Failed to load history")}>
      <div class="max-w-5xl space-y-4">
        <For each={allHistory()}>
          {(entry) => (
            <HistoryEntry
              history={entry}
              onRemove={() => handleRemove(entry.history.id)}
            />
          )}
        </For>
      </div>
      <Show when={history.isFetchingNextPage}>
        <span class="loading loading-spinner loading-lg" />
      </Show>
      <Show
        when={
          (history.hasNextPage === false && allHistory().length > 0) ||
          allHistory().length === 0
        }
      >
        <div class="mt-12 flex items-center justify-center">
          <span class="text-3xl">You are all caught up</span>
        </div>
      </Show>
      <div class="min-h-1" ref={observable!} />
    </ErrorBoundary>
  );
}
