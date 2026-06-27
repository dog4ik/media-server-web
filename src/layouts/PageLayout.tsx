import { ParentProps, createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { useRouter } from "@tanstack/solid-router";
import { useBackdropContext } from "../context/BackdropContext";
import SideBar from "../components/SideBar";
import NavBar from "../components/NavBar";

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
      <aside class="fixed inset-0 hidden w-18 items-center md:flex">
        <SideBar />
      </aside>
      <div class="sticky top-0 z-30">
        <NavBar scrollProgress={scrollProgress()} />
      </div>
      <div class="md:pl-32">
        <main class="mx-4 my-3 flex flex-col sm:mx-5">{props.children}</main>
      </div>
    </div>
  );
}

function BackdropFilling() {
  let [{ backdropQuery }] = useBackdropContext();

  // The image element stays mounted and we only animate its opacity, so the
  // backdrop both fades in (when a new image finishes loading) and fades out
  // (when we leave a content page) instead of popping in/out.
  let visible = () => backdropQuery.isSuccess;

  // Keep the last loaded src painted through the fade-out so there's something to
  // fade. It's only swapped once the next image has fully loaded, so a backdrop
  // that's still loading never shows the previous page's image.
  let [shownSrc, setShownSrc] = createSignal<string>();
  createEffect(() => {
    if (backdropQuery.isSuccess && backdropQuery.data) {
      setShownSrc(backdropQuery.data.src);
    }
  });

  return (
    <div class="fixed inset-0 -z-10 size-full">
      <img
        src={shownSrc()}
        class="h-full w-full object-cover transition-opacity duration-300"
        classList={{ "opacity-100": visible(), "opacity-0": !visible() }}
      />
      <div class="hover-hide bg-background/90 fixed inset-0" />
    </div>
  );
}
