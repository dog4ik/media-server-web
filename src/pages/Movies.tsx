import { createAsync } from "@solidjs/router";
import { For, Show } from "solid-js";
import { server } from "../utils/serverApi";
import PageTitle from "../components/PageTitle";
import ElementsGrid from "../components/ElementsGrid";
import MovieCard from "../components/Cards/MovieCard";
import Title from "../utils/Title";
import { throwResponseErrors } from "@/utils/errors";
import AddFoldersHelp from "@/components/AddFoldersHelp";

export default function Movies() {
  const movies = createAsync(() =>
    server.GET("/api/local_movies").then(throwResponseErrors),
  );

  return (
    <>
      <Title text="All movies" />
      <PageTitle>Movies</PageTitle>
      <Show when={movies() !== undefined && movies()?.length === 0}>
        <AddFoldersHelp contentType="movie" />
      </Show>
      <ElementsGrid elementSize={250}>
        <For each={movies()}>{(movie) => <MovieCard movie={movie} />}</For>
      </ElementsGrid>
    </>
  );
}
