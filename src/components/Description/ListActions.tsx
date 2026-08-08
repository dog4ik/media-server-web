import Check from "lucide-solid/icons/check";
import Clock from "lucide-solid/icons/clock";
import Heart from "lucide-solid/icons/heart";
import { Show } from "solid-js";
import Icon from "@/components/ui/Icon";
import { useNotifications } from "@/context/NotificationContext";
import { useListActions } from "@/lib/lists";
import type { Schemas } from "@/utils/serverApi";

type Props = {
  items: () => Schemas["ListItems"];
  /** Lists the item is already in, from its `local.lists` metadata */
  memberships?: Schemas["CompactList"][] | null;
  /** Local metadata id, required to remove the item from a list */
  metadataId?: number;
};

/** Watchlist / liked toggle buttons for the content description action row */
export function ListActions(props: Props) {
  let notify = useNotifications();
  let actions = useListActions({
    items: props.items,
    memberships: () => props.memberships,
    metadataId: () => props.metadataId,
    onAdded: (name) => notify(`Added to ${name}`),
    onRemoved: (name) => notify(`Removed from ${name}`),
  });

  return (
    <>
      <Icon
        tooltip={
          actions.inWatchlist()
            ? `Remove from ${actions.watchlistName()}`
            : `Add to ${actions.watchlistName()}`
        }
        onClick={actions.toggleWatchlist}
      >
        <Show when={actions.inWatchlist()} fallback={<Clock />}>
          <Check />
        </Show>
      </Icon>
      <Icon
        tooltip={
          actions.inSaved()
            ? `Remove from ${actions.savedName()}`
            : `Add to ${actions.savedName()}`
        }
        onClick={actions.toggleSaved}
      >
        <Heart
          class={actions.inSaved() ? "fill-pink-500 text-pink-500" : undefined}
        />
      </Icon>
    </>
  );
}
