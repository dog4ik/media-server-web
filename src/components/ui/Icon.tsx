import clsx from "clsx";
import { ParentProps, Show } from "solid-js";

type TooltipProps = {
  title?: string;
  position?: "top" | "right" | "bottom" | "left";
} & ParentProps;

function ToolTip(props: TooltipProps) {
  return (
    <Show when={props.title} fallback={props.children}>
      <div
        class={clsx(
          "tooltip",
          props.position === "top" && "tooltip-top",
          props.position === "right" && "tooltip-right",
          props.position === "bottom" && "tooltip-bottom",
          props.position === "left" && "tooltip-left",
        )}
        data-tip={props.title}
      >
        {props.children}
      </div>
    </Show>
  );
}

type IconProps = {
  tooltip?: string;
  onClick: () => void;
  disabled?: boolean;
} & ParentProps;

export default function Icon(props: IconProps) {
  return (
    <ToolTip position="bottom" title={props.tooltip}>
      <button
        disabled={props.disabled}
        onClick={props.onClick}
        class="flex items-center justify-center rounded-xl bg-neutral-800 p-2 transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-900 disabled:hover:bg-red-500"
      >
        {props.children}
      </button>
    </ToolTip>
  );
}
