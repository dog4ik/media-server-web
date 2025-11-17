import type { DropdownMenuTriggerProps } from "@kobalte/core/dropdown-menu";
import type { SelectTriggerProps } from "@kobalte/core/select";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Checkbox, CheckboxControl } from "@/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { TextField, TextFieldRoot } from "@/ui/textfield";
import type { ColumnDef } from "@tanstack/solid-table";
import { flexRender } from "@tanstack/solid-table";
import { createMemo, For, Show } from "solid-js";
import { Schemas } from "@/utils/serverApi";
import RefreshCw from "lucide-solid/icons/refresh-cw";
import Play from "lucide-solid/icons/play";
import Pause from "lucide-solid/icons/pause";
import { formatSize } from "@/utils/formats";
import clsx from "clsx";
import { Progress } from "@/ui/progress";
import Eye from "lucide-solid/icons/eye";
import Funnel from "lucide-solid/icons/funnel";
import Trash from "lucide-solid/icons/trash";
import Ellipsis from "lucide-solid/icons/ellipsis";
import { TableColumnHeader } from "./ColumnHeader";
import { PaginationFooter } from "./TableFooter";
import { useTorrentContext } from "@/context/TorrentContext";

export const ICON_SIZE = 15;

function filteredStatusList() {
  return (
    [
      "paused",
      "pending",
      "error",
      "seeding",
      "validation",
    ] as Schemas["DownloadState"]["type"][]
  ).map((e) => ({
    title: e,
    value: e,
  }));
}

