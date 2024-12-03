import MoreButton, { Row } from "../ContextMenu/MoreButton";
import { A } from "@solidjs/router";
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

function provider(provider: string): string {
  if (provider === "local") {
    return "";
  }
  return `?provider=${provider}`;
}

export default function MovieCard(props: { movie: Schemas["MovieMetadata"] }) {
  let url = `/movies/${props.movie.metadata_id}${provider(props.movie.metadata_provider)}`;
  function handleDelete() {}

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
      <div class="w-52 max-w-52 flex-none">
        <A href={url} class="relative w-full">
          <FallbackImage
            alt="Movie poster"
            srcList={[localUrl, props.movie.poster ?? undefined]}
            class="aspect-poster w-full rounded-xl"
            width={208}
            height={312}
          />
        </A>
        <div class="flex items-center justify-between">
          <A class="truncate text-lg" href={url}>
            {props.movie.title}
          </A>
          <MoreButton>
            <MenuRow onClick={handleFix}>Fix metadata</MenuRow>
            <MenuRow onClick={handleMetadataReset}>Reset metadata</MenuRow>
          </MoreButton>
        </div>
      </div>
    </>
  );
}
