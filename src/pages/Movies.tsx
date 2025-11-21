import { For, Match, Show, Switch } from "solid-js";
import PageTitle from "@/components/PageTitle";
import { ElementsGrid } from "@/components/ElementsGrid";
import { MovieCard, MovieCardSkeleton } from "@/components/Cards/MovieCard";
import Title from "@/utils/Title";
import AddFoldersHelp from "@/components/AddFoldersHelp";
import { queryApi } from "@/utils/queryApi";

export default function Movies() {
  let movies = queryApi.useQuery("get", "/api/local_movies");

  return (
    <>
      <Title text="All movies" />
      <PageTitle>Movies</PageTitle>
      <Show
        when={movies.latest() !== undefined && movies.latest()?.length === 0}
      >
        <AddFoldersHelp contentType="movie" />
      </Show>
      <Switch>
        <Match when={movies.isSuccess}>
          <ElementsGrid elementSize={250}>
            <For each={movies.latest()}>
              {(movie) => <MovieCard movie={movie} />}
            </For>
          </ElementsGrid>
        </Match>
        <Match when={movies.isLoading}>
          <ElementsGrid elementSize={250}>
            {[...Array(7)].map(MovieCardSkeleton)}
          </ElementsGrid>
        </Match>
      </Switch>
    </>
  );
}
