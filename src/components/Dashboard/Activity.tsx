import {
  displayTask,
  useServerStatus,
} from "../../context/ServerStatusContext";
import { For, Show } from "solid-js";
import PageTitle from "../PageTitle";
import TasksTable, { TableRow } from "../ui/TasksTable";

export default function Activity() {
  let [{ tasks, tasksProgress }, { cancelTask }] = useServerStatus();
  return (
    <>
      <PageTitle>Activity</PageTitle>
      <div class="flex flex-col items-center justify-center gap-2 p-2">
        <Show when={tasks?.length === 0}>
          <div class="text-5xl">Activity is empty</div>
        </Show>
      </div>
      <Show when={tasks?.length > 0}>
        <TasksTable>
          <For each={tasks}>
            {(task) => {
              let display = task.metadata
                ? displayTask(task.metadata)
                : undefined;
              return (
                <TableRow
                  task_type={task.task.task_kind}
                  onCancel={
                    task.cancelable ? () => cancelTask(task.id) : undefined
                  }
                  poster={display?.poster}
                  name={display?.friendlyTitle() ?? task.id}
                  status="pending"
                  created="now"
                  percent={tasksProgress[task.id]?.percent}
                  speed={tasksProgress[task.id]?.speed}
                />
              );
            }}
          </For>
        </TasksTable>
      </Show>
    </>
  );
}
