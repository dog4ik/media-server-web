import { A, createAsync } from "@solidjs/router";
import { Schemas } from "../../utils/serverApi";
import { isCompatible } from "../../utils/mediaCapabilities/mediaCapabilities";

type Props = {
  variant: Schemas["DetailedVariant"];
  href: string;
  compatability: MediaCapabilitiesDecodingInfo;
};

function stringCodec<T extends string | { other: string }>(codec: T): string {
  if (typeof codec == "object") {
    return codec.other;
  } else {
    return codec;
  }
}

export default function VariantMenuRow(props: Props) {
  let defaultVideo = () =>
    props.variant.video_tracks.find((t) => t.is_default) ??
    props.variant.video_tracks[0];
  let defaultAudio = () =>
    props.variant.audio_tracks.find((t) => t.is_default) ??
    props.variant.audio_tracks[0];
  let bgColor = () => {
    let compatability = props.compatability;
    console.log(compatability, "here");
    if (compatability) {
      return compatability.supported ? "bg-green-400" : "bg-red-500";
    }
    return "";
  };
  return (
    <a href={props.href} class={`flex gap-2 py-1 ${bgColor()}`}>
      <span>
        {defaultVideo().resolution.width}x{defaultVideo().resolution.height}
      </span>
      <span>{stringCodec(defaultVideo().codec)}</span>
      <span>{stringCodec(defaultAudio().codec)}</span>
    </a>
  );
}
