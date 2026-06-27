import { ParentProps } from "solid-js";
export default function PageTitle(props: ParentProps) {
  return <div class="px-2 py-4 text-2xl text-white sm:px-8">{props.children}</div>;
}
