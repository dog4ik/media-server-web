import { For, ParentProps, Show, createSignal } from "solid-js";
import { Schemas } from "../../utils/serverApi";
import Version from "./Version";
import { Compatibility } from "../../utils/mediaCapabilities/mediaCapabilities";
import {
  FiFeather,
  FiHeadphones,
  FiPlay,
  FiVideo,
  FiZap,
  FiZapOff,
} from "solid-icons/fi";
import { A } from "@solidjs/router";
import { canPlayAfterTranscode } from "../../utils/mediaCapabilities/mediaCapabilities";

type Props = {
  variants: Schemas["DetailedVariant"][];
  video: Schemas["DetailedVideo"];
  videoId: number;
  onCommit: (payload: Schemas["TranscodePayload"]) => void;
};

type CompatibilityIndicatorProps = {
  capabilities: MediaCapabilitiesDecodingInfo;
};

function CompatibilityIndicator(
  props: CompatibilityIndicatorProps & ParentProps,
) {
  return (
    <div
      class={`tooltip relative flex h-16 w-16 items-center justify-center
${props.capabilities.supported ? "bg-green-500" : "bg-red-500"}`}
      data-tip={
        props.capabilities.supported
          ? `Supported,
${props.capabilities.smooth ? "" : "not"} smooth,
${props.capabilities.powerEfficient ? "" : "not"} power efficient `
          : "Not supported"
      }
    >
      <Show when={props.capabilities.smooth}>
        <div class="absolute left-2 top-2">
          <FiFeather size={17} />
        </div>
      </Show>
      <Show when={props.capabilities.powerEfficient}>
        <div class="absolute right-2 top-2">
          <FiZap size={17} />
        </div>
      </Show>
      <Show when={!props.capabilities.powerEfficient}>
        <div class="absolute right-2 top-2">
          <FiZapOff size={17} />
        </div>
      </Show>
      {props.children}
    </div>
  );
}

function getDefaultTrack<T extends { is_default: boolean }>(items: T[]): T {
  return items.find((i) => i.is_default) ?? items[0];
}

export default function VersionSlider(props: Props) {
  let [selectedVariantIdx, setSelectedVariantIdx] = createSignal<number>();
  let [canPlay, setCanPlay] = createSignal<Compatibility>();
  let originalVideo = () => props.video;
  let defaultAudio = () => getDefaultTrack(originalVideo().audio_tracks);
  let defaultVideo = () => getDefaultTrack(originalVideo().video_tracks);
  let [selectedVideoCodec, setSelectedVideoCodec] = createSignal<
    Schemas["VideoCodec"]
  >(defaultVideo().codec);
  let [selectedAudioCodec, setSelectedAudioCodec] = createSignal<
    Schemas["AudioCodec"]
  >(defaultAudio().codec);
  let [selectedResolution, setSelectedResolution] = createSignal<
    Schemas["Resolution"]
  >(defaultVideo().resolution);

  async function checkCompatability() {
    return await canPlayAfterTranscode(
      selectedResolution(),
      defaultVideo().framerate,
      selectedVideoCodec(),
      selectedAudioCodec(),
    );
  }

  let watchUrl = () =>
    `/api/video/${props.videoId}/watch${
      selectedVariantIdx() === undefined
        ? ""
        : "?variant=" + props.variants[selectedVariantIdx()!].id
    }`;

  checkCompatability().then((res) => setCanPlay(res));

  return <div class="flex h-fit w-full flex-col gap-4 overflow-x-hidden"></div>;
}
