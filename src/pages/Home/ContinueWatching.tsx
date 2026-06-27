import { EpisodeCard } from "@/components/Cards/EpisodeCard";
import { MovieCard } from "@/components/Cards/MovieCard";
import { extendEpisode } from "@/utils/library";
import { queryApi } from "@/utils/queryApi";
import { linkOptions } from "@tanstack/solid-router";
import { For, Show, Suspense } from "solid-js";

export function ContinueWatchingSection() {
  let showHistory = queryApi.useQuery("get", "/api/history/suggest/shows");
  let movieHistory = queryApi.useQuery("get", "/api/history/suggest/movies");

  return (
    <>
      <Show when={showHistory.latest()?.length || movieHistory.latest()?.length}>
        <p class="my-8 text-3xl">Continue watching</p>
      </Show>
      <div class="space-y-4">
        <div class="-mx-2 flex gap-4 overflow-x-auto px-2 pb-2">
          <Suspense>
            <For each={showHistory.data}>
              {(show) => {
                let episode = extendEpisode(show.episode, show.show_id.toString());
                return (
                  <div class="w-64 shrink-0 sm:w-80">
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
                  </div>
                );
              }}
            </For>
          </Suspense>
        </div>
        <div class="-mx-2 flex gap-4 overflow-x-auto px-2 pb-2">
          <Suspense>
            <For each={movieHistory.data}>
              {(movie) => {
                return (
                  <div class="w-32 shrink-0 sm:w-40">
                    <MovieCard
                      movie={{
                        ...movie.movie,
                        provider: movie.movie.metadata_provider,
                        provider_id: movie.movie.metadata_id,
                      }}
                    />
                  </div>
                );
              }}
            </For>
          </Suspense>
        </div>
      </div>
    </>
  );
}
