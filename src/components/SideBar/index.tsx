import { For } from "solid-js";
import Version from "./Version";
import { Link, useRouterState } from "@tanstack/solid-router";
import { clsx } from "clsx";
import { NAV_ROUTES, activeRouteIndex } from "./routes";

export default function SideBar() {
  let routerState = useRouterState();

  let currentIndex = () => activeRouteIndex(routerState().location.pathname);

  return (
    <div class="hover-hide z-10 flex flex-col items-center justify-between rounded-md p-2">
      <nav class="relative my-auto flex flex-col rounded-md sm:justify-center">
        <div
          class={`bg-sidebar-accent absolute right-0 left-0 z-10 w-full rounded-md transition-all duration-200`}
          style={{
            height: `${100 / NAV_ROUTES.length}%`,
            top: `${(currentIndex() / NAV_ROUTES.length) * 100}%`,
          }}
        />
        <For each={NAV_ROUTES}>
          {(link, idx) => {
            let isActive = () => {
              return currentIndex() == idx();
            };
            return (
              <Link
                to={link.to}
                class={clsx(
                  "z-10 flex-1 rounded-lg px-3 py-2 font-medium",
                  isActive()
                    ? "text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          }}
        </For>
      </nav>
      <Version />
    </div>
  );
}
