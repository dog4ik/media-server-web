import MoreButton from "../ContextMenu/MoreButton";
import FallbackImage from "../FallbackImage";
import { Schemas, fullUrl, server } from "../../utils/serverApi";
import { MenuRow } from "../ContextMenu/Menu";
import useToggle from "../../utils/useToggle";
import { createMemo, Show } from "solid-js";
import FixMetadata from "../FixMetadata";
import promptConfirm from "../modals/ConfirmationModal";
import { Link, linkOptions } from "@tanstack/solid-router";
import { Skeleton } from "@/ui/skeleton";
import { InLibraryIcon } from "./InLibraryIcon";
import { queryApi, queryClient } from "@/utils/queryApi";

async function deleteMovie(id: number, title: string) {
  try {
    if (await promptConfirm(`Are you sure you want to delete ${title}?`)) {
      await server.DELETE("/api/local_movie/{id}", {
        params: { path: { id } },
      });
    }
  } catch (_) {
  } finally {
    queryApi.invalidateQueries(queryClient, "get", "/api/local_movies");
  }
}

export function MovieCard(props: { movie: Schemas["Movie"] }) {
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
            <InLibraryIcon
              link={linkOptions({
                to: "/shows/$id",
                search: { provider: "local" },
                params: { id: props.movie.local!.id.toString() },
              })}
            />
          </Show>
        </Link>
        <div class="flex items-center justify-between">
          <Link title={props.movie.title} class="text-md truncate" {...movieLinkOptions()}>
            {props.movie.title}
          </Link>
          <Show when={props.movie.provider === "local"}>
            <MoreButton>
              <MenuRow onClick={handleFix}>Fix metadata</MenuRow>
              <MenuRow
                variant="destructive"
                onClick={() => deleteMovie(+props.movie.provider_id, props.movie.title)}
              >
                Delete movie
              </MenuRow>
            </MoreButton>
          </Show>
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
