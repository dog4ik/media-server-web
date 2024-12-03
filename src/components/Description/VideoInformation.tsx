import { createMemo } from "solid-js";
import { formatCodec } from "../../utils/serverApi";
import ContentSectionContainer, {
  Info,
} from "../generic/ContentSectionContainer";
import { Video } from "@/utils/library";

type Props = {
  video: Video;
};

export default function VideoInformation(props: Props) {
  let defaultVideo = createMemo(() => props.video.defaultVideo());
  let defaultAudio = createMemo(() => props.video.defaultAudio());
  return (
    <ContentSectionContainer title="Video configuration">
      <div class="flex flex-wrap gap-20">
        <Info
          key="Resolution"
          value={`${defaultVideo().resolution.width}x${defaultVideo().resolution.height}`}
        ></Info>
        <Info
          key="Framerate"
          value={`@${Math.round(defaultVideo()!.framerate)}`}
        ></Info>
        <Info
          key="Video codec"
          value={`${formatCodec(defaultVideo().codec)}`}
        ></Info>
        <Info
          key="Audio codec"
          value={`${formatCodec(defaultAudio().codec)}`}
        ></Info>
      </div>
    </ContentSectionContainer>
  );
}
