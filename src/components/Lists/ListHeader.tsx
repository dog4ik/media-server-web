import Download from "lucide-solid/icons/download";
import LoaderCircle from "lucide-solid/icons/loader-circle";
import Upload from "lucide-solid/icons/upload";
import { Show, Suspense } from "solid-js";
import { MenuRow } from "@/components/ContextMenu/Menu";
import MoreButton from "@/components/ContextMenu/MoreButton";
import {
  type ViewMode,
  ViewModeToggle,
} from "@/components/Lists/ViewModeToggle";
import { useNotifications } from "@/context/NotificationContext";
import { invalidateListQueries } from "@/lib/lists";
import { Button } from "@/ui/button";
import { Skeleton } from "@/ui/skeleton";
import { queryApi } from "@/utils/queryApi";
import type { Schemas } from "@/utils/serverApi";

type Props = {
  list: Schemas["List"] | undefined;
  /** Id used by the export/import endpoints (static system id for watchlist/saved) */
  listId: number;
  isSystem: boolean;
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  onEdit: () => void;
  onDelete: () => void;
};

function downloadJson(data: unknown, filename: string) {
  let blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ListHeader(props: Props) {
  let notify = useNotifications();
  let fileInput!: HTMLInputElement;

  let exportList = queryApi.useMutation("get", "/api/lists/{id}/export");
  let importList = queryApi.useMutation(
    "post",
    "/api/lists/{id}/import",
    () => ({
      onSettled: invalidateListQueries,
    }),
  );

  function handleExport() {
    exportList.mutate(
      { params: { path: { id: props.listId } } },
      {
        onSuccess: (items) => {
          // Match the file name the server suggests in its Content-Disposition header
          downloadJson(
            items,
            `exported_list_${props.list?.name ?? props.listId}.json`,
          );
        },
        onError: () => notify("Failed to export the list"),
      },
    );
  }

  async function handleImport(file: File) {
    let items: Schemas["ExportedGroupedItem"][];
    try {
      items = JSON.parse(await file.text());
    } catch {
      notify("Selected file is not valid JSON");
      return;
    }
    importList.mutate(
      { params: { path: { id: props.listId } }, body: items },
      {
        onSuccess: ({ count }) =>
          notify(`Imported ${count} ${count === 1 ? "item" : "items"}`),
        onError: () => notify("Failed to import the list"),
      },
    );
  }

  return (
    <div class="flex items-start justify-between gap-4 px-2 py-4 sm:px-8">
      <Suspense fallback={<ListHeaderSkeleton />}>
        <div class="min-w-0">
          <h1 class="truncate text-2xl text-white">{props.list?.name}</h1>
          <Show when={props.list?.description}>
            {(description) => (
              <p class="text-muted-foreground mt-1 line-clamp-2 text-sm">
                {description()}
              </p>
            )}
          </Show>
          <p class="text-muted-foreground mt-1 text-sm">
            {props.list?.size} {props.list?.size === 1 ? "item" : "items"}
          </p>
        </div>
      </Suspense>
      <div class="flex shrink-0 items-center gap-2">
        <input
          type="file"
          accept="application/json,.json"
          class="hidden"
          ref={fileInput}
          onChange={(e) => {
            let file = e.currentTarget.files?.item(0);
            e.currentTarget.value = "";
            if (file) handleImport(file);
          }}
        />
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={exportList.isPending}
        >
          <Show when={exportList.isPending} fallback={<Download />}>
            <LoaderCircle class="animate-spin" />
          </Show>
          <span class="hidden sm:inline">Export</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => fileInput.click()}
          disabled={importList.isPending}
        >
          <Show when={importList.isPending} fallback={<Upload />}>
            <LoaderCircle class="animate-spin" />
          </Show>
          <span class="hidden sm:inline">Import</span>
        </Button>
        <ViewModeToggle mode={props.mode} onChange={props.onModeChange} />
        <Show when={!props.isSystem}>
          <MoreButton>
            <MenuRow onClick={props.onEdit}>Edit list</MenuRow>
            <MenuRow variant="destructive" onClick={props.onDelete}>
              Delete list
            </MenuRow>
          </MoreButton>
        </Show>
      </div>
    </div>
  );
}

function ListHeaderSkeleton() {
  return (
    <div class="flex flex-col gap-2">
      <Skeleton class="h-7 w-48" />
      <Skeleton class="h-4 w-24" />
    </div>
  );
}
