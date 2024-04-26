import { For, ParentProps, Show, createSignal } from "solid-js";
import { Variant, VideoConfiguration } from "../../utils/serverApi";
import Arrows from "./Arrows";
import Version from "./Version";
import SlideItem from "./SlideItem";
import AddVersion from "./AddVersion";
import {
  Compatibility,
  isCompatible,
} from "../../utils/mediaCapabilities/mediaCapabilities";
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
  variants: Omit<Variant, "video_id">[];
  videoId: string;
  onCommit: (payload: VideoConfiguration) => void;
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
  let [selectedVariantIdx, setSelectedVariantIdx] = createSignal(0);
  let [canPlay, setCanPlay] = createSignal<Compatibility>();
  let originalVideo = () => props.variants[0];
  let selectedVideo = () => props.variants[selectedVariantIdx()];
  let defaultAudio = () => getDefaultTrack(originalVideo().audio_tracks);
  let defaultVideo = () => getDefaultTrack(originalVideo().video_tracks);
  let [transcodePayload, setTranscodePayload] =
    createSignal<VideoConfiguration>({
      resolution: defaultVideo().resolution,
      video_codec: defaultVideo().codec,
      audio_codec: defaultAudio().codec,
    });
  async function handleClick(direction: "left" | "right") {
    if (direction == "left") {
      let nextIndex = Math.max(0, selectedVariantIdx() - 1);
      setSelectedVariantIdx(nextIndex);
    }
    if (direction == "right") {
      let nextIndex = Math.min(props.variants.length, selectedVariantIdx() + 1);
      setSelectedVariantIdx(nextIndex);
    }
    if (selectedVariantIdx() == props.variants.length) {
      let originVideoCodec = getDefaultTrack(originalVideo().video_tracks);
      setCanPlay(
        await canPlayAfterTranscode(
          transcodePayload(),
          originVideoCodec.framerate,
        ),
      );
    } else {
      let video = getDefaultTrack(selectedVideo().video_tracks);
      let audio = getDefaultTrack(selectedVideo().audio_tracks);

      setCanPlay(await isCompatible(video, audio));
    }
  }

  let versionName = () => {
    if (selectedVariantIdx() == 0) return "Original";
    if (selectedVariantIdx() == props.variants.length) return "New";
    return "Variant";
  };

  let watchUrl = () =>
    `/watch/${props.videoId}${
      selectedVariantIdx() == 0 ? "" : "?variant=" + selectedVideo().id
    }`;

  isCompatible(
    getDefaultTrack(selectedVideo().video_tracks),
    getDefaultTrack(selectedVideo().audio_tracks),
  ).then((res) => setCanPlay(res));

  return (
    <div class="flex h-fit w-full flex-col gap-4 overflow-x-hidden">
      <Arrows
        title={versionName()}
        disabledLeft={selectedVariantIdx() == 0}
        disabledRight={selectedVariantIdx() == props.variants.length}
        onLeft={() => handleClick("left")}
        onRight={() => handleClick("right")}
      />
      <div
        style={{ transform: `translate(${selectedVariantIdx() * -100}%)` }}
        class="flex transition-transform duration-500"
      >
        <For each={props.variants}>
          {(variant) => (
            <SlideItem>
              <Version variant={variant} />
            </SlideItem>
          )}
        </For>
        <SlideItem>
          <AddVersion
            defaults={transcodePayload()}
            onChange={async (p) => {
              setTranscodePayload(p);
              setCanPlay(
                await canPlayAfterTranscode(
                  transcodePayload(),
                  defaultVideo().framerate,
                ),
              );
            }}
          />
        </SlideItem>
      </div>
      <div class="flex items-center gap-1">
        <Show when={selectedVariantIdx() != props.variants.length}>
          <A
            href={watchUrl()}
            class={`btn ${
              canPlay()?.combined.supported
                ? "btn-success"
                : canPlay() !== undefined && !canPlay()!.combined.supported
                  ? "btn-error"
                  : "btn"
            }`}
          >
            Watch
            <FiPlay size={20} />
          </A>
        </Show>
        <Show when={selectedVariantIdx() == props.variants.length}>
          <button
            class={`btn ${
              canPlay()?.combined.supported
                ? "btn-success"
                : canPlay() !== undefined && !canPlay()!.combined
                  ? "btn-error"
                  : "btn"
            }`}
            onClick={() => props.onCommit(transcodePayload())}
          >
            <span>Transcode</span>
          </button>
        </Show>
        <Show when={canPlay()}>
          <div class="flex items-center">
            <CompatibilityIndicator capabilities={canPlay()!.audio}>
              <FiHeadphones size={20} />
            </CompatibilityIndicator>
            <CompatibilityIndicator capabilities={canPlay()!.video}>
              <FiVideo size={20} />
            </CompatibilityIndicator>
          </div>
        </Show>
      </div>
    </div>
  );
}
