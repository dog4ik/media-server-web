import { ParentProps } from "solid-js";

export default function WatchLayout(props: ParentProps) {
  return <main class="min-h-screen">{props.children}</main>;
}
