import { ErrorBoundary, For, Show, Suspense } from "solid-js";
import PageTitle from "@/components/PageTitle";
import { ElementsGrid } from "@/components/ElementsGrid";
import { MovieCard, MovieCardSkeleton } from "@/components/Cards/MovieCard";
import AddFoldersHelp from "@/components/AddFoldersHelp";
import { queryApi } from "@/utils/queryApi";
import { errorBoundaryFallback } from "@/components/Error";

export default function Movies() {
  let movies = queryApi.useQuery("get", "/api/local_movies");

  return (
    <>
      <PageTitle>Movies</PageTitle>
      <ErrorBoundary fallback={errorBoundaryFallback("Failed to fetch movies")}>
        <Show
          when={movies.latest() !== undefined && movies.latest()?.length === 0}
        >
          <AddFoldersHelp contentType="movie" />
        </Show>
        <Suspense
          fallback={
            <ElementsGrid elementSize={250}>
              {[...Array(7)].map(MovieCardSkeleton)}
            </ElementsGrid>
          }
        >
          <ElementsGrid elementSize={250}>
            <For each={movies.data}>
              {(movie) => <MovieCard movie={movie} />}
            </For>
          </ElementsGrid>
        </Suspense>
      </ErrorBoundary>
    </>
  );
}
