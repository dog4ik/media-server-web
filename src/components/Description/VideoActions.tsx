import { FiDownload, FiImage, FiLoader, FiPlay } from "solid-icons/fi";
import {
  defaultTrack,
  revalidatePath,
  Schemas,
  server,
} from "../../utils/serverApi";
import Icon from "../ui/Icon";
import { For, ParentProps, Show } from "solid-js";
import MoreButton, { RecursiveRow } from "../ContextMenu/MoreButton";
import VariantMenuRow from "./VariantMenuRow";
import PlayButton from "./PlayButton";
import { createAsync, useNavigate } from "@solidjs/router";
import { isCompatible } from "../../utils/mediaCapabilities/mediaCapabilities";
import { useNotifications } from "../../context/NotificationContext";
import { TranscodeModal } from "../modals/TranscodeModal";

type Props = {
  video: Schemas["DetailedVideo"];
  watchUrl?: string;
} & ParentProps;

export default function VideoActions(props: Props) {
  let notificator = useNotifications();
  let navigator = useNavigate();
  let transcodeModal: HTMLDialogElement;

  let videoCompatability = createAsync(async () => {
    let defaultVideo = defaultTrack(props.video.video_tracks);
    let defaultAudio = defaultTrack(props.video.audio_tracks);
    return await isCompatible(defaultVideo, defaultAudio);
  });

  let deletePreviews = async () => {
    return await server
      .DELETE("/api/video/{id}/previews", {
        params: { path: { id: +props.video!.id } },
      })
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
    return server
      .POST("/api/video/{id}/previews", {
        params: { path: { id: +props.video!.id } },
      })
      .finally(() => {
        revalidatePath("/api/video/by_content");
      });
  };

  async function startLiveTranscoding() {
    let res = await server.POST("/api/video/{id}/stream_transcode", {
      params: { path: { id: props.video.id } },
    });
    if (res.data) {
      navigator(props.watchUrl + `?stream_id=${res.data.id}`);
    }
  }

  return (
    <>
      <TranscodeModal ref={transcodeModal!} video={props.video} />
      <Show when={props.watchUrl}>
        {(url) => <PlayButton href={url()} canPlay={videoCompatability()} />}
      </Show>
      <Show when={props.video!.previews_count === 0}>
        <Icon tooltip="Generate previews" onClick={generatePreviews}>
          <FiImage size={30} />
        </Icon>
        <Show when={props.video!.previews_count > 0}>
          <Icon tooltip="Remove previews" onClick={deletePreviews}>
            <FiImage size={30} />
          </Icon>
        </Show>
      </Show>
      <Icon tooltip={"Transcode"} onClick={() => transcodeModal.showModal()}>
        <FiLoader size={30} />
      </Icon>
      <Icon tooltip={"Live transcode"} onClick={startLiveTranscoding}>
        <FiPlay size={30} />
      </Icon>
      {props.children}
      <Show when={props.video.variants.length > 0}>
        <MoreButton>
          <RecursiveRow title="Watch variant">
            <For each={props.video.variants}>
              {(variant) => {
                let href = `${props.watchUrl}?variant=${variant.id}`;
                return <VariantMenuRow variant={variant} href={href} />;
              }}
            </For>
          </RecursiveRow>
        </MoreButton>
      </Show>
    </>
  );
}
