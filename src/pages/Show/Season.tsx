import EpisodeCard from "@/components/Cards/EpisodeCard";
import ElementsGrid from "@/components/ElementsGrid";
import FallbackImage from "@/components/FallbackImage";
import promptConfirm from "@/components/modals/ConfirmationModal";
import { IntrosModal } from "@/components/modals/IntrosModal";
import DownloadTorrentModal from "@/components/modals/TorrentDownload";
import Icon from "@/components/ui/Icon";
import { Skeleton } from "@/ui/skeleton";
import {
  extendEpisode,
  extendSeason,
  Media,
  posterList,
} from "@/utils/library";
import { queryApi } from "@/utils/queryApi";
import { revalidatePath, Schemas, server } from "@/utils/serverApi";
import useToggle from "@/utils/useToggle";
import { getRouteApi, linkOptions } from "@tanstack/solid-router";
import clsx from "clsx";
import { FiDownload, FiSkipForward, FiTrash } from "solid-icons/fi";
import { For, Show, Suspense } from "solid-js";

const POSTER_WIDTH = 57;
const POSTER_HEIGHT = 86;

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
  season: number;
  initialTorrentQuery: (provider: Schemas["TorrentIndexIdentifier"]) => string;
  showId: string;
  canDetectIntros: boolean;
};

function SkeletonSeasonBar() {
  return (
    <>
      <div>
        <Skeleton
          style={{ width: `${POSTER_WIDTH}px`, height: `${POSTER_HEIGHT}px` }}
        />
      </div>
      <div class="flex flex-1 flex-col gap-3">
        <div class="space-y-3">
          <Skeleton class="h-5 w-24" />
          <Skeleton class="h-3 w-20" />
        </div>
        <Skeleton class="h-4 w-5/6" />
        <Skeleton class="h-4 w-4/6" />
      </div>
      <Skeleton class="h-10 w-10" />
      <Skeleton class="h-10 w-10" />
      <Skeleton class="h-10 w-10" />
      <Skeleton class="h-10 w-10" />
    </>
  );
}

export default function Season(props: Props) {
  let route = getRouteApi("/page/shows/$id");
  let params = route.useParams();
  let search = route.useSearch();

  let [downloadModal, setDownloadModal] = useToggle(false);
  let [introsModal, setIntrosModal] = useToggle(false);

  let seasonQuery = queryApi.useQuery(
    "get",
    "/api/show/{id}/{season}",
    () => ({
      params: {
        query: { provider: search().provider },
        path: {
          id: params().id,
          season: props.season,
        },
      },
    }),
    () => ({
      select: (s) => extendSeason(s, params().id),
      staleTime: 10_000,
      placeholderData: (previousData, _) => previousData,
    }),
  );

  return (
    <div>
      <Show when={seasonQuery.latest()}>
        {(season) => (
          <>
            <Suspense>
              <DownloadTorrentModal
                open={downloadModal()}
                onClose={() => setDownloadModal(false)}
                metadata_id={season().metadata_id}
                metadata_provider={season().metadata_provider}
                query={props.initialTorrentQuery}
                content_type="show"
              />
            </Suspense>
            <Show when={season().metadata_provider == "local"}>
              <IntrosModal
                open={introsModal()}
                onClose={setIntrosModal}
                show_id={+props.showId}
                episodes={season().episodes.map((e) =>
                  extendEpisode(e, props.showId),
                )}
                season={season().number}
              />
            </Show>
          </>
        )}
      </Show>
      <div
        class={clsx(
          "sticky top-0 z-10 flex gap-4 rounded-xl bg-neutral-900/80 p-4 transition-opacity",
          seasonQuery.isFetching &&
            seasonQuery.isPlaceholderData &&
            "opacity-50",
        )}
      >
        <Show when={seasonQuery.latest()} fallback={<SkeletonSeasonBar />}>
          {(season) => (
            <>
              <div>
                <FallbackImage
                  alt="Poster image"
                  class="aspect-poster grow rounded-xl object-cover"
                  width={57}
                  height={86}
                  srcList={posterList(season())}
                />
              </div>
              <div class="flex flex-1 flex-col gap-4">
                <div>
                  <h3 class="text-2xl">Season {season().number}</h3>
                  <span class="text-xs">{season().release_date}</span>
                </div>
                <Show when={season().plot}>
                  <p class="line-clamp-3">{season().plot}</p>
                </Show>
              </div>
              <Icon tooltip="Download" onClick={() => setDownloadModal(true)}>
                <FiDownload size={30} />
              </Icon>
              <Icon
                tooltip="Manage intros"
                onClick={() => setIntrosModal(true)}
              >
                <FiSkipForward size={30} />
              </Icon>
              <Show when={season().metadata_provider == "local"}>
                <Icon
                  tooltip={
                    props.canDetectIntros
                      ? `Detect intros for season ${season().number}`
                      : "Server does not support intro detection"
                  }
                  disabled={!props.canDetectIntros}
                  onClick={() => detectIntros(+props.showId, season().number)}
                >
                  <FiSkipForward size={30} />
                </Icon>
                <Icon
                  tooltip={`Delete season ${season().number}`}
                  onClick={() =>
                    deleteContent(season()).then(() =>
                      revalidatePath("/api/show/{id}/{season}"),
                    )
                  }
                >
                  <FiTrash size={30} />
                </Icon>
              </Show>
            </>
          )}
        </Show>
      </div>
      <ElementsGrid
        class={clsx(
          "transition-opacity",
          seasonQuery.isFetching &&
            seasonQuery.isPlaceholderData &&
            "opacity-50",
        )}
        elementSize={320}
      >
        <For each={seasonQuery.latest()?.extended_episodes}>
          {(ep) => (
            <div
              class={clsx(
                "transition-opacity",
                seasonQuery.isFetching &&
                  seasonQuery.isPlaceholderData &&
                  "opacity-50",
              )}
            >
              <EpisodeCard
                link={linkOptions({
                  to: "/shows/$id/$season/$episode",
                  params: {
                    id: props.showId,
                    season: ep.season_number.toString(),
                    episode: ep.number.toString(),
                  },
                  search: { provider: ep.metadata_provider },
                })}
                onFixMetadata={() => null}
                onOptimize={() => null}
                onDelete={() => null}
                video={undefined}
                episode={ep}
                availableLocally={ep.metadata_provider == "local"}
                history={undefined}
              />
            </div>
          )}
        </For>
      </ElementsGrid>
    </div>
  );
}
