import { createEffect, For } from "solid-js";
import type { Schemas } from "../../utils/serverApi";
import LogRow from "./LogRow";

type Props = {
  logs: Schemas["JsonTracingEvent"][];
};

export default function LogWindow(props: Props) {
  let windowRef: HTMLDivElement = {} as any;
  createEffect(() => {
    if (props.logs) {
      windowRef.scrollTo({ top: windowRef.scrollHeight });
    }
  });
  return (
    <div
      ref={windowRef}
      class="h-full max-h-fit w-full overflow-y-scroll rounded-xl bg-neutral-950 p-3"
    >
      <For each={props.logs}>{(msg) => <LogRow message={msg} />}</For>
    </div>
  );
}
