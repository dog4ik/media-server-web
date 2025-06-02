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
import promptConfirm from "../modals/ConfirmationModal";

function provider(provider: string): string {
  if (provider === "local") {
    return "";
  }
  return `?provider=${provider}`;
}

async function deleteShow(id: number, name: string) {
  try {
    if (await promptConfirm(`Are you sure you want to delete ${name}?`)) {
      await server.DELETE("/api/local_show/{id}", { params: { path: { id } } });
    }
  } catch (_) {
  } finally {
    revalidatePath("/api/local_shows");
  }
}

export default function ShowCard(props: { show: Schemas["ShowMetadata"] }) {
  let url = `/shows/${props.show.metadata_id}${provider(props.show.metadata_provider)}`;
  let [fixModal, toggleFixModal] = useToggle(false);
  let notificator = useNotifications();
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
      <div class="min-w-60 max-w-60 flex-none space-y-2 overflow-hidden">
        <A href={url} class="relative size-full">
          <FallbackImage
            alt="Show poster"
            srcList={[imageUrl, props.show.poster ?? undefined]}
            class="aspect-poster rounded-xl object-cover"
            width={312}
            height={468}
          />
          <Show when={props.show.episodes_amount}>
            <div
              title={`${props.show.episodes_amount} ${props.show.episodes_amount == 1 ? "episode" : "episodes"}`}
              class="absolute top-0 flex h-8 w-8 items-center justify-center rounded-xl bg-white"
            >
              <span class="text-sm font-semibold text-black">
                {props.show.episodes_amount}
              </span>
            </div>
          </Show>
        </A>
        <div class="flex items-center justify-between">
          <A href={url} class="text-md truncate">
            <span class="truncate" title={props.show.title}>
              {props.show.title}
            </span>
            <Show when={props.show.seasons}>
              <div class="text-sm font-bold text-white">
                {props.show.seasons!.length}{" "}
                {props.show.seasons!.length == 1 ? "season" : "seasons"}
              </div>
            </Show>
          </A>
          <Show when={props.show.metadata_provider === "local"}>
            <MoreButton>
              <MenuRow onClick={handleFix}>Fix metadata</MenuRow>
              <MenuRow onClick={handleMetadataReset}>Reset Metadata</MenuRow>
              <MenuRow
                onClick={() =>
                  deleteShow(+props.show.metadata_id, props.show.title)
                }
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
