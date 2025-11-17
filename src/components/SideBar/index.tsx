import { For, onMount } from "solid-js";
import Version from "./Version";
import { Link, linkOptions, useRouterState } from "@tanstack/solid-router";

const ROUTES = linkOptions([
  {
    to: "/",
    label: "Home",
  },
  {
    to: "/dashboard",
    label: "Dashboard",
  },
  {
    to: "/torrent",
    label: "Torrent",
  },
  {
    to: "/shows",
    label: "Shows",
  },
  {
    to: "/movies",
    label: "Movies",
  },
  {
    to: "/settings",
    label: "Settings",
  },
  {
    to: "/history",
    label: "History",
  },
]);

export default function SideBar() {
  let routerState = useRouterState();

  let currentIndex = () => {
    return Math.max(
      ROUTES.findIndex(({ to }) => {
        if (routerState().location.pathname == "/" && to == "/") {
          return true;
        } else if (to != "/") {
          return routerState().location.pathname.startsWith(to);
        }
        return false;
      }),
      0,
    );
  };

  return (
    <div class="hover-hide z-10 flex flex-col items-center justify-between rounded-md p-2">
      <nav class="relative my-auto flex flex-col rounded-md sm:justify-center">
        <div
          class={`absolute right-0 left-0 z-10 w-full rounded-md bg-white transition-all duration-200`}
          style={{
            height: `${100 / ROUTES.length}%`,
            top: `${(currentIndex() / ROUTES.length) * 100}%`,
          }}
        />
        <For each={ROUTES}>
          {(link, idx) => {
            let isActive = () => {
              return currentIndex() == idx();
            };
            return (
              <Link
                to={link.to}
                class={`z-10 flex-1 rounded-lg bg-transparent px-3 py-2 font-medium ${
                  isActive()
                    ? "text-neutral-800"
                    : "text-white hover:text-neutral-200"
                }`}
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
