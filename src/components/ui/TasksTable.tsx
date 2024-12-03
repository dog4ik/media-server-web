import { Match, ParentProps, Show, Switch } from "solid-js";
import { TaskType } from "../../context/ServerStatusContext";
import { formatSize } from "../../utils/formats";
import { Schemas } from "../../utils/serverApi";
import {
  Table,
  TableRow,
  TableCaption,
  TableHead,
  TableHeader,
  TableBody,
  TableCell,
} from "@/ui/table";
import { Progress } from "@/ui/progress";
import { Button } from "@/ui/button";

type Status = "done" | "pending" | "error";

type RowProps = {
  name: string;
  url?: string;
  poster?: string;
  task_type: TaskType["kind"]["task_kind"];
  status: Status;
  percent?: number;
  speed?: Schemas["ProgressSpeed"];
  created: string;
  onCancel?: () => void;
};

export function Row(props: RowProps) {
  return (
    <TableRow>
      <TableCell class="font-medium">
        <Show when={props.poster}>
          {(poster) => (
            <img
              src={poster()}
              width={60}
              height={90}
              class="aspect-poster inline"
            />
          )}
        </Show>
        <Show
          when={props.url}
          fallback={<span class="px-3">{props.name}</span>}
        >
          {(url) => (
            <Button as="a" href={url()} variant={"link"} class="px-3">
              {props.name}
            </Button>
          )}
        </Show>
      </TableCell>
      <TableCell>{props.task_type}</TableCell>
      <TableCell>
        <Show when={props.speed}>
          {(speed) => (
            <span>
              <Switch>
                <Match when={speed().speed_type == "relativespeed"}>
                  {/* @ts-expect-error */}
                  {speed()["speed"]}x
                </Match>
                <Match when={speed().speed_type == "bytespersec"}>
                  {/* @ts-expect-error */}
                  {formatSize(speed()["bytes"])} / s
                </Match>
              </Switch>
            </span>
          )}
        </Show>
      </TableCell>
      <TableCell>
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
            <p class="w-full text-center font-mono">
              {props.percent?.toFixed(2)}%
            </p>
            <Progress
              value={props.percent}
              maxValue={100}
              class="w-60% progress"
            />
          </Match>
          <Match
            when={props.status === "pending" && props.percent === undefined}
          >
            <Progress />
          </Match>
        </Switch>
      </TableCell>
      <TableCell class="text-right">{props.created}</TableCell>
      <TableCell>
        <Button
          disabled={props.onCancel === undefined}
          onClick={props.onCancel}
          class="btn"
        >
          Cancel
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function TasksTable(props: ParentProps) {
  return (
    <Table>
      <TableCaption>Current Activity</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Speed</TableHead>
          <TableHead>Status</TableHead>
          <TableHead class="text-right">Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>{props.children}</TableBody>
    </Table>
  );
}
