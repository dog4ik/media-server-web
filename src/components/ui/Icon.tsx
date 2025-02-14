import { Tooltip, TooltipContent, TooltipTrigger } from "@/ui/tooltip";
import { ParentProps } from "solid-js";

type IconProps = {
  tooltip?: string;
  onClick: () => void;
  disabled?: boolean;
} & ParentProps;

export default function Icon(props: IconProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        disabled={props.disabled}
        onClick={props.onClick}
        class="flex h-10 max-h-10 w-10 items-center justify-center rounded-xl bg-neutral-800 p-2 transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-900 disabled:hover:bg-red-500"
      >
        {props.children}
      </TooltipTrigger>
      <TooltipContent>
        <p>{props.tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
