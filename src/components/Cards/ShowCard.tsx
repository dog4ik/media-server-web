import MoreButton from "../ContextMenu/MoreButton";
import { createMemo, Show } from "solid-js";
import { Schemas, fullUrl, server } from "../../utils/serverApi";
import FallbackImage from "../FallbackImage";
import useToggle from "../../utils/useToggle";
import FixMetadata from "../FixMetadata";
import { MenuRow } from "../ContextMenu/Menu";
import promptConfirm from "../modals/ConfirmationModal";
import { Link, linkOptions } from "@tanstack/solid-router";
import { Skeleton } from "@/ui/skeleton";
import { InLibraryIcon } from "./InLibraryIcon";
import { queryApi, queryClient } from "@/utils/queryApi";

async function deleteShow(id: number, name: string) {
  try {
    if (await promptConfirm(`Are you sure you want to delete ${name}?`)) {
      await server.DELETE("/api/local_show/{id}", { params: { path: { id } } });
    }
  } catch (_) {
  } finally {
    queryApi.invalidateQueries(queryClient, "get", "/api/local_shows");
  }
}

export function ShowCard(props: { show: Schemas["Show"] }) {
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
      <div class="w-full space-y-2">
        <Link
          class="aspect-poster relative block w-full overflow-hidden rounded-xl"
          {...showLinkOptions()}
        >
          <FallbackImage
            fluid
            alt="Show poster"
            srcList={[imageUrl, props.show.poster ?? undefined]}
            class="rounded-xl"
            width={312}
            height={415}
          />
          <Show when={props.show.episodes_amount}>
            <div
              title={`${props.show.episodes_amount} ${props.show.episodes_amount == 1 ? "episode" : "episodes"}`}
              class="absolute top-0 flex h-8 w-8 items-center justify-center rounded-xl bg-white"
            >
              <span class="text-sm font-semibold text-black">{props.show.episodes_amount}</span>
            </div>
          </Show>
          <Show when={props.show.local?.id && props.show.provider !== "local"}>
            <InLibraryIcon
              link={linkOptions({
                to: "/shows/$id",
                search: { provider: "local" },
                params: { id: props.show.local!.id.toString() },
              })}
            />
          </Show>
        </Link>
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
          <Show when={props.show.provider === "local"}>
            <MoreButton>
              <MenuRow onClick={handleFix}>Fix metadata</MenuRow>
              <MenuRow
                variant="destructive"
                onClick={() => deleteShow(+props.show.provider_id, props.show.title)}
              >
                Delete show
              </MenuRow>
            </MoreButton>
          </Show>
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
