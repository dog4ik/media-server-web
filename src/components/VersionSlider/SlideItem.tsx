import { ParentProps } from "solid-js";

export default function SlideItem(props: ParentProps) {
  return <div class={"h-full w-full min-w-full"}>{props.children}</div>;
}
