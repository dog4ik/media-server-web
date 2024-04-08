import { createSignal, onMount, Ref, Show } from "solid-js";
type Props = {
  alt?: string;
  ref?: Ref<HTMLDivElement>;
  class?: string;
  height: number;
  width: number;
  blurData?: string;
  src: string;
};

export default function BlurImage(props: Props) {
  let [isLoaded, setIsLoaded] = createSignal(false);
  let imgRef: HTMLImageElement;
  onMount(() => {
    setIsLoaded(imgRef.complete);
  });
  function onLoad() {
    setIsLoaded(true);
  }
  return (
    <div
      ref={props.ref}
      class={`${
        isLoaded() ? "blur-none" : "blur-sm"
      } overflow-hidden duration-1000 ${props.class ? props.class : ""}`}
    >
      <Show when={!isLoaded() && props.blurData}>
        <img
          height={props.height}
          width={props.width}
          class="w-full"
          src={props.blurData && `data:image/png;base64,${props.blurData}`}
        />
      </Show>
      <img
        class={isLoaded() ? "object-cover max-h-full max-w-full" : "hidden"}
        ref={imgRef!}
        src={props.src}
        alt={props.alt}
        height={props.height}
        width={props.width}
        loading="eager"
        onLoad={onLoad}
      />
    </div>
  );
}
