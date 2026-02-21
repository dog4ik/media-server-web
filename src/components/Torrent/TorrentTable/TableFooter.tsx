import { Table } from "@tanstack/solid-table";

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
    </div>
  );
}
