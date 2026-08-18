import Captions from "lucide-solid/icons/captions";
import ChevronsLeft from "lucide-solid/icons/chevrons-left";
import ChevronsRight from "lucide-solid/icons/chevrons-right";
import Pause from "lucide-solid/icons/pause";
import Play from "lucide-solid/icons/play";
import Volume1 from "lucide-solid/icons/volume-1";
import Volume2 from "lucide-solid/icons/volume-2";
import { Match, type Ref, Switch } from "solid-js";
import type { DispatchedAction } from ".";

type ActionIconProps = {
  ref: Ref<HTMLDivElement>;
  action: DispatchedAction;
};

export default function ActionIcon(props: ActionIconProps) {
  let size = 40;
  return (
    <div
      ref={props.ref}
      class="pointer-events-none absolute z-10 flex h-20 w-20 items-center justify-center rounded-full bg-black opacity-0"
    >
      <Switch>
        <Match when={props.action === "unpause"}>
          <Pause stroke="white" size={size} />
        </Match>
        <Match when={props.action === "pause"}>
          <Play stroke="white" size={size} />
        </Match>
        <Match when={props.action === "volumedown"}>
          <Volume1 stroke="white" size={size} />
        </Match>
        <Match when={props.action === "volumeup"}>
          <Volume2 stroke="white" size={size} />
        </Match>
        <Match when={props.action === "seekleft"}>
          <ChevronsLeft stroke="white" size={size} />
        </Match>
        <Match when={props.action === "seekright"}>
          <ChevronsRight stroke="white" size={size} />
        </Match>
        <Match when={props.action === "togglesubs"}>
          <Captions stroke="white" size={size} />
        </Match>
      </Switch>
    </div>
  );
}
