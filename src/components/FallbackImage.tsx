import clsx from "clsx";
import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  Show,
} from "solid-js";
import { Skeleton } from "@/ui/skeleton";
import tracing from "@/utils/tracing";

type Props = {
  srcList: (string | undefined)[];
  class?: string;
  height?: number;
  width?: number;
  alt: string;
  fluid?: boolean;
};

// Prevent flicker when the image component remounts with the cached image
const GlobalImageCache: Set<string> = new Set();

export default function FallbackImage(props: Props) {
  let sources = createMemo<string[]>(
    () => [...props.srcList, "/no-photo.png"].filter(Boolean) as string[],
  );
  let cachedImage = sources().find((src) => GlobalImageCache.has(src));
  const [currentImage, setCurrentImage] = createSignal<string | undefined>(
    cachedImage,
  );
  const [loading, setLoading] = createSignal(cachedImage === undefined);
  let active = true;
  tracing.debug({ images: props.srcList }, "Mounted fallback image");

  function tryLoadImage(url: string) {
    return new Promise((res, rej) => {
      tracing.trace({ url, sources: sources() }, "Loading image");
      const img = new Image();
      img.onload = () => {
        setCurrentImage(url);
        GlobalImageCache.add(url);
        setLoading(false);
        res(undefined);
      };
      img.onerror = () => {
        if (!active) return;
        rej(undefined);
      };
      img.src = url;
      if (img.complete && img.naturalWidth !== 0) {
        setCurrentImage(url);
        setLoading(false);
        res(undefined);
      }
    });
  }

  async function loadImages() {
    for (let source of sources()) {
      try {
        if (active) {
          await tryLoadImage(source);
          return true;
        }
      } catch {
        tracing.warn({ source }, "Failed to load image");
      }
    }
    return false;
  }

  createEffect(() => {
    active = true;
    loadImages();
  });
  onCleanup(() => {
    active = false;
  });

  let sizeStyle = () =>
    !props.fluid && (props.height !== undefined || props.width !== undefined)
      ? { height: `${props.height}px`, width: `${props.width}px` }
      : undefined;

  // Solid control flow returns a function, which tanstack/solid-router `Link` mistakes
  // for a render prop.
  // Dev builds hide this behind the solid-refresh HMR memo.
  return (
    <div class="contents">
      <Show
        when={!loading() && currentImage()}
        fallback={
          <Skeleton
            class={clsx(
              (props.fluid || sizeStyle() === undefined) && "h-full w-full",
            )}
            style={sizeStyle()}
          />
        }
      >
        {(_) => (
          <img
            src={currentImage()}
            height={props.height}
            width={props.width}
            alt={props.alt}
            class={clsx(props.class, props.fluid && "size-full object-cover")}
            style={sizeStyle()}
          />
        )}
      </Show>
    </div>
  );
}