export const TORRENT_TABLE_COLUMNS: ColumnDef<Schemas["TorrentState"]>[] = [
  {
    accessorKey: "name",
    header: (props) => (
      <TableColumnHeader column={props.column} title="Title" />
    ),
    cell: (props) => (
      <div class="flex space-x-2">
        <span class="max-w-[250px] truncate font-medium">
          {props.row.getValue("name")}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "total_size",
    id: "total size",
    header: (props) => (
      <TableColumnHeader column={props.column} title="Total size" />
    ),
    cell: (props) => (
      <div class="flex w-[100px] items-center">
        <span class="text-center">
          {formatSize(props.row.original.total_size)}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "percent",
    id: "progress",
    header: (props) => (
      <TableColumnHeader column={props.column} title="Progress" />
    ),
    cell: (props) => (
      <div class="flex w-[100px] items-center">
        <Progress value={props.row.original.percent}>
          <code class="text-center">
            {props.row.original.percent.toFixed(1)}%
          </code>
        </Progress>
      </div>
    ),
  },
  {
    accessorKey: "status",
    id: "status",
    header: (props) => (
      <TableColumnHeader column={props.column} title="Status" />
    ),
    cell: (props) => (
      <div class="flex w-[100px] items-center">
        <Badge
          class={clsx(
            "text-white transition-colors",
            props.row.original.state.type == "pending" &&
              "bg-green-500 hover:bg-green-400",
            props.row.original.state.type == "seeding" &&
              "bg-sky-500 hover:bg-sky-400",
            props.row.original.state.type == "paused" &&
              "bg-neutral-500 hover:bg-neutral-400",
            props.row.original.state.type == "error" &&
              "bg-red-500 hover:bg-red-400",
            props.row.original.state.type == "validation" &&
              "bg-purple-500 hover:bg-purple-400",
          )}
        >
          {props.row.original.state.type}
        </Badge>
      </div>
    ),
    filterFn: (row, id, value) => {
      return Array.isArray(value) && value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "download_speed",
    id: "download speed",
    header: (props) => (
      <TableColumnHeader column={props.column} title="Download" />
    ),
    cell: (props) => (
      <div class="flex w-[100px] items-center">
        <span>{formatSize(props.row.original.download_speed)}/s</span>
      </div>
    ),
  },
  {
    accessorKey: "upload_speed",
    id: "upload speed",
    header: (props) => (
      <TableColumnHeader column={props.column} title="Upload" />
    ),
    cell: (props) => (
      <div class="flex w-[100px] items-center">
        <span>{formatSize(props.row.original.upload_speed)}/s</span>
      </div>
    ),
  },
  {
    accessorKey: "peers.length",
    id: "connected peers",
    header: (props) => (
      <TableColumnHeader column={props.column} title="Connected peers" />
    ),
    cell: (props) => (
      <div class="flex w-[100px] items-center">
        <span>{props.row.original.peers.length}</span>
      </div>
    ),
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu placement="bottom-end">
        <DropdownMenuTrigger class="flex items-center justify-center">
          <Ellipsis size={ICON_SIZE} />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export function TorrentTable() {
  let { table, batchAction } = useTorrentContext();
  function selectionBatchAction(action: Schemas["Action"]) {
    batchAction(
      action,
      table.getSelectedRowModel().rows.map((r) => r.original.info_hash),
    );
  }
  let isActionButtonsDisabled = createMemo(
    () => !table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected(),
  );
  return (
    <div class="w-full space-y-2.5">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <TextFieldRoot>
            <TextField
              type="text"
              placeholder="Filter torrents..."
              class="h-8"
              value={
                (table.getColumn("name")?.getFilterValue() as string) ?? ""
              }
              onInput={(e) =>
                table.getColumn("name")?.setFilterValue(e.currentTarget.value)
              }
            />
          </TextFieldRoot>
          <Button
            disabled={isActionButtonsDisabled()}
            onClick={() => selectionBatchAction("pause")}
            variant={"outline"}
            title="Pause"
            class="flex h-8 gap-1"
          >
            <Pause size={ICON_SIZE} />
          </Button>
          <Button
            disabled={isActionButtonsDisabled()}
            onClick={() => selectionBatchAction("resume")}
            variant={"outline"}
            title="Resume"
            class="flex h-8 gap-1"
          >
            <Play size={ICON_SIZE} />
          </Button>
          <Button
            disabled={isActionButtonsDisabled()}
            onClick={() => selectionBatchAction("abort")}
            variant={"destructive"}
            title="Delete"
            class="flex h-8 gap-1"
          >
            <Trash size={ICON_SIZE} />
          </Button>
          <Button
            disabled={isActionButtonsDisabled()}
            onClick={() => selectionBatchAction("validate")}
            variant={"outline"}
            title="Revalidate contents"
            class="flex h-8 gap-1"
          >
            <RefreshCw size={ICON_SIZE} />
          </Button>
        </div>
        <div class="flex items-center gap-2">
          <Select
            onChange={(e) => {
              table
                .getColumn("status")
                ?.setFilterValue(e.length ? e.map((v) => v.value) : undefined);
            }}
            placement="bottom-end"
            sameWidth={false}
            options={filteredStatusList()}
            optionValue="value"
            optionTextValue="title"
            multiple
            itemComponent={(props) => (
              <SelectItem item={props.item} class="capitalize">
                {props.item.rawValue.title}
              </SelectItem>
            )}
          >
            <SelectTrigger
              as={(props: SelectTriggerProps) => (
                <Button
                  {...props}
                  aria-label="Filter status"
                  variant="outline"
                  class="relative flex h-8 w-full gap-2 [&>svg]:hidden"
                >
                  <div class="flex items-center gap-1">
                    <Funnel size={ICON_SIZE} />
                    Status
                  </div>
                  <SelectValue<
                    ReturnType<typeof filteredStatusList>[0]
                  > class="flex h-full items-center gap-1">
                    {(state) => (
                      <Show
                        when={state.selectedOptions().length <= 2}
                        fallback={
                          <>
                            <Badge class="absolute -top-2 right-0 block size-4 rounded-full p-0 md:hidden">
                              {state.selectedOptions().length}
                            </Badge>
                            <Badge class="hidden px-1 py-0 capitalize md:inline-flex">
                              {state.selectedOptions().length} selected
                            </Badge>
                          </>
                        }
                      >
                        <For each={state.selectedOptions()}>
                          {(item) => (
                            <>
                              <Badge class="absolute -top-2 right-0 block size-4 rounded-full p-0 md:hidden">
                                {state.selectedOptions().length}
                              </Badge>
                              <Badge class="hidden px-1 py-0 capitalize md:inline-flex">
                                {item.title}
                              </Badge>
                            </>
                          )}
                        </For>
                      </Show>
                    )}
                  </SelectValue>
                </Button>
              )}
            />
            <SelectContent />
          </Select>
          <DropdownMenu placement="bottom-end">
            <DropdownMenuTrigger
              as={(props: DropdownMenuTriggerProps) => (
                <Button
                  {...props}
                  aria-label="Toggle columns"
                  variant="outline"
                  class="flex h-8 gap-1"
                >
                  <Eye size={ICON_SIZE} />
                  View
                </Button>
              )}
            />
            <DropdownMenuContent class="w-40">
              <DropdownMenuGroup>
                <DropdownMenuGroupLabel>Toggle columns</DropdownMenuGroupLabel>
                <DropdownMenuSeparator />
                <For
                  each={table
                    .getAllColumns()
                    .filter(
                      (column) =>
                        typeof column.accessorFn !== "undefined" &&
                        column.getCanHide(),
                    )}
                >
                  {(column) => (
                    <DropdownMenuCheckboxItem
                      class="capitalize"
                      checked={column.getIsVisible()}
                      onChange={(value) => column.toggleVisibility(value)}
                    >
                      <span class="truncate">{column.id}</span>
                    </DropdownMenuCheckboxItem>
                  )}
                </For>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div class="rounded-md border">
        <Table>
          <TableHeader>
            <For each={table.getHeaderGroups()}>
              {(headerGroup) => (
                <TableRow>
                  <For each={headerGroup.headers}>
                    {(header) => (
                      <TableHead>
                        <Show when={!header.isPlaceholder}>
                          {(_) =>
                            flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )
                          }
                        </Show>
                      </TableHead>
                    )}
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
                  <TableCell
                    colSpan={TORRENT_TABLE_COLUMNS.length}
                    class="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              }
            >
              <For each={table.getRowModel().rows}>
                {(row) => (
                  <TableRow
                    onClick={() => (
                      table.resetRowSelection(),
                      row.toggleSelected(),
                      row.toggleExpanded(true)
                    )}
                    data-state={row.getIsSelected() && "selected"}
                  >
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
