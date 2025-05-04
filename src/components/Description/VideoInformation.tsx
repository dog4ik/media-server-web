import { createMemo, createSignal, Show } from "solid-js";
import { formatCodec } from "../../utils/serverApi";
import ContentSectionContainer, {
  Info,
} from "../generic/ContentSectionContainer";
import { VariantVideo, Video } from "@/utils/library";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { formatResolution } from "@/utils/formats";
import { SelectedSubtitleTrack } from "@/pages/Watch/TracksSelectionContext";
import { createAsync } from "@solidjs/router";
import { isCompatible } from "@/utils/mediaCapabilities/mediaCapabilities";
import tracing from "@/utils/tracing";
import UploadSubtitles from "./UploadSubtitles";

class SubtitlesKeys {
  constructor(private subs: () => SelectedSubtitleTrack[]) {}

  toString(s: SelectedSubtitleTrack) {
    let idx = this.subs().indexOf(s);
    if (s.origin === "container") {
      return `c${idx}`;
    }
    if (s.origin === "external") {
      return `e${s.id}`;
    }
    if (s.origin === "imported") {
      throw Error("imported subtitles are not supported in video information");
    }
    throw Error();
  }

  fromStr(s: string) {
    let tag = s.slice(0, 1);
    let identifier = parseInt(s.slice(1));
    if (isNaN(identifier)) {
      tracing.error(
        { identifier: s.slice(1), tag },
        "Failed to parse subtitles identifier number",
      );
    }
    if (tag == "c") {
      return this.subs()[identifier];
    }
    if (tag == "e") {
      let val = this.subs().find(
        (s) => s.origin == "external" && s.id == identifier,
      );
      if (!val) {
        throw Error(`could not find external subtitles with id: ${identifier}`);
      }
      return val;
    }
    throw Error(`unknown subtitles tag`);
  }
}

type Props = {
  title: string;
  video: Video | VariantVideo;
  onSelect: () => void;
  isSelected: boolean;
};

