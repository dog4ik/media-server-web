import { createSignal, For, Show, Suspense } from "solid-js";
import { createAsync, useParams } from "@solidjs/router";
import Description from "../components/Description";
import SeasonsCarousel from "../components/ShowView/SeasonsCarousel";
import EpisodeCard from "../components/Cards/EpisodeCard";
import ElementsGrid from "../components/ElementsGrid";
import AlterEpisodeDetailsModal from "../components/modals/AlterEpisodeDetails";
import { getCachedEpisodes, getCachedSeasons, getCachedShowById } from "../utils/cachedApi";

export default function ShowPage() {
  let params = useParams();

  let show = createAsync(() => getCachedShowById(+params.show_id));
  let [selectedSeason, setSelectedSeason] = createSignal<number | undefined>();

  let seasons = createAsync(async () => {
    let seasons = await getCachedSeasons(+params.show_id);
    setSelectedSeason(seasons[0].number);
    return seasons;
  });

  let episodes = createAsync(async () => {
    return getCachedEpisodes(
      +params.show_id,
      selectedSeason() ?? seasons()?.at(0)?.number ?? 0,
    );
  });

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
          onEdit={() => {}}
          episodeId={alteredEpisode()!}
          ref={episodeModal!}
        />
      </Show>
      <Description item={show()} />
      <Suspense fallback={<div>Loading seasons</div>}>
        <Show when={show() && seasons()}>
          <SeasonsCarousel
            tabs={seasons()!.map((s) => s.number)}
            onClick={(season) => setSelectedSeason(season)}
          />
        </Show>
      </Suspense>
      <Suspense fallback={<div>Loading episodes</div>}>
        <Show when={show() && seasons() && episodes()}>
          <ElementsGrid elementSize={320}>
            <For each={episodes()!}>
              {(ep) => {
                return (
                  <EpisodeCard
                    url={`${selectedSeason()}/${ep.number}`}
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
