import { A } from "@solidjs/router";
import { FiPlay } from "solid-icons/fi";

type Props = {
  href: string;
  canPlay?: {
    audio?: MediaCapabilitiesDecodingInfo;
    video?: MediaCapabilitiesDecodingInfo;
    combined?: MediaCapabilitiesDecodingInfo;
  };
};

export default function PlayButton(props: Props) {
  return (
    <A
      href={props.href}
      data-tip="Play"
      classList={{
        "flex h-10 w-16 items-center justify-center rounded-md": true,
        "bg-green-500": props.canPlay?.combined?.supported === true,
        "bg-red-500": props.canPlay?.combined?.supported === false,
        "bg-yellow-500": props.canPlay?.combined === undefined,
      }}
    >
      <FiPlay size={25} class="stroke-black" />
    </A>
  );
}
