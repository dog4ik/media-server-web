import { FiImage } from "solid-icons/fi";
import { revalidatePath } from "../../utils/serverApi";
import Icon from "../ui/Icon";
import { ParentProps, Show } from "solid-js";
import PlayButton from "./PlayButton";
import { useNotifications } from "../../context/NotificationContext";
import { Video } from "@/utils/library";
import { LinkOptions } from "@tanstack/solid-router";

type Props = {
  video: Video;
  watchUrl?: LinkOptions;
} & ParentProps;

export default function VideoActions(props: Props) {
  let notificator = useNotifications();

  let videoCompatibility = props.video.useVideoCompatibility();

  let deletePreviews = () => {
    props.video
      .deletePreviews()
      .then(() => {
        notificator("Cleared previews");
      })
      .catch(() => {
        notificator("Failed to clear previews");
      })
      .finally(() => {
        revalidatePath("/api/video/by_content");
      });
  };

  let generatePreviews = async () => {
    props.video.generatePreviews().finally(() => {
      revalidatePath("/api/video/by_content");
    });
  };

  return (
    <>
      <Show when={props.watchUrl}>
        {(url) => (
          <PlayButton
            link={url()}
            canPlay={videoCompatibility.isSuccess ? videoCompatibility.data : undefined}
          />
        )}
      </Show>
      <Show when={props.video.details.previews_count === 0}>
        <Icon tooltip="Generate previews" onClick={generatePreviews}>
          <FiImage />
        </Icon>
        <Show when={props.video.details.previews_count > 0}>
          <Icon tooltip="Remove previews" onClick={deletePreviews}>
            <FiImage />
          </Icon>
        </Show>
      </Show>
      {props.children}
    </>
  );
}
