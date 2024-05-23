import { A } from "@solidjs/router";
import { FiPlay } from "solid-icons/fi";
import { capabilitiesBg } from "../VersionSlider/AddVersion";

type Props = {
  href: string;
  canPlay?: {
    audio: MediaCapabilitiesDecodingInfo;
    video: MediaCapabilitiesDecodingInfo;
    combined: MediaCapabilitiesDecodingInfo;
  };
};

export default function PlayButton(props: Props) {
  return (
    <A
      href={props.href}
      data-tip="Play"
      class={`tooltip tooltip-bottom flex h-10 w-16 items-center justify-center rounded-md ${capabilitiesBg(props.canPlay?.combined)}`}
    >
      <FiPlay size={25} class="stroke-black" />
    </A>
  );
}
