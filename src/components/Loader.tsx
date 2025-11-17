import tracing from "@/utils/tracing";
import { createSignal, onCleanup, ParentProps, Show, Suspense } from "solid-js";

type Props = {
  showDelay?: number;
  title?: string;
};

export default function Loader(props: Props) {
  let [show, setShow] = createSignal(props.showDelay ? false : true);
  tracing.debug(`Loading ${props.title}`);

  let timeout: ReturnType<typeof setTimeout> | undefined = undefined;
  if (props.showDelay !== undefined) {
    timeout = setTimeout(() => setShow(true), props.showDelay);
  }
  onCleanup(() => {
    if (timeout) {
      clearTimeout(timeout);
    }
  });

  return (
    <div class="flex size-full animate-ping items-center justify-center">
      <Show when={show()}>
        <img src="/monkaw.webp" height={60} width={60} />
      </Show>
    </div>
  );
}

type SuspenseLoaderProps = {
  name: string;
};

export function SuspenseLoader(props: SuspenseLoaderProps & ParentProps) {
  const start = performance.now();
  tracing.trace({ name: props.name, start }, "[Suspense] Mount start");
  onCleanup(() => {
    let end = performance.now();
    tracing.trace({ name: props.name, end }, "[Suspense] Mount end");
  });
  return (
    <Suspense fallback={<Loader title={props.name} showDelay={100} />}>
      {props.children}
    </Suspense>
  );
}
