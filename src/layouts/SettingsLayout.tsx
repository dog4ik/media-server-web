import { createEffect, createSignal, For, ParentProps } from "solid-js";
import { Link, linkOptions, LinkOptions, useRouterState } from "@tanstack/solid-router";
import Settings2 from "lucide-solid/icons/settings-2";
import Palette from "lucide-solid/icons/palette";
import Activity from "lucide-solid/icons/activity";
import type { Component } from "solid-js";

type TabConfig = {
  options: LinkOptions;
  icon: Component<{ class?: string }>;
  label: string;
};

const TABS: TabConfig[] = [
  {
    options: linkOptions({ to: "/settings" }),
    icon: Settings2,
    label: "server settings",
  },
  {
    options: linkOptions({ to: "/settings/client" }),
    icon: Palette,
    label: "appearance",
  },
  {
    options: linkOptions({ to: "/settings/resources" }),
    icon: Activity,
    label: "resources",
  },
];

export function SettingsLayout(props: ParentProps) {
  let navRef: HTMLElement | undefined;
  let tabRefs: (HTMLAnchorElement | undefined)[] = [];
  let [indicator, setIndicator] = createSignal({ left: 0, width: 0 });

  let routerState = useRouterState();

  let activeIndex = () => {
    let pathname = routerState().location.pathname;
    return TABS.findIndex(({ options }) => pathname === (options as { to: string }).to);
  };

  createEffect(() => {
    let idx = activeIndex();
    let tab = tabRefs[idx];
    if (!tab || !navRef) return;
    let navLeft = navRef.getBoundingClientRect().left;
    let tabRect = tab.getBoundingClientRect();
    setIndicator({ left: tabRect.left - navLeft, width: tabRect.width });
  });

  return (
    <>
      <div class="flex w-full justify-center border-b border-border">
        <nav ref={navRef!} class="relative flex items-center">
          <For each={TABS}>
            {(tab, i) => (
              <Link
                ref={(el) => {
                  tabRefs[i()] = el;
                }}
                {...tab.options}
                activeOptions={{ exact: true }}
                class="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground"
              >
                <tab.icon class="size-3.5 shrink-0" />
                {tab.label}
              </Link>
            )}
          </For>
          <div
            class="absolute bottom-0 h-0.5 bg-primary transition-all duration-200"
            style={{ left: `${indicator().left}px`, width: `${indicator().width}px` }}
          />
        </nav>
      </div>
      {props.children}
    </>
  );
}
