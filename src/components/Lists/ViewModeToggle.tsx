import LayoutGrid from "lucide-solid/icons/layout-grid";
import List from "lucide-solid/icons/list";
import { cn } from "@/lib/cn";

export type ViewMode = "grid" | "list";

type Props = {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
};

export function ViewModeToggle(props: Props) {
  let buttonClass = (active: boolean) =>
    cn(
      "flex cursor-pointer items-center justify-center rounded-sm p-1.5 transition-colors",
      active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
    );
  return (
    <div class="border-border inline-flex items-center gap-0.5 rounded-md border p-0.5">
      <button
        title="Grid view"
        aria-pressed={props.mode === "grid"}
        class={buttonClass(props.mode === "grid")}
        onClick={() => props.onChange("grid")}
      >
        <LayoutGrid class="size-4" />
      </button>
      <button
        title="List view"
        aria-pressed={props.mode === "list"}
        class={buttonClass(props.mode === "list")}
        onClick={() => props.onChange("list")}
      >
        <List class="size-4" />
      </button>
    </div>
  );
}
