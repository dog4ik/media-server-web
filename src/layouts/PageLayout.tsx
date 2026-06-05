import { ParentProps, Show, createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { useRouter } from "@tanstack/solid-router";
import { useBackdropContext } from "../context/BackdropContext";
import SideBar from "../components/SideBar";
import NavBar from "../components/NavBar";
import clsx from "clsx";

const ANIMATION = {
  opacity: [0, 1],
};

const OPTIONS = {
  duration: 200,
  easing: "ease-in-out",
};

const NAVBAR_SCROLL_RANGE = 300;

export default function PageLayout(props: ParentProps) {
  let container: HTMLDivElement | undefined;
  let [scrollProgress, setScrollProgress] = createSignal(0);
  let router = useRouter();

  let updateProgress = () => {
    if (container) setScrollProgress(Math.min(container.scrollTop / NAVBAR_SCROLL_RANGE, 1));
  };

  onMount(() => {
    if (!container) return;
    container.addEventListener("scroll", updateProgress, { passive: true });
    // Scroll events don't fire on navigation, so also resync once the new route
    // is rendered.
    let unsubscribe = router.subscribe("onRendered", updateProgress);
    onCleanup(() => {
      container!.removeEventListener("scroll", updateProgress);
      unsubscribe();
    });
  });

  return (
    <div ref={container} class="h-screen overflow-y-auto [scrollbar-gutter:stable]">
      <BackdropFilling />
      <aside class="fixed inset-0 flex w-18 items-center">
        <SideBar />
      </aside>
      <div class="sticky top-0 z-30">
        <NavBar scrollProgress={scrollProgress()} />
      </div>
      <div class="pl-32">
        <main class="mx-5 my-3 flex flex-col">{props.children}</main>
      </div>
    </div>
  );
}

function BackdropFilling() {
  let [{ backdropQuery }] = useBackdropContext();
  let backdropElement: HTMLImageElement = {} as any;
  let gradientElement: HTMLDivElement = {} as any;

  createEffect(() => {
    if (backdropQuery.isSuccess) {
      backdropElement.animate(ANIMATION, OPTIONS);
    } else {
      gradientElement.animate(ANIMATION, OPTIONS);
    }
  });
  return (
    <div ref={backdropElement!} class="fixed inset-0 -z-10 size-full">
      <div class="size-full">
        <Show when={!backdropQuery.isSuccess}>
          <div ref={gradientElement!} class="h-full w-full object-cover transition-opacity"></div>
        </Show>
        <Show when={backdropQuery.isSuccess}>
          <img
            ref={backdropElement!}
            src={backdropQuery.isSuccess ? backdropQuery.data.src : undefined}
            class={clsx("h-full w-full object-cover", backdropQuery.isSuccess ? "block" : "hidden")}
          />
        </Show>
        <div class="hover-hide bg-background/90 fixed inset-0" />
      </div>
    </div>
  );
}
