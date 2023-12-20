import { useServerStatus } from "../../context/ServerStatusContext";
import { For, Show } from "solid-js";
import PageTitle from "../PageTitle";
import { EventKind } from "../../utils/serverApi";

type TaskProps = {
  onCancel: () => void;
  number: number;
  cancelable: boolean;
  target: string;
  kind: EventKind;
  progress?: number;
};

function Task(props: TaskProps) {
  return (
    <div class="flex w-full gap-2 justify-between items-start relative">
      <Show when={props.progress !== undefined}>
        <div
          class="bg-green-400 p-2 rounded-full absolute h-full"
          style={{ width: `${props.progress}%` }}
        ></div>
      </Show>
      <span class="z-10">{props.number}</span>
      <span class="z-10 truncate" title={props.target}>
        {props.kind} {props.target.split("/").at(-1)}
      </span>
      <div class="z-10">{props.progress}</div>
      <Show when={props.cancelable}>
        <button
          class="bg-white text-black rounded-full p-3"
          onClick={props.onCancel}
        >
          Cancel
        </button>
      </Show>
    </div>
  );
}

export default function Activity() {
  let [{ serverTasks, tasksProgress }, { cancelTask }] = useServerStatus();
  return (
    <>
      <PageTitle>Activity</PageTitle>
      <div class="p-2 flex flex-col gap-2">
        <Show when={serverTasks()?.length === 0}>
          <div>No current tasks running</div>
        </Show>
        <For each={serverTasks()}>
          {(task, idx) => {
            return (
              <Task
                number={idx() + 1}
                kind={task.kind}
                cancelable={task.cancelable}
                onCancel={() => cancelTask(task.id)}
                target={task.target}
                progress={tasksProgress().get(task.id)}
              />
            );
          }}
        </For>
      </div>
    </>
  );
}
