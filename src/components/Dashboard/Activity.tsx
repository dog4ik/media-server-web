import { useServerStatus } from "../../context/ServerStatusContext";
import { For, Show } from "solid-js";
import PageTitle from "../PageTitle";
import { EventKind } from "../../utils/serverApi";
import { FiX } from "solid-icons/fi";
import TasksTable, { TableRow } from "../ui/TasksTable";

type TaskProps = {
  onCancel: () => void;
  number: number;
  cancelable: boolean;
  target: string;
  kind: EventKind;
  progress?: number;
};

export default function Activity() {
  let [{ tasks, tasksProgress }, { cancelTask }] = useServerStatus();
  return (
    <>
      <PageTitle>Activity</PageTitle>
      <div class="flex items-center justify-center flex-col gap-2 p-2">
        <Show when={tasks?.length === 0}>
          <div class="text-5xl">Activity is empty</div>
        </Show>
      </div>
      <Show when={tasks?.length > 0}>
        <TasksTable>
          <For each={tasks}>
            {(task) => {
              return (
                <TableRow
                  type={task.kind}
                  onCancel={
                    task.cancelable ? () => cancelTask(task.id) : undefined
                  }
                  name={task.target.split("/").at(-1)!}
                  status="pending"
                  created="now"
                  progress={tasksProgress[task.id]}
                />
              );
            }}
          </For>
        </TasksTable>
      </Show>
    </>
  );
}
