import clsx from "clsx";
import { ParentProps } from "solid-js";

type Props = {
  elementSize: number;
  mobileCols?: number;
  class?: string;
};

export function ElementsGrid(props: ParentProps & Props) {
  let cols = () => props.mobileCols ?? 2;
  // Max card width that still fits `cols` columns plus the gaps between them.
  let mobileCap = () => `calc((100% - ${cols() - 1} * 1rem) / ${cols()})`;
  return (
    <div
      style={{
        "grid-template-columns": `repeat(auto-fill, minmax(min(${props.elementSize}px, ${mobileCap()}), 1fr))`,
      }}
      class={clsx("grid gap-4 p-2 sm:gap-10 sm:p-4", props.class)}
    >
      {props.children}
    </div>
  );
}
