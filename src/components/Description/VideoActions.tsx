import { FiImage, FiLoader, FiPlay } from "solid-icons/fi";
import { revalidatePath, server } from "../../utils/serverApi";
import Icon from "../ui/Icon";
import { createSignal, For, ParentProps, Show } from "solid-js";
import MoreButton, { RecursiveRow } from "../ContextMenu/MoreButton";
import VariantMenuRow from "./VariantMenuRow";
import PlayButton from "./PlayButton";
import { useNavigate } from "@solidjs/router";
import { useNotifications } from "../../context/NotificationContext";
import { TranscodeModal } from "../modals/TranscodeModal";
import { Video } from "@/utils/library";

type Props = {
  video: Video;
  watchUrl?: string;
} & ParentProps;

export default function VideoActions(props: Props) {
  let notificator = useNotifications();
  let navigator = useNavigate();
  let [transcodeOpen, setTranscodeOpen] = createSignal(false);

  let videoCompatibility = props.video.videoCompatibility();

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

  async function startLiveTranscoding() {
    let res = await server.POST("/api/video/{id}/stream_transcode", {
      params: { path: { id: props.video.details.id } },
    });
    if (res.data) {
      navigator(props.watchUrl + `?stream_id=${res.data.id}`);
    }
  }

  return (
    <>
      <TranscodeModal
        isOpen={transcodeOpen()}
        onClose={() => setTranscodeOpen(false)}
        video={props.video}
      />
      <Show when={props.watchUrl}>
        {(url) => <PlayButton href={url()} canPlay={videoCompatibility()} />}
      </Show>
      <Show when={props.video.details.previews_count === 0}>
        <Icon tooltip="Generate previews" onClick={generatePreviews}>
          <FiImage size={30} />
        </Icon>
        <Show when={props.video.details.previews_count > 0}>
          <Icon tooltip="Remove previews" onClick={deletePreviews}>
            <FiImage size={30} />
          </Icon>
        </Show>
      </Show>
      <Icon tooltip={"Transcode"} onClick={() => setTranscodeOpen(true)}>
        <FiLoader size={30} />
      </Icon>
      <Icon tooltip={"Live transcode"} onClick={startLiveTranscoding}>
        <FiPlay size={30} />
      </Icon>
      {props.children}
      <Show when={props.video.details.variants.length > 0}>
        <MoreButton>
          <RecursiveRow title="Watch variant">
            <For each={props.video.details.variants}>
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
