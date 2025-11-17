import { For, Show } from "solid-js";
import PageTitle from "../components/PageTitle";
import ElementsGrid from "../components/ElementsGrid";
import MovieCard from "../components/Cards/MovieCard";
import Title from "../utils/Title";
import AddFoldersHelp from "@/components/AddFoldersHelp";
import { queryApi } from "@/utils/queryApi";

export default function Movies() {
  let movies = queryApi.useQuery("get", "/api/local_movies");

  return (
    <>
      <Title text="All movies" />
      <PageTitle>Movies</PageTitle>
      <Show when={movies.data !== undefined && movies.data?.length === 0}>
        <AddFoldersHelp contentType="movie" />
      </Show>
      <ElementsGrid elementSize={250}>
        <For each={movies.data}>{(movie) => <MovieCard movie={movie} />}</For>
      </ElementsGrid>
    </>
  );
}
