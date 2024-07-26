import { createAsync } from "@solidjs/router";
import { For } from "solid-js";
import { server } from "../utils/serverApi";
import PageTitle from "../components/PageTitle";
import ElementsGrid from "../components/ElementsGrid";
import MovieCard from "../components/Cards/MovieCard";
import Title from "../utils/Title";

export default function Movies() {
  const movies = createAsync(() => server.GET("/api/local_movies"));

  return (
    <>
      <Title text="All movies"/>
      <PageTitle>Movies</PageTitle>
      <ElementsGrid elementSize={250}>
        <For each={movies()?.data}>{(movie) => <MovieCard movie={movie} />}</For>
      </ElementsGrid>
    </>
  );
}
