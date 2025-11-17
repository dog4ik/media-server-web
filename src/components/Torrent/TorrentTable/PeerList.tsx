import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { Schemas } from "@/utils/serverApi";
import {
  CellContext,
  createSolidTable,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/solid-table";
import { TableColumnHeader } from "./ColumnHeader";
import { formatSize } from "@/utils/formats";
import { Badge } from "@/ui/badge";
import { createMemo, createSignal, For, Show } from "solid-js";
import { TextField, TextFieldRoot } from "@/ui/textfield";
import { PaginationFooter } from "./TableFooter";
import { PersistentTableState } from "@/utils/persistent_table_state";

type Props = {
  peers: Schemas["StatePeer"][];
};

function Status(props: { cell: CellContext<Schemas["StatePeer"], unknown> }) {
  return (
    <div class="flex w-[100px] items-center gap-2">
      <Show
        when={props.cell.row.original.in_status.choked}
        fallback={
          <Badge title="Unchoked" class="bg-green-400 transition-colors">
            C
          </Badge>
        }
      >
        <Badge title="Choked" class="bg-red-400 transition-colors">
          C
        </Badge>
      </Show>
      <Show
        when={props.cell.row.original.in_status.interested}
        fallback={
          <Badge title="Uninterested" class="bg-red-400 transition-colors">
            I
          </Badge>
        }
      >
        <Badge title="Interested" class="bg-green-400 transition-colors">
          I
        </Badge>
      </Show>
    </div>
  );
}

const COLUMNS: ColumnDef<Schemas["StatePeer"]>[] = [
  {
    accessorKey: "addr",
    header: (props) => (
      <TableColumnHeader column={props.column} title="Address" />
    ),
    cell: (props) => (
      <div class="flex space-x-2">
        <span class="max-w-[250px] truncate font-medium">
          {props.row.getValue("addr")}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "client_name",
    header: (props) => (
      <TableColumnHeader column={props.column} title="Client name" />
    ),
    cell: (props) => (
      <div class="flex space-x-2">
        <span class="max-w-[250px] truncate font-medium">
          {props.row.getValue("client_name")}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "downloaded",
    id: "total downloaded",
    header: (props) => (
      <TableColumnHeader column={props.column} title="Total downloaded" />
    ),
    cell: (props) => (
      <div class="flex w-[100px] items-center">
        <span class="text-center">
          {formatSize(props.row.original.downloaded)}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "download_speed",
    id: "download speed",
    header: (props) => (
      <TableColumnHeader column={props.column} title="Download speed" />
    ),
    cell: (props) => (
      <div class="flex w-[100px] items-center">
        <span class="text-center">
          {formatSize(props.row.original.download_speed)}/s
        </span>
      </div>
    ),
  },
  {
    accessorKey: "uploaded",
    id: "total uploaded",
    header: (props) => (
      <TableColumnHeader column={props.column} title="Total uploaded" />
    ),
    cell: (props) => (
      <div class="flex w-[100px] items-center">
        <span class="text-center">
          {formatSize(props.row.original.uploaded)}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "upload_speed",
    id: "upload speed",
    header: (props) => (
      <TableColumnHeader column={props.column} title="Upload speed" />
    ),
    cell: (props) => (
      <div class="flex w-[100px] items-center">
        <span class="text-center">
          {formatSize(props.row.original.upload_speed)}/s
        </span>
      </div>
    ),
  },
  {
    accessorKey: "in_status",
    header: (props) => (
      <TableColumnHeader column={props.column} title="In status" />
    ),
    cell: (props) => <Status cell={props} />,
  },
  {
    accessorKey: "out_status",
    header: (props) => (
      <TableColumnHeader column={props.column} title="Out status" />
    ),
    cell: (props) => <Status cell={props} />,
  },
];

export function PeerList(props: Props) {
  let persistantTableState = new PersistentTableState("peers");
  const data = createMemo(() => props.peers);
  const [rowSelection, setRowSelection] = createSignal({});
  const [columnVisibility, setColumnVisibility] = createSignal<VisibilityState>(
    persistantTableState.loadVisibilityState() ?? {},
  );
  const [columnFilters, setColumnFilters] = createSignal<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = createSignal<SortingState>([]);

  const table = createSolidTable({
    get data() {
      return data();
    },
    columns: COLUMNS,
    state: {
      get sorting() {
        return sorting();
      },
      get columnVisibility() {
        return columnVisibility();
      },
      get rowSelection() {
        return rowSelection();
      },
      get columnFilters() {
        return columnFilters();
      },
    },
    enableRowSelection: false,
    enableMultiRowSelection: false,
    enableMultiSort: false,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: (update) => {
      setColumnVisibility(update);
      persistantTableState.saveVisibilyState(columnVisibility());
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div class="w-full space-y-2.5">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <TextFieldRoot>
            <TextField
              type="text"
              placeholder="Filter ip..."
              class="h-8"
              value={
                (table.getColumn("addr")?.getFilterValue() as string) ?? ""
              }
              onInput={(e) =>
                table.getColumn("addr")?.setFilterValue(e.currentTarget.value)
              }
            />
          </TextFieldRoot>
        </div>
      </div>
      <div class="rounded-md border">
        <Table>
          <TableHeader>
            <For each={table.getHeaderGroups()}>
              {(headerGroup) => (
                <TableRow>
                  <For each={headerGroup.headers}>
                    {(header) => {
                      return (
                        <TableHead>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      );
                    }}
                  </For>
                </TableRow>
              )}
            </For>
          </TableHeader>
          <TableBody>
            <Show
              when={table.getRowModel().rows?.length}
              fallback={
                <TableRow>
                  <TableCell colSpan={COLUMNS.length} class="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              }
            >
              <For each={table.getRowModel().rows}>
                {(row) => (
                  <TableRow data-state={row.getIsSelected() && "selected"}>
                    <For each={row.getVisibleCells()}>
                      {(cell) => (
                        <TableCell>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      )}
                    </For>
                  </TableRow>
                )}
              </For>
            </Show>
          </TableBody>
        </Table>
      </div>
      <PaginationFooter table={table} />
    </div>
  );
}
