import { Tooltip, TooltipContent, TooltipTrigger } from "@/ui/tooltip";
import { buttonVariants, type ButtonProps } from "@/ui/button";
import { ParentProps } from "solid-js";

type IconProps = {
  tooltip?: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: ButtonProps["variant"];
} & ParentProps;

export default function Icon(props: IconProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        disabled={props.disabled}
        onClick={props.onClick}
        class={buttonVariants({
          variant: props.variant ?? "secondary",
          size: "icon-lg",
        })}
      >
        {props.children}
      </TooltipTrigger>
      <TooltipContent>
        <p>{props.tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
