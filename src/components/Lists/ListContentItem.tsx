import { Show } from "solid-js";
import { Link } from "@tanstack/solid-router";
import FallbackImage from "@/components/FallbackImage";
import MoreButton from "@/components/ContextMenu/MoreButton";
import { MenuRow } from "@/components/ContextMenu/Menu";
import { Badge } from "@/ui/badge";
import { Skeleton } from "@/ui/skeleton";
import { cn } from "@/lib/cn";
import type { ExtendedListContent } from "@/lib/lists";

type Props = {
  item: ExtendedListContent;
  onRemove: () => void;
};

export function ListContentTile(props: Props) {
  return (
    <div class="flex w-fit flex-col gap-2">
      <Link
        class={cn(
          "relative block overflow-hidden rounded-xl h-52 sm:h-72",
          props.item.aspect === "video" ? "aspect-video" : "aspect-poster",
        )}
        {...props.item.url}
      >
        <FallbackImage fluid alt={props.item.title} srcList={props.item.posters} />
        <Badge variant="secondary" class="absolute top-2 left-2 opacity-90">
          {props.item.typeLabel}
        </Badge>
      </Link>
      {/* w-0 + min-w-full keeps the caption from stretching the tile past the image */}
      <div class="flex w-0 min-w-full items-center justify-between gap-1">
        <div class="flex min-w-0 flex-col">
          <Link title={props.item.title} class="text-md truncate" {...props.item.url}>
            {props.item.title}
          </Link>
          <Show when={props.item.episode}>
            {(episode) => (
              <span class="text-muted-foreground truncate text-sm">
                <Link class="hover:underline" title={episode().showTitle} {...episode().showUrl}>
                  {episode().showTitle}
                </Link>
                {` · ${episode().numbering}`}
              </span>
            )}
          </Show>
        </div>
        <MoreButton>
          <MenuRow variant="destructive" onClick={props.onRemove}>
            Remove from list
          </MenuRow>
        </MoreButton>
      </div>
    </div>
  );
}

export function ListContentTileSkeleton(props: { aspect?: "poster" | "video" }) {
  return (
    <Skeleton
      class={cn(
        "rounded-xl h-52 sm:h-72",
        props.aspect === "video" ? "aspect-video" : "aspect-poster",
      )}
    />
  );
}
