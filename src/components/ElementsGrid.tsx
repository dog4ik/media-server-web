import clsx from "clsx";
import { ParentProps } from "solid-js";

type Props = {
  elementSize: number;
  class?: string;
};
export function ElementsGrid(props: ParentProps & Props) {
  return (
    <div
      style={{
        "grid-template-columns": `repeat(auto-fill, minmax(${props.elementSize}px, 1fr))`,
      }}
      class={clsx("grid place-items-center gap-10 p-4", props.class)}
    >
      {props.children}
    </div>
  );
}
