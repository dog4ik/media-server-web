import { For, Show } from "solid-js";
import { Schemas, server } from "../utils/serverApi";
import EpisodeCard from "../components/Cards/EpisodeCard";
import MovieCard from "../components/Cards/MovieCard";
import { createAsync } from "@solidjs/router";
import Title from "../utils/Title";
import { extendEpisode } from "@/utils/library";

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
      </div>
    </>
  );
}
