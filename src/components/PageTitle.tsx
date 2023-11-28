import { ParentProps } from "solid-js";
export default function PageTitle(props: ParentProps) {
  return <div class="text-white text-2xl px-10 py-5">{props.children}</div>;
}
