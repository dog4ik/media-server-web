import MoreButton from "../ContextMenu/MoreButton";
import { createMemo, Show } from "solid-js";
import { Schemas, fullUrl } from "../../utils/serverApi";
import FallbackImage from "../FallbackImage";
import useToggle from "../../utils/useToggle";
import FixMetadata from "../FixMetadata";
import { MenuRow } from "../ContextMenu/Menu";
import promptConfirm from "../modals/ConfirmationModal";
import { Link, linkOptions } from "@tanstack/solid-router";
import { Skeleton } from "@/ui/skeleton";
import { ContentPosterIconSet } from "./ContentPosterIconSet";
import { queryApi, queryClient } from "@/utils/queryApi";
import { AddToListMenu } from "@/components/Lists/AddToListMenu";
import { invalidateListQueries, showListItems } from "@/lib/lists";
import { extendShow } from "@/utils/library";
import { useMediaNotifications } from "@/context/NotificationContext";

type Props = {
  show: Schemas["Show"];
};

export function ShowCard(props: Props) {
  let [fixModal, toggleFixModal] = useToggle(false);
  function handleFix() {
    toggleFixModal(true);
  }

  let imageUrl =
    props.show.provider == "local"
      ? fullUrl("/api/show/{id}/poster", {
          path: { id: +props.show.provider_id },
        })
      : undefined;

  let showLinkOptions = createMemo(() =>
    linkOptions({
      to: "/shows/$id",
      params: { id: props.show.provider_id },
      search: {
        provider: props.show.provider,
        season: props.show.seasons?.at(0),
      },
    }),
  );

  let deleteShow = queryApi.useMutation("delete", "/api/local_show/{id}", () => ({
    onSettled: () => {
      queryApi.invalidateQueries("get", "/api/local_shows");
    },
  }));

  let removeLiked = queryApi.useMutation("delete", "/api/lists/saved/remove/{metadata_id}", () => ({
    onSettled: invalidateListQueries,
  }));

  let removeWatchlist = queryApi.useMutation(
    "delete",
    "/api/lists/watchlist/remove/{metadata_id}",
    () => ({
      onSettled: invalidateListQueries,
    }),
  );

  let notificator = useMediaNotifications();
  let notify = (message: string) => notificator(extendShow(props.show), message);

  let likedList = () => props.show.local?.lists.find((l) => l.kind === "saved");
  let watchList = () => props.show.local?.lists.find((l) => l.kind === "watchlist");

  return (
    <>
      <Show when={fixModal()}>
        <FixMetadata
          open={fixModal()}
          contentType="show"
          targetId={props.show.provider_id}
          initialSearch={props.show.title}
          onClose={() => toggleFixModal(false)}
        />
      </Show>
      <div class="group w-full space-y-2">
        <div class="aspect-poster relative block w-full overflow-hidden rounded-xl">
          <Link {...showLinkOptions()}>
            <FallbackImage
              fluid
              alt="Show poster"
              srcList={[imageUrl, props.show.poster ?? undefined]}
              class="rounded-xl"
              width={312}
              height={415}
            />
          </Link>
          <Show when={props.show.episodes_amount}>
            <div
              title={`${props.show.episodes_amount} ${props.show.episodes_amount == 1 ? "episode" : "episodes"}`}
              class="absolute top-0 flex h-8 w-8 items-center justify-center rounded-xl bg-white"
            >
              <span class="text-sm font-semibold text-black">{props.show.episodes_amount}</span>
            </div>
          </Show>
          <ContentPosterIconSet
            liked={likedList()}
            onRemoveLike={() => {
              if (props.show.local?.metadata_id) {
                removeLiked.mutate({
                  params: { path: { metadata_id: props.show.local?.metadata_id } },
                });
              }
            }}
            onRemoveWatched={() => {
              if (props.show.local?.metadata_id) {
                removeWatchlist.mutate({
                  params: { path: { metadata_id: props.show.local.metadata_id } },
                });
              }
            }}
            watch={watchList()}
            localLink={
              props.show.local?.id && props.show.provider !== "local"
                ? {
                    ...linkOptions({
                      to: "/shows/$id",
                      search: { provider: "local" },
                      params: { id: props.show.local!.id.toString() },
                    }),
                  }
                : undefined
            }
          />
        </div>

        <div class="flex items-center justify-between">
          <Link class="text-md truncate" {...showLinkOptions()}>
            <span class="truncate" title={props.show.title}>
              {props.show.title}
            </span>
            <Show when={props.show.seasons}>
              <div class="text-sm font-bold text-white">
                {props.show.seasons!.length}{" "}
                {props.show.seasons!.length == 1 ? "season" : "seasons"}
              </div>
            </Show>
          </Link>
          <MoreButton>
            <AddToListMenu
              items={() => showListItems(props.show)}
              memberships={() => props.show.local?.lists}
              metadataId={() => props.show.local?.metadata_id}
              onAdded={(name) => notify(`Added to ${name}`)}
              onRemoved={(name) => notify(`Removed from ${name}`)}
            />
            <Show when={props.show.provider === "local"}>
              <MenuRow onClick={handleFix}>Fix metadata</MenuRow>
              <MenuRow
                variant="destructive"
                onClick={() =>
                  promptConfirm(`Are you sure you want to delete ${props.show.title}?`).then(
                    (confirmed) =>
                      confirmed &&
                      deleteShow.mutate({
                        params: { path: { id: +props.show.provider_id } },
                      }),
                  )
                }
              >
                Delete show
              </MenuRow>
            </Show>
          </MoreButton>
        </div>
      </div>
    </>
  );
}

export function ShowCardSkeleton() {
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
