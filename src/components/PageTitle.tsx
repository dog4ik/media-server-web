import { ParentProps } from "solid-js";
export default function PageTitle(props: ParentProps) {
  return <div class="text-white text-2xl px-8 py-4">{props.children}</div>;
}
