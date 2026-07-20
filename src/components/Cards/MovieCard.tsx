import MoreButton from "../ContextMenu/MoreButton";
import FallbackImage from "../FallbackImage";
import { fullUrl } from "../../utils/serverApi";
import { MenuRow } from "../ContextMenu/Menu";
import useToggle from "../../utils/useToggle";
import { createMemo, Show } from "solid-js";
import FixMetadata from "../FixMetadata";
import promptConfirm from "../modals/ConfirmationModal";
import { Link, linkOptions } from "@tanstack/solid-router";
import { Skeleton } from "@/ui/skeleton";
import { ContentPosterIconSet } from "./ContentPosterIconSet";
import { queryApi, queryClient } from "@/utils/queryApi";
import { useMediaNotifications } from "@/context/NotificationContext";
import { ExtendedMovie } from "@/utils/library";
import { WatchProgressBar } from "./ProgressBar";
import { AddToListMenu } from "@/components/Lists/AddToListMenu";
import { movieListItems } from "@/lib/lists";

type Props = {
  movie: ExtendedMovie;
  onMarkWatched: () => void;
};

export function MovieCard(props: Props) {
  let [fixModal, toggleFixModal] = useToggle(false);
  function handleFix() {
    toggleFixModal(true);
  }

  let localUrl =
    props.movie.provider == "local"
      ? fullUrl("/api/movie/{id}/poster", {
          path: { id: +props.movie.provider_id },
        })
      : undefined;

  let movieLinkOptions = createMemo(() =>
    linkOptions({
      to: "/movies/$id",
      params: { id: props.movie.provider_id },
      search: { provider: props.movie.provider },
    }),
  );

  let deleteMovie = queryApi.useMutation("delete", "/api/local_movie/{id}", () => ({
    onSettled: () => queryApi.invalidateQueries(queryClient, "get", "/api/local_movies"),
  }));

  let markExternalWatched = queryApi.useMutation(
    "post",
    "/api/history/external_mark_as_watched",
    () => ({
      onSuccess: () => onWatchStatusChange("Marked as watched"),
    }),
  );

  let markAsWatched = queryApi.useMutation("put", "/api/metadata/{id}/history", () => ({
    onSuccess: () => onWatchStatusChange("Marked as watched"),
  }));

  let markAsUnwatched = queryApi.useMutation("delete", "/api/history/{id}", () => ({
    onSuccess: () => onWatchStatusChange("Marked as watched"),
  }));

  let notificator = useMediaNotifications();

  let notify = (message: string) => notificator(props.movie, message);

  let onWatchStatusChange = (message: string) => {
    notify(message);
    props.onMarkWatched?.();
  };

  return (
    <>
      <Show when={fixModal()}>
        <FixMetadata
          open={fixModal()}
          contentType="movie"
          targetId={props.movie.provider_id}
          initialSearch={props.movie.title}
          onClose={() => toggleFixModal(false)}
        />
      </Show>
      <div class="w-full space-y-2">
        <Link
          class="aspect-poster relative block w-full overflow-hidden rounded-xl"
          {...movieLinkOptions()}
        >
          <FallbackImage
            fluid
            alt="Movie poster"
            srcList={[localUrl, props.movie.poster ?? undefined]}
            class="rounded-xl"
            width={312}
            height={415}
          />
          <Show when={props.movie.local?.id && props.movie.provider !== "local"}>
            <ContentPosterIconSet
              link={linkOptions({
                to: "/shows/$id",
                search: { provider: "local" },
                params: { id: props.movie.local!.id.toString() },
              })}
            />
          </Show>
          <Show
            when={
              (props.movie.local?.local_duration ?? props.movie.runtime) &&
              props.movie.local?.history
            }
          >
            <WatchProgressBar
              history={props.movie.local!.history!}
              runtime={props.movie.local?.local_duration ?? props.movie.runtime!}
            />
          </Show>
        </Link>
        <div class="flex items-center justify-between">
          <Link title={props.movie.title} class="text-md truncate" {...movieLinkOptions()}>
            {props.movie.title}
          </Link>
          <MoreButton>
            <AddToListMenu
              items={() => movieListItems(props.movie)}
              onAdded={(name) => notify(`Added to ${name}`)}
            />
            <Show when={props.movie.provider === "local"}>
              <MenuRow onClick={handleFix}>Fix metadata</MenuRow>
              <MenuRow
                variant="destructive"
                onClick={() =>
                  promptConfirm(`Are you sure you want to delete ${props.movie.title}?`).then(
                    (confirmed) =>
                      confirmed &&
                      deleteMovie.mutate({
                        params: { path: { id: +props.movie.provider_id } },
                      }),
                  )
                }
              >
                Delete movie
              </MenuRow>
            </Show>
            <Show when={props.movie.local?.id === undefined}>
              <MenuRow
                onClick={() =>
                  markExternalWatched.mutate({
                    body: {
                      content: { content_type: "movie" },
                      provider_id: props.movie.provider_id,
                      provider: props.movie.provider,
                    },
                  })
                }
              >
                Mark as watched
              </MenuRow>
            </Show>

            <Show when={props.movie.local?.history?.id}>
              {(history_id) => (
                <MenuRow
                  onClick={() =>
                    markAsUnwatched.mutate({
                      params: {
                        path: { id: history_id() },
                      },
                    })
                  }
                >
                  Mark as unwatched
                </MenuRow>
              )}
            </Show>

            <Show when={!props.movie.local?.history?.is_finished && props.movie.local?.metadata_id}>
              {(metadata_id) => (
                <MenuRow
                  onClick={() =>
                    markAsWatched.mutate({
                      params: {
                        path: { id: metadata_id() },
                      },
                      body: {
                        time: 0,
                        is_finished: true,
                      },
                    })
                  }
                >
                  Mark as watched
                </MenuRow>
              )}
            </Show>
          </MoreButton>
        </div>
      </div>
    </>
  );
}

export function MovieCardSkeleton() {
  return (
    <div class="w-full space-y-2">
      <Skeleton class="aspect-poster h-auto w-full rounded-xl" />

      <div class="flex items-center justify-between">
        <Skeleton class="h-4 w-32" />
        <Skeleton class="h-6 rounded-full" />
      </div>
    </div>
  );
}
