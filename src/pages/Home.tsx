import { For, Show } from "solid-js";
import { useNotifications } from "../context/NotificationContext";
import { Schemas, server } from "../utils/serverApi";
import EpisodeCard from "../components/Cards/EpisodeCard";
import MovieCard from "../components/Cards/MovieCard";
import { createAsync } from "@solidjs/router";

type ContinueWatchingProps = {
  showHistory: Schemas["ShowHistory"][];
  movieHistory: Schemas["MovieHistory"][];
};

function ContinueWatchingSection(props: ContinueWatchingProps) {
  return (
    <>
      <p class="text-3xl my-8">Continue watching</p>
      <div class="flex items-center gap-4">
        <For each={props.showHistory}>
          {(show) => {
            let url = `shows/${show.show_id}/${show.episode.season_number}/${show.episode.number}`;
            return (
              <EpisodeCard
                episode={show.episode}
                history={show.history}
                url={url}
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
  let notificator = useNotifications();
  async function handleRefresh() {
    await server.POST("/api/scan");
    notificator("success", "Refreshing library");
  }
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
    <div class="p-2">
      <Show when={suggestions()}>
        {(suggestions) => (
          <ContinueWatchingSection
            showHistory={suggestions().showSuggestions}
            movieHistory={suggestions().movieSuggestions}
          />
        )}
      </Show>
      <button onClick={handleRefresh} class="rounded-xl bg-green-500 p-2">
        Refresh library
      </button>
    </div>
  );
}
