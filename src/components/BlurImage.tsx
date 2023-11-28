import { createSignal, Show } from "solid-js";
type Props = {
  alt?: string;
  blurData: string;
  src: string;
};

export default function BlurImage(props: Props) {
  let [isLoaded, setIsLoaded] = createSignal(false);
  function onLoad() {
    setTimeout(() => {
      setIsLoaded(true);
    }, 200);
  }
  return (
    <div
      class={`${isLoaded() ? "blur-none" : "blur-sm"
        } transition-all w-full duration-200`}
    >
      <Show when={!isLoaded()}>
        <img
          class="w-full transition-all"
          src={`data:image/png;base64,${props.blurData}`}
        />
      </Show>
      <img
        class={isLoaded() ? "block" : "hidden"}
        src={props.src}
        alt={props.alt}
        loading="eager"
        onLoad={onLoad}
      />
    </div>
  );
}
