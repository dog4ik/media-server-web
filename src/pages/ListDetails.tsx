import { createSignal, ErrorBoundary, For, Show, Suspense } from "solid-js";
import { getRouteApi } from "@tanstack/solid-router";
import { queryApi } from "@/utils/queryApi";
import { errorBoundaryFallback } from "@/components/Error";
import promptConfirm from "@/components/modals/ConfirmationModal";
import { ListFormDialog } from "@/components/Lists/ListFormDialog";
import { ListHeader } from "@/components/Lists/ListHeader";
import { type ViewMode } from "@/components/Lists/ViewModeToggle";
import { ListContentTile, ListContentTileSkeleton } from "@/components/Lists/ListContentItem";
import { ListContentTable } from "@/components/Lists/ListContentTable";
import {
  extendListContent,
  invalidateListQueries,
  SAVED_LIST_ID,
  WATCH_LIST_ID,
  type ExtendedListContent,
} from "@/lib/lists";
import { Skeleton } from "@/ui/skeleton";
import tracing from "@/utils/tracing";

const route = getRouteApi("/page/lists/$id");

const VIEW_MODE_KEY = "lists.viewMode";

function initialViewMode(): ViewMode {
  return localStorage.getItem(VIEW_MODE_KEY) === "list" ? "list" : "grid";
}

export default function ListDetails() {
  let params = route.useParams();
  let navigate = route.useNavigate();
  let id = () => +params().id;

  let list = queryApi.useQuery("get", "/api/lists/{id}", () => ({
    params: { path: { id: id() } },
  }));
  let items = queryApi.useQuery(
    "get",
    "/api/lists/{id}/items",
    () => ({ params: { path: { id: id() } } }),
    () => ({ select: (items) => items.map((item) => extendListContent(item, id())) }),
  );
  let allLists = queryApi.useQuery("get", "/api/lists");

  let isSystem = () => id() === allLists.latest()?.watch.id || id() === allLists.latest()?.saved.id;

  // The export/import endpoints address the system lists by their static server-side ids
  let exportImportId = () => {
    if (id() === allLists.latest()?.watch.id) return WATCH_LIST_ID;
    if (id() === allLists.latest()?.saved.id) return SAVED_LIST_ID;
    return id();
  };

  let [mode, setModeRaw] = createSignal<ViewMode>(initialViewMode());
  function setMode(mode: ViewMode) {
    localStorage.setItem(VIEW_MODE_KEY, mode);
    setModeRaw(mode);
  }

  let [editOpen, setEditOpen] = createSignal(false);

  let removeItem = queryApi.useMutation("delete", "/api/lists/{id}/remove/{metadata_id}", () => ({
    onSettled: invalidateListQueries,
  }));

  let deleteList = queryApi.useMutation("delete", "/api/lists/{id}", () => ({
    onSuccess: () => {
      invalidateListQueries();
      navigate({ to: "/lists" });
    },
  }));

  async function handleRemove(item: ExtendedListContent) {
    if (item.metadataId === undefined) {
      tracing.warn({ title: item.title }, "List item is missing its local metadata id");
      return;
    }
    let metadataId = item.metadataId;
    if (await promptConfirm(`Remove "${item.title}" from ${list.latest()?.name ?? "this list"}?`)) {
      removeItem.mutate({
        params: { path: { id: id(), metadata_id: metadataId } },
      });
    }
  }

  async function handleDeleteList() {
    if (await promptConfirm(`Are you sure you want to delete "${list.latest()?.name}"?`)) {
      deleteList.mutate({ params: { path: { id: id() } } });
    }
  }

  return (
    <ErrorBoundary fallback={errorBoundaryFallback("Failed to fetch the list")}>
      <Show when={editOpen()}>
        <ListFormDialog open={editOpen()} list={list.latest()} onClose={() => setEditOpen(false)} />
      </Show>
      <ListHeader
        list={list.data}
        listId={exportImportId()}
        isSystem={isSystem()}
        mode={mode()}
        onModeChange={setMode}
        onEdit={() => setEditOpen(true)}
        onDelete={handleDeleteList}
      />
      <Suspense fallback={<ItemsSkeleton mode={mode()} />}>
        <Show
          when={items.data?.length}
          fallback={
            <div class="flex justify-center py-16">
              <span class="text-muted-foreground text-lg">This list is empty</span>
            </div>
          }
        >
          <Show
            when={mode() === "grid"}
            fallback={
              <div class="w-full p-2 sm:p-4">
                <ListContentTable items={items.data ?? []} onRemove={handleRemove} />
              </div>
            }
          >
            <div class="flex flex-wrap items-start gap-4 p-2 sm:gap-6 sm:p-4">
              <For each={items.data}>
                {(item) => <ListContentTile item={item} onRemove={() => handleRemove(item)} />}
              </For>
            </div>
          </Show>
        </Show>
      </Suspense>
    </ErrorBoundary>
  );
}

function ItemsSkeleton(props: { mode: ViewMode }) {
  return (
    <Show
      when={props.mode === "grid"}
      fallback={
        <div class="flex w-full flex-col gap-2 p-2 sm:p-4">
          {[...Array(6)].map(() => (
            <Skeleton class="h-16 rounded-md" />
          ))}
        </div>
      }
    >
      <div class="flex flex-wrap items-start gap-4 p-2 sm:gap-6 sm:p-4">
        {[...Array(6)].map((_, i) => (
          <ListContentTileSkeleton aspect={i % 3 === 2 ? "video" : "poster"} />
        ))}
      </div>
    </Show>
  );
}
