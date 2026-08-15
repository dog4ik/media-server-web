import { cx } from "cva";
import { Show } from "solid-js";
import { dirSegments } from "@/lib/resourceUsage";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import { formatSize } from "@/utils/formats";
import { fullUrl, type Schemas } from "@/utils/serverApi";
import { BarLegend, type LegendRow } from "./BarLegend";
import { highlightedDir } from "./scroll";
import { UsageBar } from "./UsageBar";

type Props = {
  dir: Schemas["MediaDirStats"];
  kind: "movies" | "shows";
  anchorId: string;
  accentColor: string;
};

export function MediaDirCard(props: Props) {
  let segments = () => dirSegments(props.dir);

  let localPosterUrl = (id: number) =>
    props.kind === "movies"
      ? fullUrl("/api/movie/{id}/poster", { path: { id } })
      : fullUrl("/api/show/{id}/poster", { path: { id } });

  let legendRows = (): LegendRow[] =>
    segments().map((segment) => ({
      label: segment.label,
      size: segment.size,
      color: segment.color,
      posterSrcList: segment.content && [
        localPosterUrl(segment.content.id),
        segment.content.poster ?? undefined,
      ],
      href: segment.content && {
        to:
          props.kind === "movies"
            ? ("/movies/$id" as const)
            : ("/shows/$id" as const),
        params: { id: segment.content.id.toString() },
      },
    }));

  return (
    <Card
      id={props.anchorId}
      class={cx(
        "scroll-mt-20 transition-shadow",
        highlightedDir() === props.anchorId && "ring-primary ring-2",
      )}
    >
      <CardHeader>
        <CardTitle class="flex min-w-0 items-center gap-2">
          <div
            class="size-2.5 shrink-0 rounded-xs"
            style={{ "background-color": props.accentColor }}
          />
          <span class="truncate font-mono text-sm" title={props.dir.path}>
            {props.dir.path}
          </span>
        </CardTitle>
        <CardAction class="text-muted-foreground text-sm">
          {formatSize(props.dir.size)} - {props.dir.contents.length} items
        </CardAction>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <UsageBar total={props.dir.size} segments={segments()} />
        <Show
          when={props.dir.contents.length > 0}
          fallback={<p class="text-muted-foreground text-sm">empty</p>}
        >
          <BarLegend total={props.dir.size} rows={legendRows()} />
        </Show>
      </CardContent>
    </Card>
  );
}
