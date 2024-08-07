import { A, useLocation } from "@solidjs/router";
import { For, ErrorBoundary } from "solid-js";
import { StatusIndicator } from "./ServerStatusIndicator";

const ROUTES = [
  ["Home", "/"],
  ["Dashboard", "/dashboard"],
  ["Shows", "/shows"],
  ["Movies", "/movies"],
  ["Torrent", "/torrent"],
  ["Logs", "/logs"],
  ["Settings", "/settings"],
] as const;

export default function SideBar() {
  let location = useLocation();

  let currentIndex = () => {
    return Math.max(
      ROUTES.findIndex(([, route]) => {
        if (location.pathname == "/" && route == "/") {
          return true;
        } else if (route != "/") {
          return location.pathname.startsWith(route);
        }
        return false;
      }),
      0,
    );
  };

  return (
    <div class="z-10 flex flex-col items-center justify-between rounded-md p-2">
      <nav class="relative my-auto flex flex-col rounded-md sm:justify-center">
        <div
          class={`absolute left-0 right-0 z-10 w-full rounded-md bg-white transition-all duration-200`}
          style={{
            height: `${100 / ROUTES.length}%`,
            top: `${(currentIndex() / ROUTES.length) * 100}%`,
          }}
        />
        <For each={ROUTES}>
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
