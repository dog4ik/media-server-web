import { Link, linkOptions, LinkOptions } from "@tanstack/solid-router";
import { ParentProps } from "solid-js";

function Tab(props: ParentProps & { options: LinkOptions }) {
  return (
    <Link
      {...props.options}
      activeOptions={{ exact: true }}
      class="text-foreground data-[status='active']:bg-accent dark:text-muted-foreground dark:data-selected:text-foreground peer relative z-10 inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color] focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
    >
      {props.children}
    </Link>
  );
}

export function SettingsLayout(props: ParentProps) {
  return (
    <>
      <div class="bg-secondary flex w-full gap-2">
        <Tab options={linkOptions({ to: "/settings" })}>Server settings</Tab>
        <Tab options={linkOptions({ to: "/settings/client" })}>Client settings</Tab>
        <Tab options={linkOptions({ to: "/settings/resources" })}>
          Server resources
        </Tab>
      </div>
      {props.children}
    </>
  );
}
