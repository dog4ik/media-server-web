import { Show } from "solid-js";
import { formatCodec, Schemas } from "../../utils/serverApi";
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
import { formatResolution } from "@/utils/formats";

type Props = {
  title: string;
  video: Video | VariantVideo;
  externalSubtitles: Schemas["DetailedSubtitleTrack"][];
  onSelect: () => void;
  isSelected: boolean;
  setVideoSelection: <T extends keyof TrackSelection>(
    type: T,
    value: TrackSelection[T],
  ) => void;
  selection: TrackSelection;
};

export default function VideoInformation(props: Props) {
  let compatibility = props.video.videoCompatibility();
  let subtitleTracks = () =>
    "subtitle_tracks" in props.video.details
      ? props.video.details.subtitle_tracks
      : undefined;

  let formatVideoTrack = (tidx: number, idx: number) => {
    let t = props.video.details.video_tracks[tidx];
    return `${idx + 1}. ${formatCodec(t.codec)}`;
  };
  let formatSubtitlesTrack = (t: string) => {
    let split = t.split("-");
    let origin = split[0];
    let num = +split[1];
    return origin == "container" && "subtitle_tracks" in props.video.details
      ? props.video.details.subtitle_tracks[num].language
      : "Unknown";
  };
  let formatAudioTrack = (tidx: number, idx: number) => {
    let t = props.video.details.audio_tracks[tidx];
    return `${idx + 1}. ${formatCodec(t.codec)}${t.language ? ` (${t.language})` : ""}`;
  };

  let selectedSubtitles = () =>
    props.selection.subtitlesTrack?.origin == "container" &&
    "subtitle_tracks" in props.video.details
      ? props.video.details.subtitle_tracks[
          props.selection.subtitlesTrack.index
        ]
      : ({} as Schemas["DetailedSubtitleTrack"]);
  let selectedVideoTrack = () =>
    props.video.details.video_tracks[props.selection.videoTrack ?? 0];
  let selectedAudioTrack = () =>
    props.video.details.audio_tracks[props.selection.audioTrack ?? 0];

  return (
    <ContentSectionContainer
      isActive={props.isSelected}
      onClick={props.onSelect}
      compatibility={compatibility()}
      title={props.title}
    >
      <div class="grid grid-cols-3 grid-rows-1">
        <Show when={subtitleTracks()}>
          {(tracks) => (
            <Show when={tracks().length}>
              <div class="grid grid-cols-3 gap-3">
                <Select
                  class="col-span-3"
                  options={tracks().map((_, i) => `container-${i}`)}
                  onChange={(v) => {
                    props.setVideoSelection("subtitlesTrack", {
                      origin: "container",
                      index: +v!.split("-")[1],
                    });
                  }}
                  value={
                    props.selection.subtitlesTrack?.origin == "container"
                      ? `container-${props.selection.subtitlesTrack.index}`
                      : ``
                  }
                  placeholder="Select subtitles"
                  itemComponent={(props) => (
                    <SelectItem item={props.item}>
                      {formatSubtitlesTrack(props.item.rawValue)}
                    </SelectItem>
                  )}
                >
                  <span>Subtitles:</span>
                  <SelectTrigger class="w-[180px]">
                    <SelectValue<string>>
                      {(state) => formatSubtitlesTrack(state.selectedOption())}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent class="max-h-80 overflow-auto" />
                </Select>
                <Info key="Codec" value={`${selectedSubtitles().codec}`} />
                <Info
                  key="Visual annotations"
                  value={selectedSubtitles().is_hearing_impaired ? "yes" : "no"}
                />
                <Show when={selectedSubtitles().language}>
                  {(lang) => <Info key="Language" value={lang()} />}
                </Show>
              </div>
            </Show>
          )}
        </Show>
        <Show when={props.video.details.video_tracks}>
          {(tracks) => (
            <Show when={tracks().length}>
              <div class="grid grid-cols-3 gap-3">
                <span>Video:</span>
                <Select
                  class="col-span-3"
                  options={tracks().map((_, i) => i)}
                  placeholder="Select video track"
                  value={props.selection.videoTrack}
                  onChange={(v) => {
                    props.setVideoSelection("videoTrack", v ?? undefined);
                  }}
                  itemComponent={(props) => (
                    <SelectItem item={props.item}>
                      {formatVideoTrack(props.item.rawValue, props.item.index)}
                    </SelectItem>
                  )}
                >
                  <SelectTrigger class="w-[180px]">
                    <SelectValue<number>>
                      {(state) => formatVideoTrack(state.selectedOption(), 0)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent class="max-h-80 overflow-auto" />
                </Select>
                <Info
                  key="Codec"
                  value={formatCodec(selectedVideoTrack().codec)}
                />
                <Info
                  key="Resolution"
                  value={formatResolution(selectedVideoTrack().resolution)}
                />
                <Info key="Framerate" value={selectedVideoTrack().framerate} />
              </div>
            </Show>
          )}
        </Show>
        <Show when={props.video.details.audio_tracks}>
          {(tracks) => (
            <Show when={tracks().length}>
              <div class="grid grid-cols-3 gap-3">
                <span>Audio:</span>
                <Select
                  class="col-span-3"
                  options={tracks().map((_, i) => i)}
                  defaultValue={props.selection.audioTrack!}
                  placeholder="Select audio track"
                  itemComponent={(props) => (
                    <SelectItem item={props.item}>
                      {formatAudioTrack(props.item.rawValue, props.item.index)}
                    </SelectItem>
                  )}
                >
                  <SelectTrigger class="w-[180px]">
                    <SelectValue<number>>
                      {(state) => formatAudioTrack(state.selectedOption(), 0)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent class="max-h-80 overflow-auto" />
                </Select>
                <Info
                  key="Codec"
                  value={formatCodec(selectedAudioTrack().codec)}
                />
                <Show when={selectedAudioTrack().language}>
                  {(lang) => <Info key="Language" value={lang()} />}
                </Show>
              </div>
            </Show>
          )}
        </Show>
      </div>
    </ContentSectionContainer>
  );
}
