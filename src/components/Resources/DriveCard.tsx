import { Show } from "solid-js";
import { type DiskGroup, driveSegments } from "@/lib/resourceUsage";
import { Badge } from "@/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import { formatSize } from "@/utils/formats";
import { BarLegend, type LegendRow } from "./BarLegend";
import { scrollToDir } from "./scroll";
import { UsageBar, type UsageBarSegment } from "./UsageBar";

type Props = {
  group: DiskGroup;
};

export function DriveCard(props: Props) {
  let disk = () => props.group.disk;
  let used = () => disk().total_space - disk().available_space;

  let barSegments = (): UsageBarSegment[] =>
    driveSegments(props.group).map((segment) => ({
      label: segment.label,
      size: segment.size,
      color: segment.color,
      onClick: segment.dir && (() => scrollToDir(segment.dir!.id)),
    }));

  let legendRows = (): LegendRow[] => [
    ...barSegments().map((segment) => ({
      label: segment.label,
      size: segment.size,
      color: segment.color,
      onClick: segment.onClick,
    })),
    { label: "Free", size: disk().available_space },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle class="flex min-w-0 flex-wrap items-center gap-2">
          <span class="truncate font-mono">{disk().mountpoint}</span>
          <Badge variant="outline">{disk().fs}</Badge>
          <Show when={disk().is_read_only}>
            <Badge variant="secondary">read only</Badge>
          </Show>
          <Show when={disk().is_removable}>
            <Badge variant="secondary">removable</Badge>
          </Show>
        </CardTitle>
        <CardAction class="text-muted-foreground text-sm">
          {formatSize(used())} of {formatSize(disk().total_space)} used
        </CardAction>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <UsageBar total={disk().total_space} segments={barSegments()} />
        <BarLegend total={disk().total_space} rows={legendRows()} />
      </CardContent>
    </Card>
  );
}
