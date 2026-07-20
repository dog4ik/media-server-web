import { createSignal, For, Match, Show, Switch } from "solid-js";
import { Link } from "@tanstack/solid-router";
import {
  type Column,
  type ColumnDef,
  type SortingState,
  createSolidTable,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
} from "@tanstack/solid-table";
import ArrowUpDown from "lucide-solid/icons/arrow-up-down";
import ArrowUp from "lucide-solid/icons/arrow-up";
import ArrowDown from "lucide-solid/icons/arrow-down";
import { FiX } from "solid-icons/fi";
import FallbackImage from "@/components/FallbackImage";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { cn } from "@/lib/cn";
import type { ExtendedListContent } from "@/lib/lists";
import { formatDuration } from "@/utils/formats";

type Props = {
  items: ExtendedListContent[];
  onRemove: (item: ExtendedListContent) => void;
};

function SortableHeader(props: { column: Column<ExtendedListContent, unknown>; title: string }) {
  return (
    <Button
      variant="ghost"
      class="-ml-3 h-8"
      onClick={() => props.column.toggleSorting(props.column.getIsSorted() === "asc")}
    >
      <span>{props.title}</span>
      <Switch fallback={<ArrowUpDown class="size-3.5" />}>
        <Match when={props.column.getIsSorted() === "asc"}>
          <ArrowUp class="size-3.5" />
        </Match>
        <Match when={props.column.getIsSorted() === "desc"}>
          <ArrowDown class="size-3.5" />
        </Match>
      </Switch>
    </Button>
  );
}

// Movies and episodes have a runtime; shows have season/episode counts instead
function detailsText(item: ExtendedListContent): string | undefined {
  if (item.runtime !== undefined) {
    return formatDuration(item.runtime);
  }
  if (item.seasonsCount !== undefined || item.episodesCount !== undefined) {
    let parts = [];
    if (item.seasonsCount !== undefined) {
      parts.push(`${item.seasonsCount} ${item.seasonsCount === 1 ? "season" : "seasons"}`);
    }
    if (item.episodesCount !== undefined) {
      parts.push(`${item.episodesCount} ${item.episodesCount === 1 ? "episode" : "episodes"}`);
    }
    return parts.join(" · ");
  }
}

// Columns hidden on small screens to keep the table usable on mobile
const COLUMN_CLASSES: Record<string, string> = {
  released: "hidden md:table-cell",
  details: "hidden sm:table-cell",
};

export function ListContentTable(props: Props) {
  let [sorting, setSorting] = createSignal<SortingState>([]);

  let columns: ColumnDef<ExtendedListContent>[] = [
    {
      id: "poster",
      enableSorting: false,
      header: () => <span class="sr-only">Poster</span>,
      cell: (cell) => (
        <Link
          class={cn(
            "relative block h-14 overflow-hidden rounded-md",
            cell.row.original.aspect === "video" ? "aspect-video" : "aspect-poster",
          )}
          {...cell.row.original.url}
        >
          <FallbackImage fluid alt={cell.row.original.title} srcList={cell.row.original.posters} />
        </Link>
      ),
    },
    {
      id: "title",
      accessorKey: "title",
      header: (header) => <SortableHeader column={header.column} title="Title" />,
      cell: (cell) => (
        <Link class="flex min-w-0 flex-col hover:underline" {...cell.row.original.url}>
          <span class="max-w-48 truncate font-medium sm:max-w-md" title={cell.row.original.title}>
            {cell.row.original.title}
          </span>
          <Show when={cell.row.original.subtitle}>
            <span class="text-muted-foreground truncate text-xs">{cell.row.original.subtitle}</span>
          </Show>
        </Link>
      ),
    },
    {
      id: "type",
      accessorKey: "typeLabel",
      header: (header) => <SortableHeader column={header.column} title="Type" />,
      cell: (cell) => <Badge variant="secondary">{cell.row.original.typeLabel}</Badge>,
    },
    {
      id: "released",
      accessorFn: (item) => item.releaseDate ?? "",
      header: (header) => <SortableHeader column={header.column} title="Released" />,
      cell: (cell) => (
        <span class="text-muted-foreground">
          {cell.row.original.releaseDate
            ? new Date(cell.row.original.releaseDate).toLocaleDateString()
            : "—"}
        </span>
      ),
    },
    {
      id: "details",
      enableSorting: false,
      header: () => <span class="text-sm font-medium">Details</span>,
      cell: (cell) => (
        <span class="text-muted-foreground">{detailsText(cell.row.original) ?? "—"}</span>
      ),
    },
    {
      id: "actions",
      enableSorting: false,
      header: () => <span class="sr-only">Actions</span>,
      cell: (cell) => (
        <Button
          variant="ghost"
          size="icon-sm"
          class="text-muted-foreground hover:text-destructive"
          title="Remove from list"
          onClick={() => props.onRemove(cell.row.original)}
        >
          <FiX size={18} />
        </Button>
      ),
    },
  ];

  let table = createSolidTable({
    get data() {
      return props.items;
    },
    columns,
    state: {
      get sorting() {
        return sorting();
      },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Table>
      <TableHeader>
        <For each={table.getHeaderGroups()}>
          {(headerGroup) => (
            <TableRow>
              <For each={headerGroup.headers}>
                {(header) => (
                  <TableHead class={COLUMN_CLASSES[header.column.id]}>
                    <Show when={!header.isPlaceholder}>
                      {(_) => flexRender(header.column.columnDef.header, header.getContext())}
                    </Show>
                  </TableHead>
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
                  <TableCell class={COLUMN_CLASSES[cell.column.id]}>
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
