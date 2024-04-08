import { A, useLocation } from "@solidjs/router";
import {
  For,
  createSignal,
  createMemo,
  createEffect,
  ErrorBoundary,
} from "solid-js";
import { StatusIndicator } from "./ServerStatusIndicator";
import { FiArrowLeftCircle } from "solid-icons/fi";

export default function SideBar() {
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

  let idx = routes.findIndex(([, route]) => {
    if (pathname() == "/" && route == "/") {
      return true;
    } else if (route != "/") {
      return pathname().startsWith(route);
    }
    return false;
  });
  setCurrentIndex(idx);

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
    <div class="z-10 flex flex-col items-center justify-between rounded-md p-2">
      <nav class="relative my-auto flex flex-col rounded-md sm:justify-center">
        <div
          class={`absolute left-0 right-0 z-10 w-full rounded-md bg-white transition-all duration-200`}
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
                class={`z-10 flex-1 rounded-lg bg-transparent px-3 py-2 font-medium ${
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
      <div class="flex items-center justify-center">
        <ErrorBoundary
          fallback={
            <div class="flex items-center justify-center text-white">
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
