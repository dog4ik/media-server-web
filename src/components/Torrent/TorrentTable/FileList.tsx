import { Schemas, server } from "@/utils/serverApi";

import {
  ExpandedState,
  createSolidTable,
  getCoreRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  ColumnDef,
  flexRender,
  Row,
  RowSelectionState,
} from "@tanstack/solid-table";
import {
  buildFileTree,
  Directory,
  Entry,
  File,
} from "@/utils/torrent_file_tree";
import { createMemo, createSignal, For, Show } from "solid-js";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { TableColumnHeader } from "./ColumnHeader";
import { FileIcon, DirectoryIcon } from "./EntryIcon";
import { formatSize } from "@/utils/formats";
import { Progress } from "@/ui/progress";
import { Checkbox, CheckboxControl } from "@/ui/checkbox";
import { Button } from "@/ui/button";

const PRIORITY_OPTIONS: Schemas["Priority"][] = [
  "disabled",
  "low",
  "medium",
  "high",
];

type Props = {
  infoHash: string;
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
      for (let entry of dir.children) {
        if (entry.kind == "file") {
          files.push(entry);
        } else {
          collectDirFile(entry, files);
        }
      }
    }

    if (row.original.kind == "file") {
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
                <button>
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
        <div class="flex w-[100px] items-center">
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
        <div class="flex w-[100px] items-center">
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
        <div class="flex w-[100px] items-center">
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
        return 100;
      },
      id: "progress",
      header: (props) => (
        <TableColumnHeader column={props.column} title="Progress" />
      ),
      cell: (props) => (
        <div class="flex w-[100px] items-center">
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
      for (let entry of directory.children) {
        if (entry.kind === "file") {
          files.push(entry.index);
        } else {
          collectIndexes(entry, files);
        }
      }
    }
    let files: number[] = [];
    for (let entry of entries) {
      if (entry.kind == "file") {
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
