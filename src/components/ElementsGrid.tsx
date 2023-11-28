import { ParentProps } from "solid-js";

type Props = {
  elementSize: number;
};
export default function ElementsGrid(props: ParentProps & Props) {
  return (
    <div
      style={{
        "grid-template-columns": `repeat(auto-fill, minmax(${props.elementSize}px, 1fr))`,
      }}
      class="grid place-items-center gap-10 p-4"
    >
      {props.children}
    </div>
  );
}
