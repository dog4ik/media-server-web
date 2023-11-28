import { createResource, createSignal, For, Show } from "solid-js";
import { getEpisodes, getSeasons, getShowById } from "../utils/ServerApi";
import { useParams } from "@solidjs/router";
import Description from "../components/Description";
import SeasonsCarousel from "../components/ShowView/SeasonsCarousel";
import EpisodeCard from "../components/Cards/EpisodeCard";
import ElementsGrid from "../components/ElementsGrid";

export default function ShowPage() {
  let params = useParams();
  let [show] = createResource(+params.show_id, getShowById);
  let [selectedSeason, setSelectedSeason] = createSignal<number | undefined>(
    undefined,
  );
  let [seasons] = createResource(+params.show_id, async (id) => {
    let seasons = await getSeasons(id);
    setSelectedSeason(seasons[0].number);
    return seasons;
  });
  let [episodes] = createResource(selectedSeason, async (season) => {
    return getEpisodes(+params.show_id, season);
  });
  return (
    <>
      <Show when={!show.loading}>
        <Description show={show()!} />
      </Show>
      <Show when={!seasons.loading}>
        <SeasonsCarousel
          tabs={[...seasons()!.map((s) => s.number), 11, 12]}
          onClick={(season) => setSelectedSeason(season)}
        />
      </Show>
      <Show when={!episodes.loading}>
        <ElementsGrid elementSize={320}>
          <For each={episodes()!}>
            {(ep) => {
              return <EpisodeCard episode={ep} />;
            }}
          </For>
        </ElementsGrid>
      </Show>
    </>
  );
}
