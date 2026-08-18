import Volume from "lucide-solid/icons/volume";
import Volume1 from "lucide-solid/icons/volume-1";
import Volume2 from "lucide-solid/icons/volume-2";
import VolumeX from "lucide-solid/icons/volume-x";
import { Match, Switch } from "solid-js";

type Props = {
  volume: number;
  isMuted: boolean;
};

export default function VolumeIcon(props: Props) {
  let size = 30;
  return (
    <Switch>
      <Match when={props.volume === 0 || props.isMuted}>
        <VolumeX size={size} />
      </Match>
      <Match when={props.volume < 0.3}>
        <Volume size={size} />
      </Match>
      <Match when={props.volume >= 0.8}>
        <Volume2 size={size} />
      </Match>
      <Match when={props.volume < 0.8}>
        <Volume1 size={size} />
      </Match>
    </Switch>
  );
}
