import Check from "lucide-solid/icons/check";
import Clock from "lucide-solid/icons/clock";
import Heart from "lucide-solid/icons/heart";
import ListVideo from "lucide-solid/icons/list-video";
import { type Component, For, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import { MenuRow } from "@/components/ContextMenu/Menu";
import { RecursiveRow } from "@/components/ContextMenu/MoreButton";
import { useListActions } from "@/lib/lists";
import type { Schemas } from "@/utils/serverApi";

type Props = {
  items: () => Schemas["ListItems"];
  /** Lists the item is already in, from its `local.lists` metadata */
  memberships?: () => Schemas["CompactList"][] | undefined | null;
  /** Local metadata id, required to remove the item from a list */
  metadataId?: () => number | undefined;
  onAdded?: (listName: string) => void;
  onRemoved?: (listName: string) => void;
};

type ListRowProps = {
  icon: Component<{ class?: string }>;
  name: string;
  inList?: boolean;
  onClick: () => void;
};

function ListRow(props: ListRowProps) {
  return (
    <MenuRow onClick={props.onClick}>
      <Dynamic
        component={props.icon}
        class="text-muted-foreground size-4 shrink-0"
      />
      <span class="flex-1 truncate text-left">{props.name}</span>
      <Show when={props.inList}>
        <Check class="size-4 shrink-0" />
      </Show>
    </MenuRow>
  );
}

/**
 * "Add to list" submenu for card context menus. Rows the item is already in are
 * marked with a check and clicking them removes the item (when it is local).
 */
export function AddToListMenu(props: Props) {
  let actions = useListActions({
    items: props.items,
    memberships: () => props.memberships?.(),
    metadataId: () => props.metadataId?.(),
    onAdded: (name) => props.onAdded?.(name),
    onRemoved: (name) => props.onRemoved?.(name),
  });

  return (
    <RecursiveRow title="Add to list">
      <ListRow
        icon={Clock}
        name={actions.watchlistName()}
        inList={actions.inWatchlist()}
        onClick={actions.toggleWatchlist}
      />
      <ListRow
        icon={Heart}
        name={actions.savedName()}
        inList={actions.inSaved()}
        onClick={actions.toggleSaved}
      />
      <For each={actions.lists.latest()?.custom}>
        {(list) => (
          <ListRow
            icon={ListVideo}
            name={list.name}
            inList={actions.inList(list.id)}
            onClick={() => actions.toggleList(list)}
          />
        )}
      </For>
    </RecursiveRow>
  );
}
