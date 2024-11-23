import { createEffect, createSignal, Show } from "solid-js";

type Props = {
  srcList: (string | undefined)[];
  class?: string;
  height: number;
  width: number;
  alt: string;
};

export default function FallbackImage(props: Props) {
  const [currentImage, setCurrentImage] = createSignal<string>();
  let sources = () => [...props.srcList, "/no-photo.png"];

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
    img.src = url;
    img.onload = () => {
      setCurrentImage(url);
    };
    img.onerror = () => {
      loadImage(index + 1);
    };
  }

  createEffect(() => {
    if (props.srcList) loadImage(0);
  });

  return (
      <Show
        when={currentImage()}
        fallback={
          <div
            style={{ height: `${props.height}px`, width: `${props.width}px` }}
          ></div>
        }
      >
        {(src) => (
          <img
            src={src()}
            height={props.height}
            width={props.width}
            alt={props.alt}
            class={`${props.class}`}
          />
        )}
      </Show>
  );
}
