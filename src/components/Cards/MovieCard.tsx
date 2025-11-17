import MoreButton from "../ContextMenu/MoreButton";
import FallbackImage from "../FallbackImage";
import {
  Schemas,
  fullUrl,
  revalidatePath,
  server,
} from "../../utils/serverApi";
import { MenuRow } from "../ContextMenu/Menu";
import { useNotifications } from "../../context/NotificationContext";
import useToggle from "../../utils/useToggle";
import { Show } from "solid-js";
import FixMetadata from "../FixMetadata";
import promptConfirm from "../modals/ConfirmationModal";
import { Link } from "@tanstack/solid-router";

async function deleteMovie(id: number, title: string) {
  try {
    if (await promptConfirm(`Are you sure you want to delete ${title}?`)) {
      await server.DELETE("/api/local_movie/{id}", {
        params: { path: { id } },
      });
    }
  } catch (_) {
  } finally {
    revalidatePath("/api/local_movies");
  }
}

export default function MovieCard(props: { movie: Schemas["MovieMetadata"] }) {
  let [fixModal, toggleFixModal] = useToggle(false);
  let notificator = useNotifications();
  function handleFix() {
    toggleFixModal(true);
  }

  function handleMetadataReset() {
    if (props.movie.metadata_provider !== "local") return;
    server
      .POST("/api/movie/{movie_id}/reset_metadata", {
        params: { path: { movie_id: +props.movie.metadata_id } },
      })
      .then((res) => {
        if (res.error) {
          notificator("Failed to reset metadata");
        } else {
          notificator("Successfully reset metadata");
        }
      })
      .finally(() => {
        revalidatePath("/api/local_movies");
      });
  }

  let localUrl =
    props.movie.metadata_provider == "local"
      ? fullUrl("/api/movie/{id}/poster", {
          path: { id: +props.movie.metadata_id },
        })
      : undefined;

  return (
    <>
      <FixMetadata
        open={fixModal()}
        contentType="movie"
        targetId={props.movie.metadata_id}
        initialSearch={props.movie.title}
        onClose={() => toggleFixModal(false)}
      />
      <div class="max-w-60 min-w-60 flex-none space-y-2 overflow-hidden">
        <Link
          to={"/movies/$id"}
          params={{ id: props.movie.metadata_id }}
          search={{ provider: props.movie.metadata_provider }}
          class="relative w-full"
        >
          <FallbackImage
            alt="Movie poster"
            srcList={[localUrl, props.movie.poster ?? undefined]}
            class="aspect-poster rounded-xl object-cover"
            width={312}
            height={415}
          />
        </Link>
        <div class="flex items-center justify-between">
          <Link
            title={props.movie.title}
            class="text-md truncate"
            to={"/movies/$id"}
            params={{ id: props.movie.metadata_id }}
            search={{ provider: props.movie.metadata_provider }}
          >
            {props.movie.title}
          </Link>
          <Show when={props.movie.metadata_provider === "local"}>
            <MoreButton>
              <MenuRow onClick={handleFix}>Fix metadata</MenuRow>
              <MenuRow onClick={handleMetadataReset}>Reset metadata</MenuRow>
              <MenuRow
                onClick={() =>
                  deleteMovie(+props.movie.metadata_id, props.movie.title)
                }
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
