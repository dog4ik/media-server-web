import { ParentProps } from "solid-js";
export default function PageTitle(props: ParentProps) {
  return <div class="px-8 py-4 text-2xl text-white">{props.children}</div>;
}
