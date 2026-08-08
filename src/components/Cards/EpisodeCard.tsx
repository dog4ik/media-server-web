import { Schemas } from "../../utils/serverApi";
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
import { InLibraryIcon } from "./InLibraryIcon";
import { queryApi, queryClient } from "@/utils/queryApi";

type Props = {
  episode: ExtendedEpisode;
  link: LinkOptions;
  video?: Schemas["DetailedVideo"];
  localShowId?: number;
  onFixMetadata: () => void;
  onOptimize: () => void;
  onDelete: () => void;
  onMarkWatched?: () => void;
};

function revalidateHistory() {
  queryApi.invalidateQueries(queryClient, "get", "/api/show/{id}/{season}");
  queryApi.invalidateQueries(queryClient, "get", "/api/history/suggest/shows");
  queryApi.invalidateQueries(queryClient, "get", "/api/history/suggest/movies");
  queryApi.invalidateQueries(queryClient, "get", "/api/history");
}

export function EpisodeCard(props: Props) {
  let notificator = useMediaNotifications();

  let notify = (message: string) => notificator(props.episode, message);

  let markExternalWatched = queryApi.useMutation(
    "post",
    "/api/history/external_mark_as_watched",
    () => ({
      onSuccess: () => onWatchStatusChange("Marked as watched"),
      onSettled: () => revalidateHistory(),
    }),
  );

  let markAsWatched = queryApi.useMutation("put", "/api/history/{id}", () => ({
    onSuccess: () => onWatchStatusChange("Marked as watched"),
    onSettled: () => revalidateHistory(),
  }));

  let markAsUnwatched = queryApi.useMutation("delete", "/api/history/{id}", () => ({
    onSuccess: () => onWatchStatusChange("Marked as watched"),
    onSettled: () => revalidateHistory(),
  }));

  let deleteEpisode = queryApi.useMutation("delete", "/api/local_episode/{id}", () => ({}));

  let onWatchStatusChange = (message: string) => {
    notify(message);
    props.onMarkWatched?.();
  };

  return (
    <div class="flex w-full cursor-pointer flex-col">
      <Link class="aspect-video relative block w-full overflow-hidden rounded-xl" {...props.link}>
        <FallbackImage
          fluid
          alt="Episode poster"
          width={320}
          height={180}
          class="rounded-xl"
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
          when={props.episode.local?.id && props.localShowId && props.episode.provider !== "local"}
        >
          <InLibraryIcon
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
        <MoreButton>
          <Show
            when={props.episode.local?.history}
            fallback={
              <MenuRow
                onClick={() =>
                  markExternalWatched.mutate({
                    body: {
                      content: {
                        content_type: "show",
                        season: props.episode.season_number,
                        episodes: [props.episode.number],
                      },
                      provider: props.episode.provider,
                      provider_id: props.episode.showId,
                    },
                  })
                }
              >
                Mark as watched
              </MenuRow>
            }
          >
            <Show when={!props.episode.local?.history?.is_finished}>
              <MenuRow
                onClick={() =>
                  markAsWatched.mutate({
                    params: { path: { id: props.episode.local!.history!.id } },
                    body: { is_finished: true, time: props.episode.local?.history?.time ?? 0 },
                  })
                }
              >
                Mark as watched
              </MenuRow>
            </Show>
            <MenuRow
              onClick={() =>
                markAsUnwatched.mutate({
                  params: { path: { id: props.episode.local!.history!.id } },
                })
              }
            >
              Mark as unwatched
            </MenuRow>
          </Show>
          <Show when={props.episode.provider == "local"}>
            <MenuRow
              variant="destructive"
              onClick={() =>
                promptConfirm(
                  `Are you sure you want to delete ${props.episode.friendlyTitle()}?`,
                ).then((confirmed) => {
                  if (confirmed)
                    deleteEpisode.mutate({ params: { path: { id: props.episode.local!.id } } });
                })
              }
            >
              Delete episode
            </MenuRow>
          </Show>
        </MoreButton>
      </div>
    </div>
  );
}

export function EpisodeCardSkeleton() {
  return (
    <div class="flex w-full cursor-pointer flex-col">
      <Skeleton class="aspect-video h-auto w-full rounded-xl" />
      <div class="flex items-center justify-between">
        <span class="flex flex-col pt-2">
          <Skeleton width={20} />
          <Skeleton width={20} />
        </span>
      </div>
    </div>
  );
}
