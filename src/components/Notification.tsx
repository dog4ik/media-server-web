import { Link, LinkOptions } from "@tanstack/solid-router";
import clsx from "clsx";
import { FiX } from "solid-icons/fi";
import { createSignal, onMount, ParentProps, Show } from "solid-js";
import { buttonVariants } from "@/ui/button";

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

function HrefWrapper(props: ParentProps & { url?: LinkOptions; class?: string }) {
  return (
    <Show fallback={<span class={props.class}>{props.children}</span>} when={props.url}>
      {(url) => (
        <Link class={clsx(props.class, "hover:underline")} {...url()}>
          {props.children}
        </Link>
      )}
    </Show>
  );
}

export type NotificationProps = {
  message: string;
  subTitle?: string;
  contentUrl?: LinkOptions;
  poster?: string;
  duration?: number;
  onUndo?: () => void;
};

const TIMELINE_KEYFRAMES: Keyframe[] = [{ width: "100%" }, { width: "0%" }];

const ANIMATION_DURATION = 5_000;

export default function Notification(props: NotificationProps & { onClose: () => void }) {
  let [shouldAnimateOut, close] = useClose(props.onClose, 200);
  function handleHover() {
    animation.pause();
  }
  function handleResume() {
    animation.play();
  }
  let timeLine: HTMLDivElement = {} as any;
  let animation: Animation;
  onMount(() => {
    animation = timeLine.animate(TIMELINE_KEYFRAMES, props.duration ?? ANIMATION_DURATION);
    animation.addEventListener("finish", close);
  });

  return (
    <div
      onMouseEnter={handleHover}
      onMouseLeave={handleResume}
      role="status"
      aria-live="polite"
      class={clsx(
        "group bg-popover text-popover-foreground relative flex w-96 max-w-xl items-stretch overflow-hidden rounded-lg border shadow-lg transition-all duration-200",
        shouldAnimateOut() ? "translate-x-full opacity-0" : "animate-fade-in",
      )}
    >
      <div class="bg-primary absolute right-0 bottom-0 left-0 z-10 h-0.5 w-0" ref={timeLine!}></div>
      <Show when={props.poster}>
        <img
          src={props.poster}
          alt="Search content poster"
          width={48}
          height={72}
          class="aspect-poster w-12 shrink-0 self-stretch object-cover"
        />
      </Show>
      <div class="flex min-w-0 flex-1 items-center gap-3 p-3">
        <div class="flex min-w-0 flex-1 flex-col gap-0.5 pr-5">
          <p title={props.message} class="truncate text-sm font-semibold">
            {props.message}
          </p>
          <Show when={props.subTitle}>
            <HrefWrapper class="text-muted-foreground truncate text-sm" url={props.contentUrl}>
              {props.subTitle}
            </HrefWrapper>
          </Show>
        </div>
        <Show when={props.onUndo}>
          {(cb) => (
            <button
              onClick={() => {
                cb()();
                close();
              }}
              class={clsx(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
            >
              Undo
            </button>
          )}
        </Show>
      </div>
      <button
        aria-label="Dismiss notification"
        onClick={() => close()}
        class={clsx(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100",
        )}
      >
        <FiX />
      </button>
    </div>
  );
}
