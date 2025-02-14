import { createEffect, createSignal, For, Show } from "solid-js";
import { createAsync, useNavigate } from "@solidjs/router";
import Description from "@/components/Description";
import EpisodeCard from "@/components/Cards/EpisodeCard";
import ElementsGrid from "@/components/ElementsGrid";
import { fullUrl, revalidatePath, Schemas, server } from "../utils/serverApi";
import { useProvider } from "@/utils/metadataProviders";
import { setBackdrop } from "@/context/BackdropContext";
import DownloadTorrentModal from "@/components/modals/TorrentDownload";
import { extendEpisode, fetchSeason, fetchShow, Media } from "@/utils/library";
import Title from "@/utils/Title";
import Icon from "@/components/ui/Icon";
import { FiDownload, FiSkipForward, FiTrash } from "solid-icons/fi";
import { useServerStatus } from "@/context/ServerStatusContext";
import FallbackImage from "@/components/FallbackImage";
import useToggle from "@/utils/useToggle";
import { formatSE } from "@/utils/formats";
import promptConfirm from "@/components/modals/ConfirmationModal";

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

type SeasonsTableProps = {
  seasons: number[];
  onSelect: (season: number) => void;
  currentSeason: number;
};

function SeasonsTable(props: SeasonsTableProps) {
  return <div></div>;
}

type SeasonProps = {
  showId: string;
  season: number;
  provider: Schemas["MetadataProvider"];
  torrentQuery: string;
  canDetectIntros: boolean;
};

function Season(props: SeasonProps) {
  let season = createAsync(() =>
    fetchSeason(props.showId, props.season, props.provider),
  );
  let [downloadModal, setDownloadModal] = useToggle(false);
  return (
    <Show when={season()}>
      {(season) => (
        <>
          <DownloadTorrentModal
            open={downloadModal()}
            onClose={() => setDownloadModal(false)}
            metadata_id={season()?.metadata_id}
            metadata_provider={season()?.metadata_provider}
            query={props.torrentQuery}
            content_type="show"
          />
          <div>
            <div class="sticky top-0 z-10 flex h-40 max-h-40 gap-4 rounded-xl bg-neutral-900/80 p-4">
              <div>
                <FallbackImage
                  alt="Poster image"
                  class="aspect-poster grow rounded-xl object-cover"
                  width={57}
                  height={86}
                  srcList={[season().localPoster(), season().poster]}
                />
              </div>
              <div class="flex flex-1 flex-col gap-4">
                <div>
                  <h3 class="text-2xl">Season {props.season}</h3>
                  <span class="text-xs">{season().release_date}</span>
                </div>
                <Show when={season().plot}>
                  <p class="line-clamp-3">{season().plot}</p>
                </Show>
              </div>
              <Icon tooltip="Download" onClick={() => setDownloadModal(true)}>
                <FiDownload size={30} />
              </Icon>
              <Show when={season().metadata_provider == "local"}>
                <Icon
                  tooltip={
                    props.canDetectIntros
                      ? `Detect intros for season ${props.season}`
                      : "Server does not support intro detection"
                  }
                  disabled={!props.canDetectIntros}
                  onClick={() => detectIntros(+props.showId, props.season)}
                >
                  <FiSkipForward size={30} />
                </Icon>
                <Icon
                  tooltip={`Delete season ${props.season}`}
                  onClick={() =>
                    deleteContent(season()).then(() =>
                      revalidatePath("/api/show/{id}/{season}"),
                    )
                  }
                >
                  <FiTrash size={30} />
                </Icon>
              </Show>
            </div>
            <ElementsGrid elementSize={300}>
              <For each={season().episodes}>
                {(episode) => {
                  let ep = extendEpisode(episode, props.showId);
                  return (
                    <EpisodeCard
                      url={ep.url()}
                      onFixMetadata={() => null}
                      onOptimize={() => null}
                      onDelete={() =>
                        deleteContent(ep).then(() => {
                          revalidatePath("/api/show/{id}/{season}");
                        })
                      }
                      episode={{
                        ...ep,
                      }}
                      availableLocally={ep.metadata_provider == "local"}
                    />
                  );
                }}
              </For>
            </ElementsGrid>
          </div>
        </>
      )}
    </Show>
  );
}

export default function EnhancedShowPage() {
  let [id, provider] = useProvider();
  let [downloadModal, setDownloadModal] = createSignal(false);
  let navigator = useNavigate();

  let [{ capabilities }] = useServerStatus();

  let show = createAsync(() => fetchShow(id(), provider()));

  createEffect(() => {
    let showData = show();
    if (showData) {
      let localImage =
        showData.metadata_provider == "local"
          ? fullUrl("/api/show/{id}/backdrop", {
              path: { id: +showData.metadata_id },
            })
          : undefined;
      setBackdrop([localImage, showData.backdrop ?? undefined]);
    }
  });

  return (
    <>
      <Title text={show()?.title} />
      <Show when={show()}>
        {(show) => (
          <>
            <DownloadTorrentModal
              open={downloadModal()}
              onClose={() => setDownloadModal(false)}
              metadata_id={show().metadata_id}
              metadata_provider={provider()}
              query={`${show().friendlyTitle()} complete`}
              content_type="show"
            />
            <Description
              title={show().title}
              localPoster={show().localPoster()}
              plot={show().plot}
              poster={show().poster}
              imageDirection="vertical"
              additionalInfo={
                show().release_date
                  ? [{ info: show().release_date! }]
                  : undefined
              }
            >
              <div class="flex items-center gap-2">
                <Icon
                  tooltip={`Download ${show().friendlyTitle()}`}
                  onClick={() => setDownloadModal(true)}
                >
                  <FiDownload size={30} />
                </Icon>
                <Show when={show().metadata_provider === "local"}>
                  <Icon
                    tooltip="Delete show"
                    onClick={() =>
                      deleteContent(show()).then(() => {
                        revalidatePath("/api/local_shows");
                        navigator("/shows");
                      })
                    }
                  >
                    <FiTrash size={30} />
                  </Icon>
                </Show>
              </div>
            </Description>
            <div class="mt-14">
              <For each={show().seasons ?? []}>
                {(seasonNum) => (
                  <Season
                    torrentQuery={`${show().friendlyTitle()} S${formatSE(seasonNum)}`}
                    canDetectIntros={
                      capabilities()?.chromaprint_enabled ?? false
                    }
                    season={seasonNum}
                    showId={id()}
                    provider={provider()}
                  />
                )}
              </For>
            </div>
          </>
        )}
      </Show>
    </>
  );
}
