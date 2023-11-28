import { LogMessage } from "../../pages/Logs";
import { For } from "solid-js";
import LogRow from "./LogRow";

type Props = {
  logs: LogMessage[];
};
export default function LogWindow(props: Props) {
  return (
    <>
      <div class="w-full overflow-y-scroll p-3 h-full max-h-fit rounded-xl bg-neutral-400">
        <For each={props.logs}>{(msg) => <LogRow message={msg} />}</For>
      </div>
    </>
  );
}
