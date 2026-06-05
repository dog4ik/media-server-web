import { FiChevronRight } from "solid-icons/fi";
import { ParentProps } from "solid-js";
import { cn } from "@/utils/cn";

type RowProps = {
  onClick?: () => void;
  variant?: "default" | "destructive";
};

const rowClass =
  "flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors";

export function MenuRow(props: RowProps & ParentProps) {
  return (
    <button
      class={cn(
        rowClass,
        props.variant === "destructive"
          ? "text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10"
          : "hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground",
      )}
      onClick={props.onClick}
    >
      <span class="pointer-events-none">{props.children}</span>
    </button>
  );
}

type ExpandRowProps = {
  popoverTarget: string;
  onClick?: () => void;
};

export function ExpandRow(props: ExpandRowProps & ParentProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        props.onClick && props.onClick();
      }}
      popovertarget={props.popoverTarget}
      style={`
anchor-name: --${props.popoverTarget};
`}
      class={cn(
        rowClass,
        "justify-between hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground",
      )}
    >
      <span class="pointer-events-none">{props.children}</span>
      <FiChevronRight size={16} class="pointer-events-none text-muted-foreground" />
    </button>
  );
}
