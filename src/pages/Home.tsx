import { For, Show } from "solid-js";
import { Schemas, server } from "../utils/serverApi";
import EpisodeCard from "../components/Cards/EpisodeCard";
import MovieCard from "../components/Cards/MovieCard";
import { createAsync } from "@solidjs/router";
import Title from "../utils/Title";
import { extendEpisode } from "@/utils/library";
import ShowCard from "@/components/Cards/ShowCard";
import ElementsGrid from "@/components/ElementsGrid";

type ContinueWatchingProps = {
  showHistory: Schemas["ShowSuggestion"][];
  movieHistory: Schemas["MovieHistory"][];
};

function ContinueWatchingSection(props: ContinueWatchingProps) {
  return (
    <>
      <p class="my-8 text-3xl">Continue watching</p>
      <div class="flex items-center gap-4">
        <For each={props.showHistory}>
          {(show) => {
            let episode = extendEpisode(show.episode, show.show_id.toString());
            return (
              <EpisodeCard
                episode={episode}
                history={show.history ?? undefined}
                url={episode.url()}
                onDelete={() => null}
                onOptimize={() => null}
                onFixMetadata={() => null}
              />
            );
          }}
        </For>
        <For each={props.movieHistory}>
          {(movie) => {
            return <MovieCard movie={movie.movie} />;
          }}
        </For>
      </div>
    </>
  );
}

type TrendingShowsProps = {
  shows: Schemas["ShowMetadata"][];
};

function TrendingShows(props: TrendingShowsProps) {
  return (
    <>
      <p class="my-8 text-3xl">Trending shows</p>
      <ElementsGrid elementSize={200}>
        <For each={props.shows}>
          {(show) => {
            return <ShowCard show={show} />;
          }}
        </For>
      </ElementsGrid>
    </>
  );
}

type TrendingMoviesProps = {
  movies: Schemas["ShowMetadata"][];
};

function TrendingMovies(props: TrendingMoviesProps) {
  return (
    <>
      <p class="my-8 text-3xl">Trending movies</p>
      <div>
        <ElementsGrid elementSize={200}>
          <For each={props.movies}>
            {(movie) => {
              return <MovieCard movie={movie} />;
            }}
          </For>
        </ElementsGrid>
      </div>
    </>
  );
}

export default function Home() {
  let suggestions = createAsync(async () => {
    let showSuggestions = await server
      .GET("/api/history/suggest/shows")
      .then((d) => d.data ?? []);
    let movieSuggestions = await server
      .GET("/api/history/suggest/movies")
      .then((d) => d.data ?? []);
    return { showSuggestions, movieSuggestions };
  });

  let trendingShows = createAsync(() =>
    server.GET("/api/search/trending_shows").then((d) => d.data ?? []),
  );

  let trendingMovies = createAsync(() =>
    server.GET("/api/search/trending_movies").then((d) => d.data ?? []),
  );

  return (
    <>
      <Title text="Home" />
      <div class="p-2">
        <Show
          when={
            suggestions()?.showSuggestions.length ||
            suggestions()?.movieSuggestions.length
          }
        >
          <ContinueWatchingSection
            showHistory={suggestions()!.showSuggestions}
            movieHistory={suggestions()!.movieSuggestions}
          />
        </Show>
        <Show when={trendingShows()}>
          {(shows) => <TrendingShows shows={shows()} />}
        </Show>
        <Show when={trendingMovies()}>
          {(movies) => <TrendingMovies movies={movies()} />}
        </Show>
      </div>
    </>
  );
}
