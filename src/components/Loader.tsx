import { createSignal, onCleanup, Show } from "solid-js";

type Props = {
  time?: number;
};

export default function Loader(props: Props) {
  let time = () => props.time ?? 0;

  let [show, setShow] = createSignal(props.time ? false : true);
  let timeout = setTimeout(() => (props.time ? setShow(true) : null), time());
  onCleanup(() => clearTimeout(timeout));
  return (
    <Show when={show()}>
      <div class="flex size-full items-center justify-center">
        <img src="/monkaw.webp" height={60} width={60} />
      </div>
    </Show>
  );
}
