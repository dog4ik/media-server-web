import type { LinkOptions } from "@tanstack/solid-router";
import ImageIcon from "lucide-solid/icons/image";
import { type ParentProps, Show } from "solid-js";
import type { Video } from "@/utils/library";
import { queryApi } from "@/utils/queryApi";
import { useNotifications } from "../../context/NotificationContext";
import Icon from "../ui/Icon";
import PlayButton from "./PlayButton";

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
        queryApi.invalidateQueries("get", "/api/video/by_content");
      });
  };

  let generatePreviews = async () => {
    props.video.generatePreviews().finally(() => {
      queryApi.invalidateQueries("get", "/api/video/by_content");
    });
  };

  return (
    <>
      <Show when={props.watchUrl}>
        {(url) => (
          <PlayButton
            link={url()}
            canPlay={
              videoCompatibility.isSuccess ? videoCompatibility.data : undefined
            }
          />
        )}
      </Show>
      <Show when={props.video.details.previews_count === 0}>
        <Icon tooltip="Generate previews" onClick={generatePreviews}>
          <ImageIcon size="1em" />
        </Icon>
        <Show when={props.video.details.previews_count > 0}>
          <Icon tooltip="Remove previews" onClick={deletePreviews}>
            <ImageIcon size="1em" />
          </Icon>
        </Show>
      </Show>
      {props.children}
    </>
  );
}
