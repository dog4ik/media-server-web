import { Skeleton } from "@/ui/skeleton";
import tracing from "@/utils/tracing";
import clsx from "clsx";
import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  Show,
} from "solid-js";

type Props = {
  srcList: (string | undefined)[];
  class?: string;
  height: number;
  width: number;
  alt: string;
};

// Prevent flicker when the image component remounts with the cached image
const GlobalImageCache: Set<string> = new Set();

export default function FallbackImage(props: Props) {
  let firstImage = props.srcList.at(0);
  let isCached = GlobalImageCache.has(firstImage ?? "");
  const [currentImage, setCurrentImage] = createSignal<string | undefined>(
    firstImage,
  );
  const [loading, setLoading] = createSignal(!isCached);
  let sources = createMemo(() => [...props.srcList, "/no-photo.png"]);
  let active = true;
  tracing.debug({ images: props.srcList }, "Mounted fallback image");

  function loadImage(index: number) {
    if (index >= sources().length) {
      console.log("Failed to load any of image sources");
      return;
    }

    let url = sources()[index];
    if (url === undefined) {
      return loadImage(index + 1);
    }
    tracing.trace({ url, sources: sources() }, "Loading image");
    const img = new Image();
    img.onload = () => {
      setCurrentImage(url);
      GlobalImageCache.add(url);
      setLoading(false);
    };
    img.onerror = () => {
      if (!active) return;
      loadImage(index + 1);
    };
    img.src = url;
    if (img.complete && img.naturalWidth !== 0) {
      setCurrentImage(url);
      setLoading(false);
    }
  }

  createEffect(() => {
    active = true;
    loadImage(0);
  });
  onCleanup(() => {
    active = false;
  });

  return (
    <Show
      when={!loading() && currentImage()}
      fallback={
        <Skeleton
          style={{ height: `${props.height}px`, width: `${props.width}px` }}
        />
      }
    >
      {(_) => (
        <img
          src={currentImage()}
          height={props.height}
          width={props.width}
          alt={props.alt}
          class={clsx(props.class)}
          style={{ height: `${props.height}px`, width: `${props.width}px` }}
        />
      )}
    </Show>
  );
}
