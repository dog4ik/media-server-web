import {
  type ColumnDef,
  createSolidTable,
  type ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  type Row,
  type RowSelectionState,
} from "@tanstack/solid-table";
import { createMemo, createSignal, For, Show } from "solid-js";
import type { BitField } from "@/lib/bitfield";
import { Button } from "@/ui/button";
import { Checkbox, CheckboxControl } from "@/ui/checkbox";
import { Progress } from "@/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/ui/table";
import { formatSize } from "@/utils/formats";
import { type Schemas, server } from "@/utils/serverApi";
import {
  buildFileTree,
  type Directory,
  type Entry,
  type File,
} from "@/utils/torrent_file_tree";
import { TableColumnHeader } from "./ColumnHeader";
import { DirectoryIcon, FileIcon } from "./EntryIcon";

const PRIORITY_OPTIONS: Schemas["Priority"][] = [
  "disabled",
  "low",
  "medium",
  "high",
];

type Props = {
  infoHash: string;
  downloadedPieces: BitField;
  files: Schemas["StateFile"][];
};

function createTanstackRowSelectionState(entries: Entry[]): RowSelectionState {
  function traverseTree(
    directory: Directory,
    path: number[],
    state: RowSelectionState,
  ) {
    for (let i = 0; i < directory.children.length; ++i) {
      let entry = directory.children[i];
      if (entry.kind === "directory") {
        traverseTree(entry, [...path, i], state);
      } else if (entry.priority !== "disabled") {
        state[[...path, i].join(".")] = true;
      }
    }
  }

  let state: RowSelectionState = {};
  for (let i = 0; i < entries.length; ++i) {
    let entry = entries[i];
    if (entry.kind === "directory") {
      traverseTree(entry, [i], state);
    } else if (entry.priority !== "disabled") {
      state[i] = true;
    }
  }
  return state;
}

