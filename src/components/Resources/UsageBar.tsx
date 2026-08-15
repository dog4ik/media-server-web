import { cx } from "cva";
import { For, Show } from "solid-js";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/ui/tooltip";
import { formatPercent, formatSize } from "@/utils/formats";

export type UsageBarSegment = {
  label: string;
  size: number;
  color?: string;
  onClick?: () => void;
};

type Props = {
  total: number;
  segments: UsageBarSegment[];
  class?: string;
};

function segmentStyle(segment: UsageBarSegment) {
  return {
    "flex-grow": segment.size.toString(),
    "flex-basis": "0",
    "background-color": segment.color,
  };
}

export function UsageBar(props: Props) {
  let visible = () => props.segments.filter((segment) => segment.size > 0);
  let free = () => {
    let used = props.segments.reduce((sum, segment) => sum + segment.size, 0);
    return Math.max(0, props.total - used);
  };

  return (
    <div
      class={cx(
        "flex h-6 w-full gap-0.5 overflow-hidden rounded-md",
        props.class,
      )}
    >
      <For each={visible()}>
        {(segment) => (
          <Tooltip>
            <Show
              when={segment.onClick}
              fallback={
                <TooltipTrigger
                  as="div"
                  class="min-w-1.5 rounded-xs"
                  style={segmentStyle(segment)}
                />
              }
            >
              <TooltipTrigger
                as="button"
                type="button"
                onClick={segment.onClick}
                aria-label={`${segment.label}: ${formatSize(segment.size)}`}
                class="min-w-1.5 cursor-pointer rounded-xs"
                style={segmentStyle(segment)}
              />
            </Show>
            <TooltipContent>
              {segment.label} - {formatSize(segment.size)} (
              {formatPercent(segment.size, props.total)})
            </TooltipContent>
          </Tooltip>
        )}
      </For>
      <Show
        when={free() > 0}
        fallback={
          <Show when={visible().length === 0}>
            <div class="bg-muted min-w-0 grow rounded-xs" />
          </Show>
        }
      >
        <Tooltip>
          <TooltipTrigger
            as="div"
            class="bg-muted min-w-0 rounded-xs"
            style={{ "flex-grow": free().toString(), "flex-basis": "0" }}
          />
          <TooltipContent>
            Free - {formatSize(free())} ({formatPercent(free(), props.total)})
          </TooltipContent>
        </Tooltip>
      </Show>
    </div>
  );
}
