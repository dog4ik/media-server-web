import { For, createSignal } from "solid-js";
import { Link, useRouterState } from "@tanstack/solid-router";
import Menu from "lucide-solid/icons/menu";
import { clsx } from "clsx";
import { Sheet, SheetContent, SheetTrigger } from "@/ui/sheet";
import { Button } from "@/ui/button";
import { NAV_ROUTES, activeRouteIndex } from "../SideBar/routes";
import Version from "../SideBar/Version";

export default function MobileNav() {
  let [open, setOpen] = createSignal(false);
  let routerState = useRouterState();
  let currentIndex = () => activeRouteIndex(routerState().location.pathname);

  return (
    <Sheet open={open()} onOpenChange={setOpen}>
      <SheetTrigger
        as={Button}
        variant="ghost"
        size="icon"
        class="md:hidden"
        aria-label="Open navigation menu"
      >
        <Menu class="size-6" />
      </SheetTrigger>
      <SheetContent
        side="left"
        class="bg-sidebar text-sidebar-foreground flex w-72 max-w-[80vw] flex-col gap-0 p-0"
      >
        <div class="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <img src="/logo.webp" alt="Provod logo" class="size-8 rounded-md" />
          <span class="text-lg font-semibold">Provod</span>
        </div>
        <nav class="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          <For each={NAV_ROUTES}>
            {(link, idx) => (
              <Link
                to={link.to}
                onClick={() => setOpen(false)}
                class={clsx(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-base font-medium transition-colors",
                  currentIndex() === idx()
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
              >
                <link.icon class="size-5 shrink-0" />
                {link.label}
              </Link>
            )}
          </For>
        </nav>
        <div class="flex flex-col gap-0.5 border-t border-white/10 px-5 py-4">
          <Version />
        </div>
      </SheetContent>
    </Sheet>
  );
}
