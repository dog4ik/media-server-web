import { For } from "solid-js";
import ShowCard from "../components/Cards/ShowCard";
import PageTitle from "../components/PageTitle";
import ElementsGrid from "../components/ElementsGrid";
import { createAsync } from "@solidjs/router";
import { server } from "../utils/serverApi";
export default function Shows() {
  const shows = createAsync(() => server.GET("/api/local_shows"));

  return (
    <>
      <PageTitle>Shows</PageTitle>
      <ElementsGrid elementSize={250}>
        <For each={shows()?.data}>{(show) => <ShowCard show={show} />}</For>
      </ElementsGrid>
    </>
  );
}
