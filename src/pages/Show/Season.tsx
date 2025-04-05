import EpisodeCard from "@/components/Cards/EpisodeCard";
import ElementsGrid from "@/components/ElementsGrid";
import FallbackImage from "@/components/FallbackImage";
import promptConfirm from "@/components/modals/ConfirmationModal";
import { IntrosModal } from "@/components/modals/IntrosModal";
import DownloadTorrentModal from "@/components/modals/TorrentDownload";
import Icon from "@/components/ui/Icon";
import { ExtendedSeason, extendEpisode, Media } from "@/utils/library";
import { revalidatePath, server } from "@/utils/serverApi";
import useToggle from "@/utils/useToggle";
import { createAsync } from "@solidjs/router";
import { FiDownload, FiSkipForward, FiTrash } from "solid-icons/fi";
import { For, Show } from "solid-js";

async function detectIntros(show_id: number, season: number) {
  await server.POST("/api/show/{show_id}/{season}/detect_intros", {
    params: { path: { season, show_id } },
  });
}

async function deleteContent<T extends Media>(content: T) {
  if (
    await promptConfirm(
      `Are you sure you want to delete ${content.friendlyTitle()}?`,
    )
  ) {
    let err = await content.delete();
    if (err !== undefined) {
      throw Error(err.message);
    }
  }
}

type Props = {
  season: ExtendedSeason;
  initialTorrentQuery: string;
  showId: string;
  canDetectIntros: boolean;
};

export default function Season(props: Props) {
  let [downloadModal, setDownloadModal] = useToggle(false);
  let [introsModal, setIntrosModal] = useToggle(false);

  return (
    <div>
      <DownloadTorrentModal
        open={downloadModal()}
        onClose={() => setDownloadModal(false)}
        metadata_id={props.season.metadata_id}
        metadata_provider={props.season.metadata_provider}
        query={props.initialTorrentQuery}
        content_type="show"
      />
      <Show when={props.season.metadata_provider == "local"}>
        <IntrosModal
          open={introsModal()}
          onClose={setIntrosModal}
          show_id={+props.showId}
          episodes={props.season.episodes.map((e) =>
            extendEpisode(e, props.showId),
          )}
          season={props.season.number}
        />
      </Show>
      <div class="sticky top-0 z-10 flex gap-4 rounded-xl bg-neutral-900/80 p-4">
        <div>
          <FallbackImage
            alt="Poster image"
            class="aspect-poster grow rounded-xl object-cover"
            width={57}
            height={86}
            srcList={[props.season.localPoster(), props.season.poster]}
          />
        </div>
        <div class="flex flex-1 flex-col gap-4">
          <div>
            <h3 class="text-2xl">Season {props.season.number}</h3>
            <span class="text-xs">{props.season.release_date}</span>
          </div>
          <Show when={props.season.plot}>
            <p class="line-clamp-3">{props.season.plot}</p>
          </Show>
        </div>
        <Icon tooltip="Download" onClick={() => setDownloadModal(true)}>
          <FiDownload size={30} />
        </Icon>
        <Icon tooltip="Manage intros" onClick={() => setIntrosModal(true)}>
          <FiSkipForward size={30} />
        </Icon>
        <Show when={props.season.metadata_provider == "local"}>
          <Icon
            tooltip={
              props.canDetectIntros
                ? `Detect intros for season ${props.season}`
                : "Server does not support intro detection"
            }
            disabled={!props.canDetectIntros}
            onClick={() => detectIntros(+props.showId, props.season.number)}
          >
            <FiSkipForward size={30} />
          </Icon>
          <Icon
            tooltip={`Delete season ${props.season}`}
            onClick={() =>
              deleteContent(props.season).then(() =>
                revalidatePath("/api/show/{id}/{season}"),
              )
            }
          >
            <FiTrash size={30} />
          </Icon>
        </Show>
      </div>
      <ElementsGrid elementSize={320}>
        <For each={props.season.extended_episodes}>
          {(ep) => {
            return (
              <EpisodeCard
                url={ep.url()}
                onFixMetadata={() => null}
                onOptimize={() => null}
                onDelete={() => null}
                video={undefined}
                episode={ep}
                availableLocally={ep.metadata_provider == "local"}
                history={undefined}
              />
            );
          }}
        </For>
      </ElementsGrid>
    </div>
  );
}
