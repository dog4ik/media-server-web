import { For, createEffect } from "solid-js";
import LogRow from "./LogRow";
import { LogMessage } from "../../utils/serverApi";

type Props = {
  logs: LogMessage[];
};

export default function LogWindow(props: Props) {
  let windowRef: HTMLDivElement;
  createEffect(() => {
    if (props.logs) {
      windowRef.scrollTo({ top: windowRef.scrollHeight });
    }
  });
  return (
    <>
      <div
        ref={windowRef!}
        class="w-full overflow-y-scroll p-3 h-full max-h-fit rounded-xl bg-neutral-950"
      >
        <For each={props.logs}>{(msg) => <LogRow message={msg} />}</For>
      </div>
    </>
  );
}
