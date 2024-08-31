import { createMemo } from "solid-js";
import { defaultTrack, formatCodec, Schemas } from "../../utils/serverApi";
import ContentSectionContainer, {
  Info,
} from "../generic/ContentSectionContainer";

type Props = {
  video: Schemas["DetailedVideo"];
};

export default function VideoInformation(props: Props) {
  let defaultVideo = createMemo(() => defaultTrack(props.video.video_tracks));
  let defaultAudio = createMemo(() => defaultTrack(props.video.audio_tracks));
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
