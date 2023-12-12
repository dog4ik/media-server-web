import {
  createEffect,
  createResource,
  createSignal,
  For,
  Show,
  Suspense,
} from "solid-js";
import { getEpisodes, getSeasons, getShowById } from "../utils/serverApi";
import { useParams } from "@solidjs/router";
import Description from "../components/Description";
import SeasonsCarousel from "../components/ShowView/SeasonsCarousel";
import EpisodeCard from "../components/Cards/EpisodeCard";
import ElementsGrid from "../components/ElementsGrid";
import AlterEpisodeDetailsModal from "../components/modals/AlterEpisodeDetails";
import { useBackdrop } from "../context/BackdropContext";

export default function ShowPage() {
  let params = useParams();

  let [show] = createResource(+params.show_id, getShowById);
  let [selectedSeason, setSelectedSeason] = createSignal<number | undefined>();

  createEffect(() => {
    useBackdrop(show()?.backdrop);
  });

  let [seasons] = createResource(+params.show_id, async (id) => {
    let seasons = await getSeasons(id);
    setSelectedSeason(seasons[0].number);
    return seasons;
  });

  let [episodes, { refetch: refetchEpisodes }] = createResource(
    selectedSeason,
    async (season) => {
      return await getEpisodes(+params.show_id, season);
    },
  );

  let [alteredEpisode, setAlteredEpisode] = createSignal<number | undefined>();
  let episodeModal: HTMLDialogElement;

  function handleEditDetails(episodeId: number) {
    setAlteredEpisode(episodeId);
    episodeModal.showModal();
  }

  return (
    <>
      <Show when={alteredEpisode() !== undefined}>
        <AlterEpisodeDetailsModal
          onEdit={refetchEpisodes}
          episodeId={alteredEpisode()!}
          ref={episodeModal!}
        />
      </Show>
      <Suspense fallback={<div>Loading description</div>}>
        <Show when={!show.loading}>
          <Description show={show()!} />
        </Show>
      </Suspense>
      <Suspense fallback={<div>Loading seasons</div>}>
        <Show when={!show.loading && !seasons.loading}>
          <SeasonsCarousel
            tabs={seasons()!.map((s) => s.number)}
            onClick={(season) => setSelectedSeason(season)}
          />
        </Show>
      </Suspense>
      <Suspense fallback={<div>Loading episodes</div>}>
        <Show when={!show.loading && !seasons.loading && !episodes.loading}>
          <ElementsGrid elementSize={320}>
            <For each={episodes()!}>
              {(ep) => {
                return (
                  <EpisodeCard
                    onEditDetails={() => handleEditDetails(ep.id)}
                    onFixMetadata={() => null}
                    onOptimize={() => null}
                    onDelete={() => null}
                    episode={ep}
                  />
                );
              }}
            </For>
          </ElementsGrid>
        </Show>
      </Suspense>
    </>
  );
}
