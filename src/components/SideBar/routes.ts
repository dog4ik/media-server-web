import { linkOptions } from "@tanstack/solid-router";
import type { Component } from "solid-js";
import House from "lucide-solid/icons/house";
import LayoutDashboard from "lucide-solid/icons/layout-dashboard";
import Download from "lucide-solid/icons/download";
import Tv from "lucide-solid/icons/tv";
import Film from "lucide-solid/icons/film";
import Settings from "lucide-solid/icons/settings";
import History from "lucide-solid/icons/history";

export type NavRoute = {
  to: string;
  label: string;
  icon: Component<{ class?: string }>;
};

export const NAV_ROUTES: NavRoute[] = [
  { ...linkOptions({ to: "/" }), label: "Home", icon: House },
  { ...linkOptions({ to: "/dashboard" }), label: "Dashboard", icon: LayoutDashboard },
  { ...linkOptions({ to: "/torrent" }), label: "Torrent", icon: Download },
  { ...linkOptions({ to: "/shows" }), label: "Shows", icon: Tv },
  { ...linkOptions({ to: "/movies" }), label: "Movies", icon: Film },
  { ...linkOptions({ to: "/settings" }), label: "Settings", icon: Settings },
  { ...linkOptions({ to: "/history" }), label: "History", icon: History },
];

export function activeRouteIndex(pathname: string): number {
  return Math.max(
    NAV_ROUTES.findIndex(({ to }) => {
      if (pathname === "/" && to === "/") return true;
      if (to !== "/") return pathname.startsWith(to);
      return false;
    }),
    0,
  );
}
