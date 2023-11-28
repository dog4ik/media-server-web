import { useTasksContext } from "../../context/ProgressContext";
import { For, Show } from "solid-js";
import PageTitle from "../PageTitle";
import { EventKind } from "../../utils/ServerApi";
import {
  notificator,
  useNotificationsContext,
} from "../../context/NotificationContext";

type TaskProps = {
  onCancel: () => void;
  cancelable: boolean;
  target: string;
  kind: EventKind;
  progress?: number;
};

function Task(props: TaskProps) {
  console.log("progress", props.progress);
  return (
    <div class="flex w-full justify-between items-center relative">
      <Show when={props.progress !== undefined}>
        <div
          class="bg-green-400 p-2 rounded-full absolute h-full"
          style={{ width: `${props.progress}%` }}
        ></div>
      </Show>
      <span class="z-10 max-w-xs truncate" title={props.target}>
        {props.kind} {props.target}
      </span>
      <div class="z-10">{props.progress}</div>
      <button
        class="bg-white text-black rounded-full p-3"
        onClick={props.onCancel}
      >
        Cancel
      </button>
    </div>
  );
}

export default function Activity() {
  let [{ serverTasks, tasksProgress }, { cancelTask }] = useTasksContext();
  let [, { addNotification }] = useNotificationsContext();
  return (
    <>
      <PageTitle>Activity</PageTitle>
      <div class="p-2 flex flex-col gap-2">
        <Show when={serverTasks()?.length === 0}>
          <div onClick={() => addNotification("success", "test")}>
            No current tasks running
          </div>
        </Show>
        <For each={serverTasks()}>
          {(task) => {
            return (
              <Task
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
