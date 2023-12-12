import { For, createResource } from "solid-js";
import { getAllShows } from "../utils/serverApi";
import ShowCard from "../components/Cards/ShowCard";
import PageTitle from "../components/PageTitle";
export default function Shows() {
  const [shows] = createResource(async () => await getAllShows());

  return (
    <>
      <PageTitle>Shows</PageTitle>
      <div class="flex gap-10 flex-wrap">
        <For each={shows()}>{(show) => <ShowCard show={show} />}</For>
      </div>
    </>
  );
}
