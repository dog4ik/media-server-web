/* @refresh reload */
import { render } from "solid-js/web";

import "./index.css";
import { createRouter, RouterProvider } from "@tanstack/solid-router";
import { routeTree } from "./routes";

const root = document.getElementById("root");

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module "@tanstack/solid-router" {
  interface Register {
    router: typeof router;
  }
}

render(() => <RouterProvider router={router} />, root!);