export default function VideoInformation(props: Props) {
  let subtitleTracks = createMemo(() => {
    let out: SelectedSubtitleTrack[] = [];
    if ("subtitle_tracks" in props.video.details) {
      for (let track of props.video.details.subtitle_tracks) {
        out.push({ origin: "container", track });
      }
    }
    return out;
  });

  let [selectedSubtitles, setSelectedSubtitles] = createSignal<
    SelectedSubtitleTrack | undefined
  >(
    props.video.defaultSubtitles()
      ? subtitleTracks().find(
          (s) =>
            s.origin == "container" &&
            s.track == props.video.defaultSubtitles(),
        )
      : subtitleTracks().at(0),
  );

  let subsKeys = new SubtitlesKeys(subtitleTracks);

  let [selectedVideoTrack, setSelectedVideoTrack] = createSignal(
    props.video.defaultVideo(),
  );

  let [selectedAudioTrack, setSelectedAudioTrack] = createSignal(
    props.video.defaultAudio(),
  );

  let compatibility = createAsync(() =>
    isCompatible(selectedVideoTrack(), selectedAudioTrack()),
  );

  let videoTracks = () => props.video.details.video_tracks;
  let audioTracks = () => props.video.details.audio_tracks;

  let formatVideoTrack = (track_index: number, idx: number) => {
    let t = videoTracks()[track_index];
    return `${idx + 1}. ${formatCodec(t.codec)}`;
  };

  let formatSubtitlesTrack = (t: SelectedSubtitleTrack) => {
    if (t.origin == "external") {
      return `External - ${t.id}`;
    }
    if (t.origin == "imported") {
      throw Error("imported subs are not allowed in video information");
    }
    if (t.origin == "container") {
      return `Container ${t.track.language ?? "unknown"}`;
    }
  };

  let formatAudioTrack = (track_idx: number, idx: number) => {
    let t = audioTracks()[track_idx];
    return `${idx + 1}. ${formatCodec(t.codec)}${t.language ? ` (${t.language})` : ""}`;
  };

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
                  options={tracks().map((t) => subsKeys.toString(t))}
                  onChange={(v) => {
                    if (v === null) return;
                    setSelectedSubtitles(subsKeys.fromStr(v));
                  }}
                  value={
                    selectedSubtitles()
                      ? subsKeys.toString(selectedSubtitles()!)
                      : undefined
                  }
                  placeholder="Select subtitles"
                  itemComponent={(props) => (
                    <SelectItem item={props.item}>
                      {props.item.rawValue
                        ? formatSubtitlesTrack(
                            subsKeys.fromStr(props.item.rawValue),
                          )
                        : "none"}
                    </SelectItem>
                  )}
                >
                  <span>Subtitles:</span>
                  <SelectTrigger class="w-[180px]">
                    <SelectValue<string | undefined>>
                      {(state) =>
                        state.selectedOption()
                          ? formatSubtitlesTrack(
                              subsKeys.fromStr(state.selectedOption()!),
                            )
                          : "none"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent class="max-h-80 overflow-auto" />
                </Select>
                <Show
                  when={(() => {
                    let selection = selectedSubtitles();
                    if (selection?.origin == "container") {
                      return selection.track;
                    }
                  })()}
                >
                  {(track) => (
                    <>
                      <Info key="Codec" value={track().codec ?? "unknown"} />
                      <Info
                        key="Hearing impaired"
                        value={track().is_hearing_impaired ? "yes" : "no"}
                      />
                      <Info
                        key="Visual annotations"
                        value={track().is_visual_impaired ? "yes" : "no"}
                      />
                      <Info
                        key="Text format"
                        value={track().is_text_format ? "yes" : "no"}
                      />
                      <Show when={track().language}>
                        {(lang) => <Info key="Language" value={lang()} />}
                      </Show>
                    </>
                  )}
                </Show>
              </div>
            </Show>
          )}
        </Show>
        <Show when={props.video.details.video_tracks}>
          {(tracks) => (
            <Show when={tracks().length}>
              <div class="grid grid-cols-3 gap-3">
                <Select<number>
                  class="col-span-3"
                  options={tracks().map((_, i) => i)}
                  placeholder="Select video track"
                  value={videoTracks().indexOf(selectedVideoTrack()!)}
                  onChange={(v) => {
                    if (v === null) return;
                    setSelectedVideoTrack(videoTracks()[v]);
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
                <Show when={selectedVideoTrack()}>
                  {(track) => (
                    <>
                      <Info key="Codec" value={formatCodec(track().codec)} />
                      <Info
                        key="Resolution"
                        value={formatResolution(track()!.resolution)}
                      />
                      <Info key="Framerate" value={track()!.framerate} />
                    </>
                  )}
                </Show>
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
                  value={audioTracks().indexOf(selectedAudioTrack()!)}
                  onChange={(a) => {
                    if (a === null) return;
                    setSelectedAudioTrack(audioTracks()[a]);
                  }}
                  placeholder="Select audio track"
                  itemComponent={(props) => (
                    <SelectItem item={props.item}>
                      {formatAudioTrack(props.item.rawValue, props.item.index)}
                    </SelectItem>
                  )}
                >
                  <SelectTrigger class="w-[180px]">
                    <SelectValue<number>>
                      {(state) =>
                        formatAudioTrack(
                          state.selectedOption(),
                          state.selectedOption(),
                        )
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent class="max-h-80 overflow-auto" />
                </Select>
                <Show when={selectedAudioTrack()}>
                  {(track) => (
                    <Info key="Codec" value={formatCodec(track().codec)} />
                  )}
                </Show>
                <Show when={selectedAudioTrack()?.language}>
                  {(lang) => <Info key="Language" value={lang()} />}
                </Show>
              </div>
            </Show>
          )}
        </Show>
      </div>
      <Show when={() => typeof props.video.details.id === "number"}>
        <UploadSubtitles videoId={props.video.details.id as number} />
      </Show>
    </ContentSectionContainer>
  );
}
