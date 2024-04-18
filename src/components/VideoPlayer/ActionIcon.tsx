import { Match, Ref, Switch } from "solid-js";
import { DispatchedAction } from ".";
import {
  FiChevronsLeft,
  FiChevronsRight,
  FiPause,
  FiPlay,
  FiVolume1,
  FiVolume2,
} from "solid-icons/fi";
import { FaSolidClosedCaptioning } from "solid-icons/fa";

type ActionIconProps = {
  ref: Ref<HTMLDivElement>;
  action: DispatchedAction;
};

export default function ActionIcon(props: ActionIconProps) {
  let size = 40;
  return (
    <div
      ref={props.ref}
      class="pointer-events-none absolute left-1/2 top-1/2 z-10 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black opacity-0"
    >
      <Switch>
        <Match when={props.action == "unpause"}>
          <FiPause stroke="white" size={size} />
        </Match>
        <Match when={props.action == "pause"}>
          <FiPlay stroke="white" size={size} />
        </Match>
        <Match when={props.action == "volumedown"}>
          <FiVolume1 stroke="white" size={size} />
        </Match>
        <Match when={props.action == "volumeup"}>
          <FiVolume2 stroke="white" size={size} />
        </Match>
        <Match when={props.action == "seekleft"}>
          <FiChevronsLeft stroke="white" size={size} />
        </Match>
        <Match when={props.action == "seekright"}>
          <FiChevronsRight stroke="white" size={size} />
        </Match>
        <Match when={props.action == "togglesubs"}>
          <FaSolidClosedCaptioning stroke="white" size={size} />
        </Match>
      </Switch>
    </div>
  );
}
