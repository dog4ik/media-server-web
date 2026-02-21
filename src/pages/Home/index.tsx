import { ErrorBoundary, For, Suspense } from "solid-js";
import { MovieCard } from "../../components/Cards/MovieCard";
import { ShowCard, ShowCardSkeleton } from "@/components/Cards/ShowCard";
import { ElementsGrid } from "@/components/ElementsGrid";
import { ApplicationErrorBoundary, ErrorComponent } from "@/components/Error";
import { queryApi, queryClient } from "@/utils/queryApi";
import { ContinueWatchingSection } from "./ContinueWatching";

function TrendingShows() {
  let trendingShows = queryApi.useQuery("get", "/api/search/trending_shows");
  return (
    <>
      <p class="my-8 text-3xl">Trending shows</p>
      <ApplicationErrorBoundary
        fallback={(err, reset) => (
          <ErrorComponent
            err={err}
            context="trending shows"
            reset={() => {
              trendingShows.refetch();
              reset();
            }}
          />
        )}
      >
        <Suspense
          fallback={
            <ElementsGrid elementSize={200}>
              {[...Array(10)].map(() => (
                <ShowCardSkeleton />
              ))}
            </ElementsGrid>
          }
        >
          <ElementsGrid elementSize={200}>
            <For each={trendingShows.data}>
              {(show) => <ShowCard show={show} />}
            </For>
          </ElementsGrid>
        </Suspense>
      </ApplicationErrorBoundary>
    </>
  );
}

function TrendingMovies() {
  let trendingMovies = queryApi.useQuery("get", "/api/search/trending_movies");

  return (
    <>
      <p class="my-8 text-3xl">Trending movies</p>
      <ErrorBoundary
        fallback={(err, reset) => (
          <ErrorComponent
            err={err}
            context="trending movies"
            reset={() => {
              reset();
              trendingMovies.refetch();
            }}
          />
        )}
      >
        <Suspense
          fallback={
            <ElementsGrid elementSize={200}>
              {[...Array(10)].map(() => (
                <ShowCardSkeleton />
              ))}
            </ElementsGrid>
          }
        >
          <ElementsGrid elementSize={200}>
            <For each={trendingMovies.data}>
              {(movie) => <MovieCard movie={movie} />}
            </For>
          </ElementsGrid>
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

export default function Home() {
  return (
    <>
      <ErrorBoundary
        fallback={(err, reset) => <ErrorComponent err={err} reset={reset} />}
      >
        <div class="p-2">
          <ContinueWatchingSection />
          <TrendingShows />
          <TrendingMovies />
        </div>
      </ErrorBoundary>
    </>
  );
}