export function FileList(props: Props) {
  let data = createMemo(() => buildFileTree(props.files));

  let [expanded, setExpanded] = createSignal<ExpandedState>({});
  let rowSelection = createMemo(() => createTanstackRowSelectionState(data()));

  function onPrioritySelectorChange(
    row: Row<Entry>,
    newPriority: Schemas["Priority"],
  ) {
    function collectDirFile(dir: Directory, files: File[]) {
      for (const entry of dir.children) {
        if (entry.kind === "file") {
          files.push(entry);
        } else {
          collectDirFile(entry, files);
        }
      }
    }

    if (row.original.kind === "file") {
      batchChangePirority([row.original], newPriority);
    } else {
      let files: File[] = [];
      collectDirFile(row.original, files);
      batchChangePirority(files, newPriority);
    }
  }

  let columns: ColumnDef<Entry>[] = [
    {
      accessorFn: (f) => f.path.at(-1)!,
      id: "path",
      header: (header) => (
        <>
          <TableColumnHeader title="Path" column={header.column} />
        </>
      ),
      cell: ({ row, getValue }) => (
        <div
          style={{
            "padding-left": `${row.depth * 2}rem`,
          }}
        >
          <div class="flex items-center gap-1">
            <Checkbox
              indeterminate={row.getIsSomeSelected()}
              checked={row.getIsSelected() || row.getIsAllSubRowsSelected()}
              onChange={(val) =>
                val
                  ? batchChangePirority([row.original], "medium")
                  : batchChangePirority([row.original], "disabled")
              }
              aria-label="Select all"
            >
              <CheckboxControl />
            </Checkbox>{" "}
            <Show
              when={row.getCanExpand()}
              fallback={
                <button type="button">
                  <FileIcon name={row.original.path.at(-1)!} />
                </button>
              }
            >
              <Button onClick={row.getToggleExpandedHandler()}>
                <DirectoryIcon expanded={row.getIsExpanded()} />
              </Button>
            </Show>{" "}
            {getValue<string>()}
          </div>
        </div>
      ),
      footer: (props) => props.column.id,
    },
    {
      accessorKey: "size",
      cell: (props) => (
        <div class="flex w-25 items-center">
          <span class="text-center">{formatSize(props.row.original.size)}</span>
        </div>
      ),
      header: (header) => (
        <TableColumnHeader title="Size" column={header.column} />
      ),
      footer: (props) => props.column.id,
    },
    {
      accessorKey: "priority",
      cell: (props) => (
        <div class="flex w-25 items-center">
          <Select
            class="w-full"
            options={PRIORITY_OPTIONS}
            onChange={(priority) =>
              priority !== null &&
              priority !== "mixed" &&
              onPrioritySelectorChange(props.row, priority)
            }
            value={props.row.original.priority}
            itemComponent={(props) => (
              <SelectItem class="capitalize" item={props.item}>
                {props.item.rawValue}
              </SelectItem>
            )}
          >
            <SelectTrigger>
              <SelectValue<string> class="capitalize">
                {(state) => state.selectedOption() ?? "mixed"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>
        </div>
      ),
      header: (header) => (
        <TableColumnHeader title="Priority" column={header.column} />
      ),
      footer: (props) => props.column.id,
    },
    {
      accessorFn: (entry) => `${entry.start_piece}..${entry.end_piece}`,
      id: "range",
      cell: (props) => (
        <div class="flex w-25 items-center">
          <span class="text-center capitalize">
            {props.row.original.start_piece}..={props.row.original.end_piece}
          </span>
        </div>
      ),
      header: (header) => (
        <TableColumnHeader title="Piece range" column={header.column} />
      ),
      enableSorting: false,
      footer: (props) => props.column.id,
    },
    {
      accessorFn: (entry) => {
        if (entry.kind === "file") {
          let totalPieces = entry.end_piece - entry.start_piece;
          let downloadedPieces = props.downloadedPieces.rangeCount(
            entry.start_piece,
            entry.end_piece,
          );
          if (downloadedPieces === 0) {
            return 0;
          } else {
            return (downloadedPieces / totalPieces) * 100;
          }
        } else {
          return 100;
        }
      },
      id: "progress",
      header: (props) => (
        <TableColumnHeader column={props.column} title="Progress" />
      ),
      cell: (props) => (
        <div class="flex w-25 items-center">
          <Progress value={props.getValue() as number}>
            <code class="text-center">{props.getValue() as number}%</code>
          </Progress>
        </div>
      ),
    },
  ];

  let table = createSolidTable({
    get data() {
      return data();
    },
    columns,
    state: {
      get expanded() {
        return expanded();
      },
      get rowSelection() {
        return rowSelection();
      },
    },
    onExpandedChange: setExpanded,
    getSubRows: (row) => ("children" in row ? row.children : undefined),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  function batchChangePirority(
    entries: Entry[],
    priority: Schemas["Priority"],
  ) {
    function collectIndexes(directory: Directory, files: number[]) {
      for (const entry of directory.children) {
        if (entry.kind === "file") {
          files.push(entry.index);
        } else {
          collectIndexes(entry, files);
        }
      }
    }
    let files: number[] = [];
    for (const entry of entries) {
      if (entry.kind === "file") {
        files.push(entry.index);
      } else {
        collectIndexes(entry, files);
      }
    }
    server.POST("/api/torrent/{info_hash}/files_priority", {
      body: {
        priority,
        files,
      },
      params: {
        path: {
          info_hash: props.infoHash,
        },
      },
    });
  }

  return (
    <Table>
      <TableHeader>
        <For each={table.getHeaderGroups()}>
          {(headerGroup) => (
            <TableRow>
              <For each={headerGroup.headers}>
                {(header) => (
                  <TableCell colSpan={header.colSpan}>
                    <Show when={!header.isPlaceholder}>
                      <div>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </div>
                    </Show>
                  </TableCell>
                )}
              </For>
            </TableRow>
          )}
        </For>
      </TableHeader>
      <TableBody>
        <For each={table.getRowModel().rows}>
          {(row) => (
            <TableRow>
              <For each={row.getVisibleCells()}>
                {(cell) => (
                  <TableCell>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                )}
              </For>
            </TableRow>
          )}
        </For>
      </TableBody>
    </Table>
  );
}
