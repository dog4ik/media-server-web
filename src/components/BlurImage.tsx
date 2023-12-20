import { createSignal, onMount, Ref, Show } from "solid-js";
type Props = {
  alt?: string;
  ref?: Ref<HTMLDivElement>;
  class?: string;
  viewTransitionName?: string;
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
      style={{ "view-transition-name": props.viewTransitionName }}
      class={`${
        isLoaded() ? "blur-none" : "blur-sm"
      } overflow-hidden w-full duration-1000 ${props.class}`}
    >
      <Show when={!isLoaded()}>
        <img
          height={props.height}
          width={props.width}
          class="w-full transition-all"
          src={props.blurData && `data:image/png;base64,${props.blurData}`}
        />
      </Show>
      <img
        class={isLoaded() ? "block" : "hidden"}
        ref={imgRef!}
        src={props.src}
        alt={props.alt}
        loading="eager"
        onLoad={onLoad}
      />
    </div>
  );
}
