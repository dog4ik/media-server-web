import MoreButton from "../ContextMenu/MoreButton";
import { Show } from "solid-js";
import {
  Schemas,
  fullUrl,
  revalidatePath,
  server,
} from "../../utils/serverApi";
import { A } from "@solidjs/router";
import FallbackImage from "../FallbackImage";
import useToggle from "../../utils/useToggle";
import FixMetadata from "../FixMetadata";
import { useNotifications } from "../../context/NotificationContext";
import { MenuRow } from "../ContextMenu/Menu";

function provider(provider: string): string {
  if (provider === "local") {
    return "";
  }
  return `?provider=${provider}`;
}

export default function ShowCard(props: { show: Schemas["ShowMetadata"] }) {
  let url = `/shows/${props.show.metadata_id}${provider(props.show.metadata_provider)}`;
  let [fixModal, toggleFixModal] = useToggle(false);
  let notificator = useNotifications();
  function handleDelete() {}
  function handleFix() {
    toggleFixModal(true);
  }

  function handleMetadataReset() {
    if (props.show.metadata_provider !== "local") return;
    server
      .POST("/api/show/{show_id}/reset_metadata", {
        params: { path: { show_id: +props.show.metadata_id } },
      })
      .then((res) => {
        if (res.error) {
          notificator("Failed to reset metadata");
        } else {
          notificator("Successfully reset metadata");
        }
      })
      .finally(() => {
        revalidatePath("/api/local_shows");
      });
  }

  let imageUrl =
    props.show.metadata_provider == "local"
      ? fullUrl("/api/show/{id}/poster", {
          path: { id: +props.show.metadata_id },
        })
      : undefined;

  return (
    <>
      <FixMetadata
        open={fixModal()}
        contentType="show"
        targetId={props.show.metadata_id}
        initialSearch={props.show.title}
        onClose={() => toggleFixModal(false)}
      />
      <div class="w-52 flex-none">
        <A href={url} class="relative w-full">
          <FallbackImage
            alt="Show poster"
            srcList={[imageUrl, props.show.poster ?? undefined]}
            class="rounded-xl"
            width={208}
            height={312}
          />
          <Show when={props.show.episodes_amount}>
            <div class="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-xl rounded-r-none rounded-t-none bg-white">
              <span class="text-sm font-semibold text-black">
                {props.show.episodes_amount}
              </span>
            </div>
          </Show>
        </A>
        <div class="flex items-center justify-between">
          <A href={url}>
            <div class="truncate text-lg">
              <span>{props.show.title}</span>
            </div>
            <Show when={props.show.seasons}>
              <div class="text-sm text-white">
                {props.show.seasons!.length}{" "}
                {props.show.seasons!.length == 1 ? "season" : "seasons"}
              </div>
            </Show>
          </A>
          <Show when={props.show.metadata_provider === "local"}>
            <MoreButton>
              <MenuRow onClick={handleFix}>Fix metadata</MenuRow>
              <MenuRow onClick={handleMetadataReset}>Reset Metadata</MenuRow>
            </MoreButton>
          </Show>
        </div>
      </div>
    </>
  );
}
