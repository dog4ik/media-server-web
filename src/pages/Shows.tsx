import { For } from "solid-js";
import ShowCard from "../components/Cards/ShowCard";
import PageTitle from "../components/PageTitle";
import ElementsGrid from "../components/ElementsGrid";
import { createAsync } from "@solidjs/router";
import { getAllShows } from "../utils/serverApi";
export default function Shows() {
  const shows = createAsync(() => getAllShows());

  return (
    <>
      <PageTitle>Shows</PageTitle>
      <ElementsGrid elementSize={250}>
        <For each={shows()}>{(show) => <ShowCard show={show} />}</For>
      </ElementsGrid>
    </>
  );
}
