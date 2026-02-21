import { ParentProps, Show, createEffect } from "solid-js";
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
  return (
    <div class="">
      <BackdropFilling />
      <aside class="fixed inset-0 flex w-18 items-center">
        <SideBar />
      </aside>
      <div class="pl-32">
        <NavBar />
        <main class="mx-5 my-3 flex flex-col overflow-y-auto">
          {props.children}
        </main>
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
  );
}
