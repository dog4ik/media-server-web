import { Match, ParentProps, Show, Switch } from "solid-js";
import { TaskType } from "../../context/ServerStatusContext";
import { formatSize } from "../../utils/formats";

type Status = "done" | "pending" | "error";

type RowProps = {
  name: string;
  poster?: string;
  task_type: TaskType["task"]["task_kind"];
  status: Status;
  percent?: number;
  speed?: number;
  created: string;
  onCancel?: () => void;
};

export function TableRow(props: RowProps) {
  return (
    <tr>
      <td class="w-full max-w-0 py-4 pl-4 pr-3 text-sm font-medium text-gray-700 sm:w-auto sm:max-w-none sm:pl-6">
        <div class="flex w-fit items-center">
          <Show when={props.poster}>
            {(poster) => (
              <img
                src={poster()}
                width={60}
                height={90}
                class="aspect-poster"
              />
            )}
          </Show>
          <span class="block text-sm font-normal text-gray-700">
            {props.name}
          </span>
        </div>
      </td>
      <td>
        <span class="block text-sm font-normal text-gray-700">
          {props.task_type}
        </span>
      </td>
      <td>
        <Show when={props.speed}>
          {(speed) => (
            <span class="block text-sm font-normal text-gray-700">
              <Switch>
                <Match when={props.task_type == "video"}>{speed()}x</Match>
                <Match when={props.task_type == "torrent"}>{formatSize(speed())} / s</Match>
              </Switch>
            </span>
          )}
        </Show>
      </td>
      <td>
        <Switch>
          <Match when={props.status == "error"}>
            <span class="badge badge-error">
              <span class="py-4 text-white">Error</span>
            </span>
          </Match>
          <Match when={props.status == "done"}>
            <span class="badge badge-success">
              <span class="py-4 text-white">Done</span>
            </span>
          </Match>
          <Match
            when={props.status === "pending" && props.percent !== undefined}
          >
            <div class="relative">
              <span class="absolute -top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/3 text-black">
                {props.percent}%
              </span>
              <progress
                class="progress progress-success w-56"
                value={props.percent}
                max="100"
              />
            </div>
          </Match>
          <Match
            when={props.status === "pending" && props.percent === undefined}
          >
            <progress class="progress w-56" />
          </Match>
        </Switch>
      </td>
      <td>
        <span class="block text-sm font-normal text-gray-700">
          {props.created}
        </span>
      </td>
      <td class="text-right">
        <button
          disabled={props.onCancel === undefined}
          onClick={props.onCancel}
          class="btn"
        >
          Cancel
        </button>
      </td>
    </tr>
  );
}

export default function TasksTable(props: ParentProps) {
  return (
    <div class="rounde overflow-hidden rounded-md shadow ring-1 ring-black ring-opacity-5">
      <table class="table">
        <thead class="bg-gray-50">
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Speed</th>
            <th>Status</th>
            <th>Created</th>
            <th>
              <span class="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          {props.children}
        </tbody>
      </table>
    </div>
  );
}
