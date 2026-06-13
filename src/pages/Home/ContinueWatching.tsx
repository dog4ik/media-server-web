import { EpisodeCard } from "@/components/Cards/EpisodeCard";
import { MovieCard } from "@/components/Cards/MovieCard";
import { extendEpisode } from "@/utils/library";
import { queryApi } from "@/utils/queryApi";
import { linkOptions } from "@tanstack/solid-router";
import { For, Suspense } from "solid-js";

export function ContinueWatchingSection() {
  let showHistory = queryApi.useQuery("get", "/api/history/suggest/shows");
  let movieHistory = queryApi.useQuery("get", "/api/history/suggest/movies");

  return (
    <>
      <p class="my-8 text-3xl">Continue watching</p>
      <div class="space-y-4">
        <div class="flex items-center gap-4">
          <Suspense>
            <For each={showHistory.data}>
              {(show) => {
                let episode = extendEpisode(show.episode, show.show_id.toString());
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
                      search: { provider: show.episode.provider },
                    })}
                    onDelete={() => null}
                    onOptimize={() => null}
                    onFixMetadata={() => null}
                  />
                );
              }}
            </For>
          </Suspense>
        </div>
        <div class="flex items-center gap-4">
          <Suspense>
            <For each={movieHistory.data}>
              {(movie) => {
                return (
                  <MovieCard
                    movie={{
                      ...movie.movie,
                      provider: movie.movie.metadata_provider,
                      provider_id: movie.movie.metadata_id,
                    }}
                  />
                );
              }}
            </For>
          </Suspense>
        </div>
      </div>
    </>
  );
}
