import MoreButton, { Row } from "../ContextMenu/MoreButton";
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
          notificator("Successfuly reseted metadata");
        }
      })
      .finally(() => {
        revalidatePath("/api/local_shows");
      });
  }

  let rows: Row[] = [];
  if (props.show.metadata_provider === "local") {
    rows.push(
      { title: "Fix metadata", onClick: handleFix },
      { title: "Reset metadata", onClick: handleMetadataReset },
    );
  }

  let imageUrl =
    props.show.metadata_provider == "local"
      ? fullUrl("/api/show/{id}/poster", {
          path: { id: +props.show.metadata_id },
        })
      : undefined;

  return (
    <>
      <Show when={fixModal()}>
        <FixMetadata
          contentType="show"
          targetId={props.show.metadata_id}
          initialSearch={props.show.title}
          onClose={() => toggleFixModal(false)}
        />
      </Show>
      <div class="w-52">
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
          <MoreButton rows={rows} />
        </div>
      </div>
    </>
  );
}
