import { A } from "@solidjs/router";
import clsx from "clsx";
import { FiX } from "solid-icons/fi";
import { createSignal, onMount, ParentProps, Show } from "solid-js";

function useClose(cb: () => void, time: number) {
  let [shouldAnimateOut, setShouldAnimateOut] = createSignal(false);
  let setClose = () => {
    setShouldAnimateOut(true);
    setTimeout(() => {
      cb();
    }, time);
  };
  return [shouldAnimateOut, setClose] as const;
}

function HrefWrapper(props: ParentProps & { url?: string; class?: string }) {
  return (
    <Show
      fallback={<span class={props.class}>{props.children}</span>}
      when={props.url}
    >
      {(url) => (
        <A class={clsx(props.class, "hover:underline")} href={url()}>
          {props.children}
        </A>
      )}
    </Show>
  );
}

export type NotificationProps = {
  message: string;
  subTitle?: string;
  contentUrl?: string;
  poster?: string;
  duration?: number;
  onUndo?: () => void;
};

const TIMELINE_KEYFRAMES: Keyframe[] = [{ width: "100%" }, { width: "0%" }];

const ANIMATION_DURATION = 5_000;

export default function Notification(
  props: NotificationProps & { onClose: () => void },
) {
  let [shouldAnimateOut, close] = useClose(props.onClose, 200);
  function handleHover() {
    animation.pause();
  }
  function handleResume() {
    animation.play();
  }
  let timeLine: HTMLDivElement;
  let animation: Animation;
  onMount(() => {
    animation = timeLine.animate(
      TIMELINE_KEYFRAMES,
      props.duration ?? ANIMATION_DURATION,
    );
    animation.addEventListener("finish", close);
  });

  return (
    <div
      onMouseEnter={handleHover}
      onMouseLeave={handleResume}
      class={`group relative w-96 max-w-xl bg-stone-800 transition-all duration-200 ${
        shouldAnimateOut() ? "translate-x-full" : "animate-fade-in"
      } flex items-center overflow-hidden rounded-lg`}
    >
      <div
        class="absolute bottom-0 left-0 right-0 h-0.5 w-0 bg-white"
        ref={timeLine!}
      ></div>
      <Show when={props.poster}>
        <img
          src={props.poster}
          alt="Search content poster"
          width={60}
          height={90}
          class="aspect-poster rounded-md object-cover"
        />
      </Show>
      <div class="flex flex-col gap-1 px-2 py-4">
        <p
          title={props.message}
          class="truncate break-all font-semibold text-white sm:text-xl"
        >
          {props.message}
        </p>
        <Show when={props.subTitle}>
          <HrefWrapper class="font-semibold text-white/70" url={props.contentUrl}>
            {props.subTitle}
          </HrefWrapper>
        </Show>
        <div
          class="absolute right-1 top-1 cursor-pointer p-1 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => close()}
        >
          <FiX size={25} class="stroke-white" />
        </div>
      </div>
      <div class="flex flex-1 justify-center">
        <Show when={props.onUndo}>
          {(cb) => (
            <button
              onClick={() => {
                cb()();
                close();
              }}
              class="justify-self-end rounded-sm border border-stone-600 px-3 py-1 font-semibold text-white transition-colors hover:bg-stone-600 sm:text-sm"
            >
              Undo
            </button>
          )}
        </Show>
      </div>
    </div>
  );
}
