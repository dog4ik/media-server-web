import { For, Match, Show, Switch } from "solid-js";
import { ShowCard, ShowCardSkeleton } from "../components/Cards/ShowCard";
import PageTitle from "../components/PageTitle";
import { ElementsGrid } from "../components/ElementsGrid";
import Title from "../utils/Title";
import AddFoldersHelp from "@/components/AddFoldersHelp";
import { queryApi } from "@/utils/queryApi";
export default function Shows() {
  const shows = queryApi.useQuery("get", "/api/local_shows");

  return (
    <>
      <Title text="All shows" />
      <PageTitle>Shows</PageTitle>
      <Show when={shows.latest() !== undefined && shows.latest()?.length === 0}>
        <AddFoldersHelp contentType="show" />
      </Show>
      <Switch>
        <Match when={shows.isSuccess}>
          <ElementsGrid elementSize={250}>
            <For each={shows.latest()}>
              {(show) => <ShowCard show={show} />}
            </For>
          </ElementsGrid>
        </Match>
        <Match when={shows.isLoading}>
          <ElementsGrid elementSize={250}>
            {[...Array(7)].map(ShowCardSkeleton)}
          </ElementsGrid>
        </Match>
      </Switch>
    </>
  );
}
