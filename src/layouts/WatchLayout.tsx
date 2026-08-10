import type { ParentProps } from "solid-js";

export default function WatchLayout(props: ParentProps) {
  return (
    <main data-no-scrollbar-gutter class="h-dvh overflow-hidden bg-black">
      {props.children}
    </main>
  );
}
