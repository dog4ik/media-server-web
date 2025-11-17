import { Skeleton } from "@/ui/skeleton";
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

export default function FallbackImage(props: Props) {
  const [currentImage, setCurrentImage] = createSignal<string>();
  const [loading, setLoading] = createSignal(true);
  let sources = createMemo(() => [...props.srcList, "/no-photo.png"]);
  let active = true;

  function loadImage(index: number) {
    if (index === sources().length) {
      console.log("Failed to load any of image sources");
      return;
    }

    let url = sources()[index];
    if (url === undefined) {
      return loadImage(index + 1);
    }
    const img = new Image();
    img.onload = () => {
      setCurrentImage(url);
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
    setLoading(true);
    setCurrentImage(undefined);
    loadImage(0);

    // cleanup to prevent outdated image loads from overwriting
    onCleanup(() => {
      active = false;
    });
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
