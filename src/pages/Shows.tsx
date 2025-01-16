import { For, Show } from "solid-js";
import ShowCard from "../components/Cards/ShowCard";
import PageTitle from "../components/PageTitle";
import ElementsGrid from "../components/ElementsGrid";
import { createAsync } from "@solidjs/router";
import { server } from "../utils/serverApi";
import Title from "../utils/Title";
import { throwResponseErrors } from "@/utils/errors";
import AddFoldersHelp from "@/components/AddFoldersHelp";
export default function Shows() {
  const shows = createAsync(() =>
    server.GET("/api/local_shows").then(throwResponseErrors),
  );

  return (
    <>
      <Title text="All shows" />
      <PageTitle>Shows</PageTitle>
      <Show when={shows() !== undefined && shows()?.length === 0}>
        <AddFoldersHelp contentType="show" />
      </Show>
      <ElementsGrid elementSize={250}>
        <For each={shows()}>{(show) => <ShowCard show={show} />}</For>
      </ElementsGrid>
    </>
  );
}
