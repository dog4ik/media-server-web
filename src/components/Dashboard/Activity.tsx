import {
  displayTask,
  useServerStatus,
} from "../../context/ServerStatusContext";
import { For, Show } from "solid-js";
import PageTitle from "../PageTitle";
import TasksTable, { Row } from "../ui/TasksTable";

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
            {(t) => {
              let display = () => {
                if (t.kind.task_kind == "scan") {
                  return {
                    poster: undefined,
                    title: "Library scan",
                  };
                }
                if (t.metadata) {
                  let display = displayTask(t.metadata);
                  return {
                    poster: display.poster,
                    url: display.url(),
                    title: display.friendlyTitle(),
                  };
                }
                return {
                  poster: undefined,
                  title: t.id,
                };
              };
              return (
                <Row
                  task_type={t.kind.task_kind}
                  onCancel={t.cancelable ? () => cancelTask(t.id) : undefined}
                  poster={display().poster}
                  name={display().title}
                  url={display().url}
                  status="pending"
                  created="now"
                  percent={tasksProgress[t.id]?.percent}
                  speed={tasksProgress[t.id]?.speed}
                />
              );
            }}
          </For>
        </TasksTable>
      </Show>
    </>
  );
}
