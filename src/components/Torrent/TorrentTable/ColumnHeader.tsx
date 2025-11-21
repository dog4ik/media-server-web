import { Button } from "@/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { DropdownMenuTriggerProps } from "@kobalte/core/dropdown-menu";
import type { Column } from "@tanstack/solid-table";
import { Match, Show, splitProps, Switch, VoidProps } from "solid-js";
import { ICON_SIZE } from ".";

import ArrowUpDown from "lucide-solid/icons/arrow-up-down";
import ArrowUp from "lucide-solid/icons/arrow-up";
import ArrowDown from "lucide-solid/icons/arrow-down";
import EyeOff from "lucide-solid/icons/eye-off";

export function TableColumnHeader<TData, TValue>(
  props: VoidProps<{ column: Column<TData, TValue>; title: string }>,
) {
  const [local] = splitProps(props, ["column", "title"]);
  return (
    <Show
      when={local.column.getCanSort() && local.column.getCanHide()}
      fallback={<span class="text-sm font-medium">{local.title}</span>}
    >
      <div class="flex items-center space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            as={(props: DropdownMenuTriggerProps) => (
              <Button
                aria-label={
                  local.column.getIsSorted() === "desc"
                    ? "Sorted descending. Click to sort ascending."
                    : local.column.getIsSorted() === "asc"
                      ? "Sorted ascending. Click to sort descending."
                      : "Not sorted. Click to sort ascending."
                }
                variant="ghost"
                class="data-expanded:bg-accent -ml-4 h-8"
                {...props}
              >
                <span>{local.title}</span>
                <div class="ml-1">
                  <Switch fallback={<ArrowUpDown size={ICON_SIZE} />}>
                    <Match when={local.column.getIsSorted() === "asc"}>
                      <ArrowUp size={ICON_SIZE} />
                    </Match>
                    <Match when={local.column.getIsSorted() === "desc"}>
                      <ArrowDown size={ICON_SIZE} />
                    </Match>
                  </Switch>
                </div>
              </Button>
            )}
          />
          <DropdownMenuContent>
            <Show when={local.column.getCanSort()}>
              <DropdownMenuItem
                aria-label="Sort ascending"
                onClick={() => local.column.toggleSorting(false, true)}
              >
                <ArrowUp size={ICON_SIZE} />
                Asc
              </DropdownMenuItem>
              <DropdownMenuItem
                aria-label="Sort descending"
                onClick={() => local.column.toggleSorting(true, true)}
              >
                <ArrowDown size={ICON_SIZE} />
                Desc
              </DropdownMenuItem>
            </Show>

            <Show when={local.column.getCanSort() && local.column.getCanHide()}>
              <DropdownMenuSeparator />
            </Show>

            <Show when={local.column.getCanHide()}>
              <DropdownMenuItem
                aria-label="Hide column"
                onClick={() => local.column.toggleVisibility(false)}
              >
                <EyeOff size={ICON_SIZE} />
                Hide
              </DropdownMenuItem>
            </Show>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Show>
  );
}
