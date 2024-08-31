import { A } from "@solidjs/router";
import {
  Schemas,
  fullUrl,
  revalidatePath,
  server,
} from "../../utils/serverApi";
import MoreButton, { Row } from "../ContextMenu/MoreButton";
import { Show } from "solid-js";
import { FiDownload } from "solid-icons/fi";
import { formatDuration, formatTimeBeforeRelease } from "../../utils/formats";
import ProgressBar from "./ProgressBar";
import FallbackImage from "../FallbackImage";
import { MenuRow } from "../ContextMenu/Menu";
import { ExtendedEpisode, posterList } from "@/utils/library";
import { useMediaNotifications } from "@/context/NotificationContext";

type Props = {
  episode: ExtendedEpisode;
  url: string;
  availableLocally?: boolean;
  history?: Schemas["DbHistory"];
  video?: Schemas["DetailedVideo"];
  onFixMetadata: () => void;
  onOptimize: () => void;
  onDelete: () => void;
};

function revalidateHistory() {
  revalidatePath("/api/show/{id}/{season}");
  revalidatePath("/api/history/suggest/shows");
  revalidatePath("/api/history/suggest/movies");
  revalidatePath("/api/history/{id}");
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

export default function EpisodeCard(props: Props) {
  let notificator = useMediaNotifications();

  let notify = (message: string) => notificator(props.episode, message);

  return (
    <div class="flex w-80 cursor-pointer flex-col">
      <A href={props.url} class="relative w-full overflow-hidden rounded-xl">
        <FallbackImage
          alt="Episode poster"
          width={320}
          height={178}
          class="aspect-video rounded-xl"
          srcList={posterList(props.episode)}
        />
        <Show when={props.episode.release_date}>
          {(date) => (
            <div class="bg-black-20 absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full">
              <span class="text-xl">{formatTimeBeforeRelease(date())}</span>
            </div>
          )}
        </Show>
        <Show when={props.availableLocally}>
          <div
            title="Available locally"
            class="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-500"
          >
            <FiDownload />
          </div>
        </Show>
        <Show when={props.episode.runtime}>
          <div class="absolute bottom-2 right-2 flex items-center justify-center bg-black/90 p-1">
            <span class="text-xs font-semibold">
              {formatDuration(props.episode.runtime!)}
            </span>
          </div>
        </Show>
        <Show when={props.history && props.episode.runtime}>
          <ProgressBar
            history={props.history!}
            runtime={props.episode.runtime!.secs}
          />
        </Show>
      </A>
      <div class="flex items-center justify-between">
        <A href={props.url} class="flex flex-col pt-2">
          <span class="text-base" title={props.episode.title}>
            {props.episode.title}
          </span>
          <span class="pt-1 text-sm">Episode {props.episode.number}</span>
        </A>
        <Show when={props.video || props.episode.metadata_provider === "local"}>
          <MoreButton>
            <Show
              when={props.history}
              fallback={
                <MenuRow
                  onClick={() =>
                    markWatchedVideo(props.video!.id, true).then(() =>
                      notify("Marked as watched"),
                    )
                  }
                >
                  Mark as watched
                </MenuRow>
              }
            >
              <Show when={!props.history?.is_finished}>
                <MenuRow
                  onClick={() =>
                    markWatched(props.history!.id, true).then(() =>
                      notify("Marked as watched"),
                    )
                  }
                >
                  Mark as watched
                </MenuRow>
              </Show>
              <MenuRow
                onClick={() =>
                  markWatched(props.history!.id, false).then(() =>
                    notify("Marked as unwatched"),
                  )
                }
              >
                Mark as unwatched
              </MenuRow>
            </Show>
          </MoreButton>
        </Show>
      </div>
    </div>
  );
}
