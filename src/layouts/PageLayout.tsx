import { ParentProps, Show, createEffect, createSignal } from "solid-js";
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

export default function PageLayout(props: ParentProps) {
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
    <>
      <SideBar />
      <NavBar />
      <div ref={backdropElement!} class="absolute inset-0">
        <div class="size-full">
          <Show when={!backdropQuery.isSuccess}>
            <div
              ref={gradientElement!}
              class="h-full w-full object-cover transition-opacity"
            ></div>
          </Show>
          <Show when={backdropQuery.isSuccess}>
            <img
              ref={backdropElement!}
              src={backdropQuery.isSuccess ? backdropQuery.data.src : undefined}
              class={clsx(
                "h-full w-full object-cover",
                backdropQuery.isSuccess ? "block" : "hidden",
              )}
            />
          </Show>
          <div class="hover-hide bg-background/90 fixed inset-0" />
        </div>
      </div>
      <main class="relative z-10 flex min-h-screen w-full flex-col overflow-y-scroll rounded-md pt-16 text-white">
        {props.children}
      </main>
    </>
  );
}
