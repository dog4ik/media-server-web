import { Button } from "@/ui/button";
import { Schemas } from "@/utils/serverApi";
import { Link, LinkOptions } from "@tanstack/solid-router";
import BookCheck from "lucide-solid/icons/book-check";
import Check from "lucide-solid/icons/check";
import Heart from "lucide-solid/icons/heart";
import { Show } from "solid-js";

type Props = {
  liked?: Schemas["CompactList"];
  onRemoveLike?: () => void;
  watch?: Schemas["CompactList"];
  onRemoveWatched?: () => void;
  localLink?: LinkOptions;
};

export function ContentPosterIconSet(props: Props) {
  return (
    <div class="absolute top-1 right-1 flex gap-1 items-center justify-center">
      <Show when={props.localLink}>
        <Link
          {...props.localLink}
          title="In library"
          class="bg-secondary/50 hover:bg-secondary/40 p-1.5 rounded-md"
        >
          <BookCheck />
        </Link>
      </Show>

      <Show when={props.watch}>
        <Button
          class="bg-secondary/50 hover:bg-secondary/40"
          onClick={props.onRemoveWatched}
          title="Remove from watchlist"
          variant={"ghost"}
        >
          <Check class="text-white" />
        </Button>
      </Show>

      <Show when={props.liked}>
        <Button
          class="bg-secondary/50 hover:bg-secondary/40"
          onClick={props.onRemoveLike}
          title="Remove from liked"
          variant={"ghost"}
        >
          <Heart class="fill-pink-500 text-pink-500" />
        </Button>
      </Show>
    </div>
  );
}
