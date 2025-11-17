import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { formatDuration } from "@/utils/formats";
import { Schemas } from "@/utils/serverApi";
import { For } from "solid-js";

type TrackerProps = {
  tracker: Schemas["StateTracker"];
};

function Tracker(props: TrackerProps) {
  return (
    <TableRow>
      <TableCell class="font-medium">{props.tracker.url}</TableCell>
      <TableCell>
        {props.tracker.status}
        {props.tracker.status == "error" ? ` (${props.tracker.message})` : ""}
      </TableCell>
      <TableCell class="text-right">
        {formatDuration(props.tracker.announce_interval)}
      </TableCell>
    </TableRow>
  );
}

type Props = {
  trackers: Schemas["StateTracker"][];
};

export function TrackerList(props: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Url</TableHead>
          <TableHead>Status</TableHead>
          <TableHead class="text-right">Announce interval</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <For each={props.trackers}>
          {(tracker) => <Tracker tracker={tracker} />}
        </For>
      </TableBody>
    </Table>
  );
}
