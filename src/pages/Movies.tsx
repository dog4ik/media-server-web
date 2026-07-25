import { createSignal, ErrorBoundary, For, Show, Suspense } from "solid-js";
import { ElementsGrid } from "@/components/ElementsGrid";
import { MovieCard, MovieCardSkeleton } from "@/components/Cards/MovieCard";
import AddFoldersHelp from "@/components/AddFoldersHelp";
import { queryApi, queryClient } from "@/utils/queryApi";
import { errorBoundaryFallback } from "@/components/Error";
import { ContentFilterBar, DEFAULT_FILTER_STATE } from "@/components/ContentFilterBar";
import clsx from "clsx";
import { extendMovie } from "@/utils/library";

export default function Movies() {
  let [filterState, setFilterState] = createSignal(DEFAULT_FILTER_STATE);
  let movies = queryApi.useQuery(
    "get",
    "/api/local_movies",
    () => ({
      params: {
        query: {
          search: filterState().titleFilter,
          actors: filterState().actorFilter,
        },
      },
    }),
    () => ({ placeholderData: (stale) => stale }),
  );

  return (
    <>
      <ContentFilterBar state={filterState()} onChange={setFilterState} />
      <ErrorBoundary fallback={errorBoundaryFallback("Failed to fetch movies")}>
        <Show when={movies.latest() !== undefined && movies.latest()?.data.length === 0}>
          <AddFoldersHelp contentType="movie" />
        </Show>
        <Suspense
          fallback={
            <ElementsGrid elementSize={250}>{[...Array(7)].map(MovieCardSkeleton)}</ElementsGrid>
          }
        >
          <ElementsGrid elementSize={250}>
            <For each={movies.data?.data}>
              {(movie) => (
                <div class={clsx(movies.isFetching && movies.isPlaceholderData && "opacity-50")}>
                  <MovieCard
                    movie={extendMovie(movie)}
                    onMarkWatched={() =>
                      queryApi.invalidateQueries("get", "/api/local_movies")
                    }
                  />
                </div>
              )}
            </For>
          </ElementsGrid>
        </Suspense>
      </ErrorBoundary>
    </>
  );
}
