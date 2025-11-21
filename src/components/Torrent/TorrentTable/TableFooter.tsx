import { Table } from "@tanstack/solid-table";
import { ICON_SIZE } from ".";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { Button } from "@/ui/button";
import ChevronsLeft from "lucide-solid/icons/chevrons-left";
import ChevronLeft from "lucide-solid/icons/chevron-left";
import ChevronRight from "lucide-solid/icons/chevron-right";
import ChevronsRight from "lucide-solid/icons/chevrons-right";

type Props<T> = {
  table: Table<T>;
};

export function PaginationFooter<T>(props: Props<T>) {
  return (
    <div class="flex w-full flex-col-reverse items-center justify-between gap-4 overflow-auto px-2 py-1 sm:flex-row">
      <div class="text-muted-foreground flex-1 text-sm whitespace-nowrap">
        {props.table.getFilteredSelectedRowModel().rows.length} of{" "}
        {props.table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div class="flex flex-col-reverse items-center gap-4 sm:flex-row">
        <div class="flex items-center space-x-2">
          <p class="text-sm font-medium whitespace-nowrap">Rows per page</p>
          <Select
            value={props.table.getState().pagination.pageSize}
            onChange={(value) => value && props.table.setPageSize(value)}
            options={[10, 20, 30, 40, 50]}
            itemComponent={(props) => (
              <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
            )}
          >
            <SelectTrigger class="h-8 w-18">
              <SelectValue<string>>
                {(state) => state.selectedOption()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>
        </div>
        <div class="flex items-center justify-center text-sm font-medium whitespace-nowrap">
          Page {props.table.getState().pagination.pageIndex + 1} of{" "}
          {props.table.getPageCount()}
        </div>
        <div class="flex items-center space-x-2">
          <Button
            aria-label="Go to first page"
            variant="outline"
            class="flex size-8 p-0"
            onClick={() => props.table.setPageIndex(0)}
            disabled={!props.table.getCanPreviousPage()}
          >
            <ChevronsLeft size={ICON_SIZE} />
          </Button>
          <Button
            aria-label="Go to previous page"
            variant="outline"
            size="icon"
            class="size-8"
            onClick={() => props.table.previousPage()}
            disabled={!props.table.getCanPreviousPage()}
          >
            <ChevronLeft size={ICON_SIZE} />
          </Button>
          <Button
            aria-label="Go to next page"
            variant="outline"
            size="icon"
            class="size-8"
            onClick={() => props.table.nextPage()}
            disabled={!props.table.getCanNextPage()}
          >
            <ChevronRight size={ICON_SIZE} />
          </Button>
          <Button
            aria-label="Go to last page"
            variant="outline"
            size="icon"
            class="flex size-8"
            onClick={() =>
              props.table.setPageIndex(props.table.getPageCount() - 1)
            }
            disabled={!props.table.getCanNextPage()}
          >
            <ChevronsRight size={ICON_SIZE} />
          </Button>
        </div>
      </div>
    </div>
  );
}
