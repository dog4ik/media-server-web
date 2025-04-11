import { ParentProps, Show, createEffect, createSignal } from "solid-js";
import { useBackdropContext } from "../context/BackdropContext";
import SideBar from "../components/SideBar";
import NavBar from "../components/NavBar";
import GlobalErrorBoundary from "@/pages/GlobalErrorBoundary";

const ANIMATION = {
  opacity: [0, 1],
};

const OPTIONS = {
  duration: 200,
  easing: "ease-in-out",
};

export default function PageLayout(props: ParentProps) {
  let [{ currentBackdrop }] = useBackdropContext();
  let backdropElement: HTMLImageElement = {} as any;
  let gradientElement: HTMLDivElement = {} as any;
  let [isLoaded, setIsLoaded] = createSignal(false);

  createEffect(() => {
    setIsLoaded(false);
    if (currentBackdrop()) {
      backdropElement.animate(ANIMATION, OPTIONS);
    } else {
      gradientElement.animate(ANIMATION, OPTIONS);
    }
  });

  return (
    <>
      <SideBar />
      <NavBar />
      <div ref={backdropElement!} class="absolute inset-0">
        <div class="size-full">
          <Show when={!currentBackdrop()}>
            <div
              ref={gradientElement!}
              class="h-full w-full object-cover transition-opacity"
            ></div>
          </Show>
          <Show when={currentBackdrop() || isLoaded()}>
            <img
              ref={backdropElement!}
              onLoad={() => setIsLoaded(true)}
              src={currentBackdrop()}
              class={`h-full w-full object-cover ${
                isLoaded() ? "block" : "hidden"
              }`}
            />
          </Show>
          <div class="hover-hide fixed inset-0 bg-background/90" />
        </div>
      </div>
      <main class="relative z-10 flex min-h-screen w-full flex-col overflow-y-scroll rounded-md pt-16 text-white">
        <GlobalErrorBoundary>{props.children}</GlobalErrorBoundary>
      </main>
    </>
  );
}
