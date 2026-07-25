import { For } from "solid-js";
import { RecursiveRow } from "@/components/ContextMenu/MoreButton";
import { MenuRow } from "@/components/ContextMenu/Menu";
import { queryApi, queryClient } from "@/utils/queryApi";
import { useNotifications } from "@/context/NotificationContext";
import type { Schemas } from "@/utils/serverApi";

type Props = {
  items: () => Schemas["ListItems"];
  onAdded?: (listName: string) => void;
};

function invalidateLists() {
  queryApi.invalidateQueries("get", "/api/lists");
  queryApi.invalidateQueries("get", "/api/lists/{id}/items");
}

/** "Add to list" submenu for card context menus */
export function AddToListMenu(props: Props) {
  let lists = queryApi.useQuery("get", "/api/lists");
  let notify = useNotifications();

  function onError(error: { message?: string }) {
    if (error.message?.includes("UNIQUE constraint")) {
      notify("Already in this list");
    } else {
      notify("Failed to add to the list");
    }
  }

  let addToWatchlist = queryApi.useMutation("post", "/api/lists/watchlist/add", () => ({
    onSuccess: () => props.onAdded?.(lists.latest()?.watch.name ?? "Watchlist"),
    onError,
    onSettled: invalidateLists,
  }));

  let addToSaved = queryApi.useMutation("post", "/api/lists/saved/add", () => ({
    onSuccess: () => props.onAdded?.(lists.latest()?.saved.name ?? "Saved"),
    onError,
    onSettled: invalidateLists,
  }));

  let addToList = queryApi.useMutation("post", "/api/lists/{id}/add", () => ({
    onError,
    onSettled: invalidateLists,
  }));

  return (
    <RecursiveRow title="Add to list">
      <MenuRow onClick={() => addToWatchlist.mutate({ body: props.items() })}>
        {lists.latest()?.watch.name ?? "Watchlist"}
      </MenuRow>
      <MenuRow onClick={() => addToSaved.mutate({ body: props.items() })}>
        {lists.latest()?.saved.name ?? "Saved"}
      </MenuRow>
      <For each={lists.latest()?.custom}>
        {(list) => (
          <MenuRow
            onClick={() =>
              addToList.mutate(
                { params: { path: { id: list.id } }, body: props.items() },
                { onSuccess: () => props.onAdded?.(list.name) },
              )
            }
          >
            {list.name}
          </MenuRow>
        )}
      </For>
    </RecursiveRow>
  );
}
