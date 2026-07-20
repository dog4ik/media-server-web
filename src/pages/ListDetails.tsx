import { createSignal, ErrorBoundary, For, Show, Suspense } from "solid-js";
import { getRouteApi } from "@tanstack/solid-router";
import { queryApi, queryClient } from "@/utils/queryApi";
import { errorBoundaryFallback } from "@/components/Error";
import MoreButton from "@/components/ContextMenu/MoreButton";
import { MenuRow } from "@/components/ContextMenu/Menu";
import promptConfirm from "@/components/modals/ConfirmationModal";
import { ListFormDialog } from "@/components/Lists/ListFormDialog";
import { ViewModeToggle, type ViewMode } from "@/components/Lists/ViewModeToggle";
import { ListContentTile, ListContentTileSkeleton } from "@/components/Lists/ListContentItem";
import { ListContentTable } from "@/components/Lists/ListContentTable";
import { extendListContent, type ExtendedListContent } from "@/lib/lists";
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
    () => ({ select: (items) => items.map(extendListContent) }),
  );
  let allLists = queryApi.useQuery("get", "/api/lists");

  let isSystem = () => id() === allLists.latest()?.watch.id || id() === allLists.latest()?.saved.id;

  let [mode, setModeRaw] = createSignal<ViewMode>(initialViewMode());
  function setMode(mode: ViewMode) {
    localStorage.setItem(VIEW_MODE_KEY, mode);
    setModeRaw(mode);
  }

  let [editOpen, setEditOpen] = createSignal(false);

  let removeItem = queryApi.useMutation("delete", "/api/lists/{id}/remove/{metadata_id}", () => ({
    onSettled: () => {
      queryApi.invalidateQueries(queryClient, "get", "/api/lists/{id}/items");
      queryApi.invalidateQueries(queryClient, "get", "/api/lists/{id}");
      queryApi.invalidateQueries(queryClient, "get", "/api/lists");
    },
  }));

  let deleteList = queryApi.useMutation("delete", "/api/lists/{id}", () => ({
    onSuccess: () => {
      queryApi.invalidateQueries(queryClient, "get", "/api/lists");
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
      <div class="flex items-start justify-between gap-4 px-2 py-4 sm:px-8">
        <Suspense fallback={<ListHeaderSkeleton />}>
          <div class="min-w-0">
            <h1 class="truncate text-2xl text-white">{list.data?.name}</h1>
            <Show when={list.data?.description}>
              {(description) => (
                <p class="text-muted-foreground mt-1 line-clamp-2 text-sm">{description()}</p>
              )}
            </Show>
            <p class="text-muted-foreground mt-1 text-sm">
              {list.data?.size} {list.data?.size === 1 ? "item" : "items"}
            </p>
          </div>
        </Suspense>
        <div class="flex shrink-0 items-center gap-2">
          <ViewModeToggle mode={mode()} onChange={setMode} />
          <Show when={!isSystem()}>
            <MoreButton>
              <MenuRow onClick={() => setEditOpen(true)}>Edit list</MenuRow>
              <MenuRow variant="destructive" onClick={handleDeleteList}>
                Delete list
              </MenuRow>
            </MoreButton>
          </Show>
        </div>
      </div>
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
              <div class="max-w-6xl p-2 sm:p-4">
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

function ListHeaderSkeleton() {
  return (
    <div class="flex flex-col gap-2">
      <Skeleton class="h-7 w-48" />
      <Skeleton class="h-4 w-24" />
    </div>
  );
}

function ItemsSkeleton(props: { mode: ViewMode }) {
  return (
    <Show
      when={props.mode === "grid"}
      fallback={
        <div class="flex max-w-6xl flex-col gap-2 p-2 sm:p-4">
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
