import { createMemo, Show } from "solid-js";
import { formatCodec } from "../../utils/serverApi";
import ContentSectionContainer, {
  Info,
} from "../generic/ContentSectionContainer";
import { VariantVideo, Video } from "@/utils/library";
import { TrackSelection } from "@/pages/Episode";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";

type Props = {
  title: string;
  video: Video | VariantVideo;
  onSelect: () => void;
  isSelected: boolean;
  setVideoSelection: (newSelection: TrackSelection) => void;
  selection: TrackSelection;
};

export default function VideoInformation(props: Props) {
  let defaultVideo = createMemo(() => props.video.defaultVideo());
  let defaultAudio = createMemo(() => props.video.defaultAudio());
  let compatibility = props.video.videoCompatibility();
  let subtitleTracks = () =>
    "subtitle_tracks" in props.video.details
      ? props.video.details.subtitle_tracks
      : undefined;
  return (
    <ContentSectionContainer
      isActive={props.isSelected}
      onClick={props.onSelect}
      compatibility={compatibility()}
      title={props.title}
    >
      <div class="flex flex-wrap gap-20">
        <Show when={subtitleTracks()}>
          {(tracks) => (
            <Show when={tracks().length}>
              <Select
                options={tracks().map((t) => t.language ?? "Unknown")}
                placeholder="Select subtitles"
                itemComponent={(props) => (
                  <SelectItem item={props.item}>
                    {props.item.rawValue}
                  </SelectItem>
                )}
              >
                <SelectTrigger class="w-[180px]">
                  <SelectValue<string>>
                    {(state) => state.selectedOption()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent class="max-h-80 overflow-auto" />
              </Select>
            </Show>
          )}
        </Show>
        <Show when={props.video.details.audio_tracks}>
          {(tracks) => (
            <Show when={tracks().length}>
              <Select
                options={tracks().map(
                  (t, idx) =>
                    `${idx + 1}. ${formatCodec(t.codec)}${t.language ? ` (${t.language})` : ""}`,
                )}
                placeholder="Select audio track"
                itemComponent={(props) => (
                  <SelectItem item={props.item}>
                    {props.item.rawValue}
                  </SelectItem>
                )}
              >
                <SelectTrigger class="w-[180px]">
                  <SelectValue<string>>
                    {(state) => state.selectedOption()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent class="max-h-80 overflow-auto" />
              </Select>
            </Show>
          )}
        </Show>
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
