import { Button } from "@/ui/button";
import { Schemas } from "@/utils/serverApi";
import { Link, LinkOptions } from "@tanstack/solid-router";
import { clsx } from "clsx";
import BookCheck from "lucide-solid/icons/book-check";
import Clock from "lucide-solid/icons/clock";
import Check from "lucide-solid/icons/check";
import Heart from "lucide-solid/icons/heart";
import { Show } from "solid-js";

type Props = {
  liked?: Schemas["CompactList"];
  onLike: () => void;
  watch?: Schemas["CompactList"];
  onMarkWatched: () => void;
  localLink?: LinkOptions;
};

export function ContentPosterIconSet(props: Props) {
  return (
    <div class="absolute top-1 right-1 flex gap-1 transition-opacity items-center justify-center">
      <Show when={props.localLink}>
        <Link
          {...props.localLink}
          title="In library"
          class="bg-secondary/50 hover:bg-secondary/40 p-1.5 rounded-md"
        >
          <BookCheck />
        </Link>
      </Show>

      <Button
        class={clsx(
          props.liked ? "block" : "hidden group-hover:block",
          "bg-secondary/50 hover:bg-secondary/40 group-hover:opacity-100",
        )}
        onClick={props.onMarkWatched}
        title={props.liked ? "In watchlist" : "Add to watchlist"}
        variant={"ghost"}
      >
        <Show when={props.watch} fallback={<Clock class="text-white" />}>
          <Check class="text-white" />
        </Show>
      </Button>

      <Button
        class={clsx(
          props.liked ? "block" : "hidden group-hover:block",
          "bg-secondary/50 hover:bg-secondary/40 group-hover:opacity-100",
        )}
        onClick={props.onLike}
        title={props.liked ? "In liked list" : "Add to liked"}
        variant={"ghost"}
      >
        <Heart class={clsx(props.liked && "fill-pink-500 text-pink-500", "text-white")} />
      </Button>
    </div>
  );
}
