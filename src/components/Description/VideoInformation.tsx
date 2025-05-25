import { createMemo, createSignal, Show } from "solid-js";
import { formatCodec } from "../../utils/serverApi";
import { Video } from "@/utils/library";
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
import { isCompatible } from "@/utils/mediaCapabilities";
import tracing from "@/utils/tracing";

export type VideoSelection = {
  video_id: number;
  variant_id?: string;
};

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
  videos: Video[];
  selectedVideo: VideoSelection;
};

export default function VideoInformation(props: Props) {
  let currentVideo = () => {
    let video = props.videos.find(
      (v) => v.details.id == props.selectedVideo.video_id,
    )!;
    let variant_id = props.selectedVideo.variant_id;
    if (variant_id !== undefined) {
      return video.variants().find((v) => v.details.id == variant_id)!;
    }
    return video;
  };

  let subtitleTracks = createMemo(() => {
    let out: SelectedSubtitleTrack[] = [];
    for (let video of props.videos) {
      let videoId = video.details.id;
      if ("subtitle_tracks" in video.details) {
        for (let track of video.details.subtitle_tracks) {
          out.push({ origin: "container", track });
        }
      }
    }
    return out;
  });

  let [selectedSubtitles, setSelectedSubtitles] = createSignal<
    SelectedSubtitleTrack | undefined
  >(
    currentVideo().defaultSubtitles()
      ? subtitleTracks().find(
          (s) =>
            s.origin == "container" &&
            s.track == currentVideo().defaultSubtitles(),
        )
      : subtitleTracks().at(0),
  );

  let subsKeys = new SubtitlesKeys(subtitleTracks);

  let [selectedVideoTrack, setSelectedVideoTrack] = createSignal(
    currentVideo().defaultVideo(),
  );

  let [selectedAudioTrack, setSelectedAudioTrack] = createSignal(
    currentVideo().defaultAudio(),
  );

  let compatibility = createAsync(() =>
    isCompatible(selectedVideoTrack(), selectedAudioTrack()),
  );

  let videoTracks = () => currentVideo().details.video_tracks;
  let audioTracks = () => currentVideo().details.audio_tracks;

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
    <>
      <div class="grid grid-cols-3 grid-rows-1">
        <Show when={subtitleTracks()}>
          {(tracks) => (
            <Show when={tracks().length}>
              <div class="grid grid-cols-3 gap-3">
                <span>Subtitles:</span>
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
              </div>
            </Show>
          )}
        </Show>
        <Show when={currentVideo().details.video_tracks}>
          {(tracks) => (
            <Show when={tracks().length}>
              <div class="grid grid-cols-3 gap-3">
                <span>Video:</span>
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
              </div>
            </Show>
          )}
        </Show>
        <Show when={currentVideo().details.audio_tracks}>
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
              </div>
            </Show>
          )}
        </Show>
      </div>
    </>
  );
}
