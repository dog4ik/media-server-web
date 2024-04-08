import { Match, ParentProps, Switch } from "solid-js";

type Status = "done" | "pending" | "error";

type RowProps = {
  name: string;
  type: string;
  status: Status;
  progress?: number;
  created: string;
  onCancel?: () => void;
};

export function TableRow(props: RowProps) {
  return (
    <tr>
      <td class="w-full max-w-0 py-4 pl-4 pr-3 text-sm font-medium text-gray-700 sm:w-auto sm:max-w-none sm:pl-6">
        <div class="w-fit">
          <span class="block font-serif text-sm font-normal text-gray-700">
            {props.name}
          </span>
        </div>
      </td>
      <td>
        <span class="block font-serif text-sm font-normal text-gray-700">
          {props.type}
        </span>
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
            when={props.status === "pending" && props.progress !== undefined}
          >
            <div class="relative">
              <span class="absolute left-1/2 -translate-x-1/2 -translate-y-1/3 -top-1/3 text-black">
                {props.progress}%
              </span>
              <progress
                class="progress progress-success w-56"
                value={props.progress}
                max="100"
              />
            </div>
          </Match>
          <Match
            when={props.status === "pending" && props.progress === undefined}
          >
            <progress class="progress w-56" />
          </Match>
        </Switch>
      </td>
      <td>
        <span class="block font-serif text-sm font-normal text-gray-700">
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
