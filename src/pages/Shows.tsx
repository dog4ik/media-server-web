import { For, Show } from "solid-js";
import ShowCard from "../components/Cards/ShowCard";
import PageTitle from "../components/PageTitle";
import ElementsGrid from "../components/ElementsGrid";
import Title from "../utils/Title";
import AddFoldersHelp from "@/components/AddFoldersHelp";
import { queryApi } from "@/utils/queryApi";
export default function Shows() {
  const shows = queryApi.useQuery("get", "/api/local_shows");

  return (
    <>
      <Title text="All shows" />
      <PageTitle>Shows</PageTitle>
      <Show when={shows.data !== undefined && shows.data.length === 0}>
        <AddFoldersHelp contentType="show" />
      </Show>
      <ElementsGrid elementSize={250}>
        <For each={shows.data}>{(show) => <ShowCard show={show} />}</For>
      </ElementsGrid>
    </>
  );
}
