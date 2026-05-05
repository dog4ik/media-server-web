import { Schemas, revalidatePath, server } from "../../utils/serverApi";
import MoreButton from "../ContextMenu/MoreButton";
import { Show } from "solid-js";
import { formatDuration, formatTimeBeforeRelease } from "../../utils/formats";
import { WatchProgressBar } from "./ProgressBar";
import FallbackImage from "../FallbackImage";
import { MenuRow } from "../ContextMenu/Menu";
import { ExtendedEpisode, posterList } from "@/utils/library";
import { useMediaNotifications } from "@/context/NotificationContext";
import promptConfirm from "../modals/ConfirmationModal";
import { Link, linkOptions, LinkOptions } from "@tanstack/solid-router";
import { Skeleton } from "@/ui/skeleton";
import { InLibaryIcon } from "./InLibraryIcon";

type Props = {
  episode: ExtendedEpisode;
  link: LinkOptions;
  video?: Schemas["DetailedVideo"];
  localShowId?: number;
  onFixMetadata: () => void;
  onOptimize: () => void;
  onDelete: () => void;
};

function revalidateHistory() {
  revalidatePath("/api/show/{id}/{season}");
  revalidatePath("/api/history/suggest/shows");
  revalidatePath("/api/history/suggest/movies");
  revalidatePath("/api/history");
  revalidatePath("/api/video/{id}");
  revalidatePath("/api/video/by_content");
}

async function markWatched(historyId: number, force: boolean) {
  try {
    if (force) {
      await server.PUT("/api/history/{id}", {
        body: { is_finished: true, time: 0 },
        params: { path: { id: historyId } },
      });
    } else {
      await server.DELETE("/api/history/{id}", {
        params: { path: { id: historyId } },
      });
    }
  } catch (_) {
  } finally {
    revalidateHistory();
  }
}

async function deleteEpisode(id: number, title: string) {
  try {
    if (await promptConfirm(`Are you sure you want to delete ${title}?`)) {
      await server.DELETE("/api/local_episode/{id}", {
        params: { path: { id } },
      });
    }
  } catch (_) {
  } finally {
    revalidateHistory();
  }
}

async function markWatchedVideo(videoId: number, force: boolean) {
  try {
    if (force) {
      await server.PUT("/api/video/{id}/history", {
        body: { is_finished: true, time: 0 },
        params: { path: { id: videoId } },
      });
    } else {
      await server.DELETE("/api/video/{id}/history", {
        params: { path: { id: videoId } },
      });
    }
  } catch (_) {
  } finally {
    revalidateHistory();
  }
}

export function EpisodeCard(props: Props) {
  let notificator = useMediaNotifications();

  let notify = (message: string) => notificator(props.episode, message);

  return (
    <div class="flex w-80 cursor-pointer flex-col">
      <Link class="relative w-full overflow-hidden rounded-xl" {...props.link}>
        <FallbackImage
          alt="Episode poster"
          width={320}
          height={180}
          class="aspect-video rounded-xl"
          srcList={posterList(props.episode)}
        />
        <Show when={props.episode.release_date}>
          {(date) => (
            <div class="bg-black-20 absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full">
              <span class="text-xl">{formatTimeBeforeRelease(date())}</span>
            </div>
          )}
        </Show>
        <Show
          when={
            props.episode.local?.id &&
            props.localShowId &&
            props.episode.metadata_provider !== "local"
          }
        >
          <InLibaryIcon
            link={linkOptions({
              to: "/shows/$id/$season/$episode",
              search: { provider: "local" },
              params: {
                id: props.localShowId!.toString(),
                season: props.episode.season_number.toString(),
                episode: props.episode.number.toString(),
              },
            })}
          />
        </Show>
        <Show when={props.episode.runtime}>
          <div class="absolute right-2 bottom-2 flex items-center justify-center bg-black/90 p-1">
            <span class="text-xs font-semibold">{formatDuration(props.episode.runtime!)}</span>
          </div>
        </Show>
        <Show when={props.episode.runtime && props.episode.local?.history}>
          <WatchProgressBar
            history={props.episode.local!.history!}
            runtime={props.episode.runtime!}
          />
        </Show>
      </Link>
      <div class="flex items-center justify-between">
        <Link class="flex flex-col pt-2" {...props.link}>
          <span class="text-base" title={props.episode.title}>
            {props.episode.title}
          </span>
          <span class="pt-1 text-sm">Episode {props.episode.number}</span>
        </Link>
        <Show when={props.video || props.episode.metadata_provider === "local"}>
          <MoreButton>
            <Show
              when={props.episode.local?.history}
              fallback={
                <MenuRow
                  onClick={() =>
                    markWatchedVideo(props.video!.id, true).then(() => notify("Marked as watched"))
                  }
                >
                  Mark as watched
                </MenuRow>
              }
            >
              <Show when={!props.episode.local?.history?.is_finished}>
                <MenuRow
                  onClick={() =>
                    markWatched(props.episode.local!.history!.id, true).then(() =>
                      notify("Marked as watched"),
                    )
                  }
                >
                  Mark as watched
                </MenuRow>
              </Show>
              <MenuRow
                onClick={() =>
                  markWatched(props.episode.local!.history!.id, false).then(() =>
                    notify("Marked as unwatched"),
                  )
                }
              >
                Mark as unwatched
              </MenuRow>
            </Show>
            <Show when={props.episode.metadata_provider == "local"}>
              <MenuRow
                onClick={() =>
                  deleteEpisode(+props.episode.metadata_id, props.episode.friendlyTitle())
                }
              >
                Delete episode
              </MenuRow>
            </Show>
          </MoreButton>
        </Show>
      </div>
    </div>
  );
}

export function EpisodeCardSkeleton() {
  return (
    <div class="flex w-80 cursor-pointer flex-col">
      <Skeleton height={180} class="aspect-video rounded-xl" />
      <div class="flex items-center justify-between">
        <span class="flex flex-col pt-2">
          <Skeleton width={20} />
          <Skeleton width={20} />
        </span>
      </div>
    </div>
  );
}
