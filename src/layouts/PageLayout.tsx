import {
  ErrorBoundary,
  ParentProps,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import { useRouter } from "@tanstack/solid-router";
import { useBackdropContext } from "../context/BackdropContext";
import SideBar from "../components/SideBar";
import NavBar from "../components/NavBar";
import { ErrorComponent } from "../components/Error";

const NAVBAR_SCROLL_RANGE = 300;

export default function PageLayout(props: ParentProps) {
  let [scrollProgress, setScrollProgress] = createSignal(0);
  let router = useRouter();

  let updateProgress = () => setScrollProgress(Math.min(window.scrollY / NAVBAR_SCROLL_RANGE, 1));

  onMount(() => {
    window.addEventListener("scroll", updateProgress, { passive: true });
    let unsubRendered = router.subscribe("onRendered", updateProgress);
    onCleanup(() => {
      window.removeEventListener("scroll", updateProgress);
      unsubRendered();
    });
  });

  return (
    <div class="min-h-dvh">
      <BackdropFilling />
      <aside class="fixed inset-0 hidden w-18 items-center md:flex">
        <SideBar />
      </aside>
      <div class="sticky top-0 z-30">
        <NavBar scrollProgress={scrollProgress()} />
      </div>
      <div class="md:pl-32">
        <main class="mx-4 my-3 flex flex-col sm:mx-5">
          <ErrorBoundary fallback={(err, reset) => <PageError err={err} reset={reset} />}>
            {props.children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

function PageError(props: { err: any; reset: () => void }) {
  let router = useRouter();
  // Solid's ErrorBoundary never resets itself. Mirror what TanStack's own
  // CatchBoundary does and clear the error once a navigation resolves, otherwise
  // the boundary would keep showing this page's error on every later route.
  onMount(() => onCleanup(router.subscribe("onResolved", props.reset)));
  return <ErrorComponent err={props.err} reset={props.reset} />;
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
