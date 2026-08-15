import { Link } from "@tanstack/solid-router";
import { cx } from "cva";
import { For, Show } from "solid-js";
import FallbackImage from "@/components/FallbackImage";
import { formatPercent, formatSize } from "@/utils/formats";

export type LegendRow = {
  label: string;
  size: number;
  color?: string;
  posterSrcList?: (string | undefined)[];
  href?: { to: "/movies/$id" | "/shows/$id"; params: { id: string } };
  onClick?: () => void;
};

type Props = {
  rows: LegendRow[];
  total: number;
};

export function BarLegend(props: Props) {
  return (
    <ul class="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
      <For each={props.rows}>
        {(row) => (
          <li class="flex min-w-0 items-center gap-2">
            <div
              class={cx(
                "size-2.5 shrink-0 rounded-xs",
                !row.color && "bg-muted",
              )}
              style={{ "background-color": row.color }}
            />
            <Show when={row.posterSrcList}>
              {(srcList) => (
                <FallbackImage
                  srcList={srcList()}
                  alt=""
                  width={22}
                  height={32}
                  class="shrink-0 rounded-xs object-cover"
                />
              )}
            </Show>
            <Show
              when={row.href}
              fallback={
                <Show
                  when={row.onClick}
                  fallback={<span class="truncate text-sm">{row.label}</span>}
                >
                  <button
                    type="button"
                    onClick={row.onClick}
                    class="cursor-pointer truncate text-left text-sm hover:underline"
                  >
                    {row.label}
                  </button>
                </Show>
              }
            >
              {(href) => (
                <Link
                  to={href().to}
                  params={href().params}
                  search={{ provider: "local" }}
                  class="truncate text-sm hover:underline"
                >
                  {row.label}
                </Link>
              )}
            </Show>
            <span class="text-muted-foreground ml-auto shrink-0 text-xs tabular-nums">
              {formatSize(row.size)} - {formatPercent(row.size, props.total)}
            </span>
          </li>
        )}
      </For>
    </ul>
  );
}
