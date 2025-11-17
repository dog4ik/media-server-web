import { For, Show } from "solid-js";
import { Schemas, server } from "../utils/serverApi";
import EpisodeCard from "../components/Cards/EpisodeCard";
import MovieCard from "../components/Cards/MovieCard";
import Title from "../utils/Title";
import { extendEpisode } from "@/utils/library";
import ShowCard from "@/components/Cards/ShowCard";
import ElementsGrid from "@/components/ElementsGrid";
import { useQuery } from "@tanstack/solid-query";
import { queryApi } from "@/utils/queryApi";
import { linkOptions } from "@tanstack/solid-router";

type ContinueWatchingProps = {
  showHistory: Schemas["ShowSuggestion"][];
  movieHistory: Schemas["MovieHistory"][];
};

function ContinueWatchingSection(props: ContinueWatchingProps) {
  return (
    <>
      <p class="my-8 text-3xl">Continue watching</p>
      <div class="space-y-4">
        <div class="flex items-center gap-4">
          <For each={props.showHistory}>
            {(show) => {
              let episode = extendEpisode(
                show.episode,
                show.show_id.toString(),
              );
              return (
                <EpisodeCard
                  episode={episode}
                  link={linkOptions({
                    to: "/shows/$id/$season/$episode",
                    params: {
                      id: show.show_id.toString(),
                      season: show.episode.season_number.toString(),
                      episode: show.episode.number.toString(),
                    },
                    search: { provider: show.episode.metadata_provider },
                  })}
                  history={show.history ?? undefined}
                  onDelete={() => null}
                  onOptimize={() => null}
                  onFixMetadata={() => null}
                />
              );
            }}
          </For>
        </div>
        <div class="flex items-center gap-4">
          <For each={props.movieHistory}>
            {(movie) => {
              return <MovieCard movie={movie.movie} />;
            }}
          </For>
        </div>
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
  const suggestions = useQuery(() => ({
    queryKey: ["suggestions"],
    queryFn: async () => {
      let shows = server
        .GET("/api/history/suggest/shows")
        .then((d) => d.data ?? []);
      let movies = server
        .GET("/api/history/suggest/movies")
        .then((d) => d.data ?? []);

      let [showSuggestions, movieSuggestions] = await Promise.all([
        shows,
        movies,
      ]);
      return { showSuggestions, movieSuggestions };
    },
  }));

  const trendingShows = queryApi.useQuery("get", "/api/search/trending_shows");
  const trendingMovies = queryApi.useQuery(
    "get",
    "/api/search/trending_movies",
  );

  return (
    <>
      <Title text="Home" />
      <div class="p-2">
        <Show
          when={
            suggestions.data?.showSuggestions.length ||
            suggestions.data?.movieSuggestions.length
          }
        >
          <ContinueWatchingSection
            showHistory={suggestions.data!.showSuggestions}
            movieHistory={suggestions.data!.movieSuggestions}
          />
        </Show>
        <Show when={trendingShows.data}>
          {(shows) => <TrendingShows shows={shows()} />}
        </Show>
        <Show when={trendingMovies.data}>
          {(movies) => <TrendingMovies movies={movies()} />}
        </Show>
      </div>
    </>
  );
}
