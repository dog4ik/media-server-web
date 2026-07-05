/* @refresh reload */
import { render } from "solid-js/web";

import { createRouter, RouterProvider } from "@tanstack/solid-router";
import { routeTree } from "./routes";
import { ErrorComponent } from "./components/Error";

const root = document.getElementById("root");

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 30_000,
  // Restore the document scroll position across navigations. Keying by pathname (not
  // the default per-history-entry key) means changing only the search params — e.g.
  // switching seasons on a show, which keeps the same pathname — preserves the current
  // scroll position instead of jumping to the top, while navigating to a different page
  // still starts at the top.
  scrollRestoration: true,
  getScrollRestorationKey: (location) => location.pathname,
  // Errors thrown by a page render via this component inside its parent layout's
  // <Outlet/> (so the sidebar/navbar stay visible), and TanStack's CatchBoundary
  // resets it automatically on navigation — keeping links usable after an error.
  defaultErrorComponent: ({ error, reset }) => <ErrorComponent err={error} reset={reset} />,
});

// Register the router instance for type safety
declare module "@tanstack/solid-router" {
  interface Register {
    router: typeof router;
  }
}

render(() => <RouterProvider router={router} />, root!);
