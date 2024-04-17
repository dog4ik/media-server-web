import { FiVolume, FiVolume1, FiVolume2, FiVolumeX } from "solid-icons/fi";
import { Match, Show, Switch } from "solid-js";

type Props = {
  volume: number;
  isMuted: boolean;
};

export default function VolumeIcon(props: Props) {
  let size = 30;
  return (
    <Switch>
      <Match when={props.volume == 0 || props.isMuted}>
        <FiVolumeX size={size} />
      </Match>
      <Match when={props.volume < 0.3}>
        <FiVolume size={size} />
      </Match>
      <Match when={props.volume >= 0.8}>
        <FiVolume2 size={size} />
      </Match>
      <Match when={props.volume < 0.8}>
        <FiVolume1 size={size} />
      </Match>
    </Switch>
  );
}
