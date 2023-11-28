import { A, useLocation } from "@solidjs/router";
import { For, createSignal, createMemo, createEffect, ErrorBoundary } from "solid-js";
import { StatusIndicator } from "./ServerStatusIndicator";

export default function NavBar() {
  let routes = [
    ["Home", "/"],
    ["Dashboard", "/dashboard"],
    ["Shows", "/shows"],
    ["Movies", "/movies"],
    ["Torrent", "/torrent"],
    ["Logs", "/logs"],
    ["Settings", "/settings"],
  ];

  let location = useLocation();
  const pathname = createMemo(() => location.pathname);
  let [currentIndex, setCurrentIndex] = createSignal(-1);

  createEffect(() => {
    let idx = routes.findIndex(([, route]) => {
      if (pathname() == "/" && route == "/") {
        return true;
      } else if (route != "/") {
        return pathname().startsWith(route);
      }
      return false;
    });
    setCurrentIndex(idx);
  });

  return (
    <div class="p-2 justify-between flex flex-col-reverse rounded-md items-center bg-neutral-700">
      <nav class="flex flex-col my-auto rounded-md relative sm:justify-center">
        <div
          class={`w-full bg-white rounded-md transition-all duration-200 absolute left-0 right-0`}
          style={{
            height: `${100 / routes.length}%`,
            top: `${(currentIndex() / routes.length) * 100}%`,
          }}
        />
        <For each={routes}>
          {([title, url], idx) => {
            let isActive = () => {
              return currentIndex() == idx();
            };
            return (
              <A
                href={url}
                class={`rounded-lg px-3 z-10 bg-transparent py-2 flex-1 font-medium ${
                  isActive()
                    ? "text-neutral-800"
                    : "text-white hover:text-neutral-200"
                }`}
              >
                {title}
              </A>
            );
          }}
        </For>
      </nav>
      <div class="flex justify-center items-center">
        <ErrorBoundary
          fallback={
            <div class="flex justify-center items-center text-white">
              <span class="text-center">No connection</span>
            </div>
          }
        >
          <StatusIndicator />
        </ErrorBoundary>
      </div>
    </div>
  );
}
