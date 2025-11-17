import { LinkOptions, Link } from "@tanstack/solid-router";
import { FiPlay } from "solid-icons/fi";

type Props = {
  link: LinkOptions;
  canPlay?: {
    audio?: MediaCapabilitiesDecodingInfo;
    video?: MediaCapabilitiesDecodingInfo;
    combined?: MediaCapabilitiesDecodingInfo;
  };
};

export default function PlayButton(props: Props) {
  return (
    <Link
      classList={{
        "flex gap-2 items-center p-2 justify-center rounded-md": true,
        "bg-green-500": props.canPlay?.combined?.supported === true,
        "bg-red-500": props.canPlay?.combined?.supported === false,
        "bg-yellow-500": props.canPlay?.combined === undefined,
      }}
      {...props.link}
    >
      <FiPlay size={25} class="stroke-black" />
      <span class="text-black">Play</span>
    </Link>
  );
}
