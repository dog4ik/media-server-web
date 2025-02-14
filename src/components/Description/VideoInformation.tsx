import { createMemo } from "solid-js";
import { formatCodec } from "../../utils/serverApi";
import ContentSectionContainer, {
  Info,
} from "../generic/ContentSectionContainer";
import { VariantVideo, Video } from "@/utils/library";

type Props = {
  title: string;
  video: Video | VariantVideo;
  onSelect: () => void;
  isSelected: boolean;
};

export default function VideoInformation(props: Props) {
  let defaultVideo = createMemo(() => props.video.defaultVideo());
  let defaultAudio = createMemo(() => props.video.defaultAudio());
  let compatibility = props.video.videoCompatibility();
  return (
    <ContentSectionContainer
      isActive={props.isSelected}
      onClick={props.onSelect}
      compatibility={compatibility()}
      title={props.title}
    >
      <div class="flex flex-wrap gap-20">
        <Info
          key="Resolution"
          value={`${defaultVideo().resolution.width}x${defaultVideo().resolution.height}`}
        />
        <Info
          key="Framerate"
          value={`@${Math.round(defaultVideo()!.framerate)}`}
        />
        <Info
          key="Video codec"
          value={`${formatCodec(defaultVideo().codec)}`}
        />
        <Info
          key="Audio codec"
          value={`${formatCodec(defaultAudio().codec)}`}
        />
      </div>
    </ContentSectionContainer>
  );
}
