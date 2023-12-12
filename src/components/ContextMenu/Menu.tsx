import { ParentProps } from "solid-js";

type WrapperProps = {
  x: number;
  y: number;
  scroll?: boolean;
  popoverId: string;
  onClick?: () => void;
};

type RowProps = {
  onClick?: () => void;
  title: string;
};

export function MenuRow(props: RowProps) {
  return (
    <li
      class="flex cursor-pointer items-center rounded-md pl-2 py-1 hover:bg-neutral-700"
      onClick={props.onClick}
    >
      <span class="pointer-events-none text-white">{props.title}</span>
    </li>
  );
}

export function MenuWrapper(props: WrapperProps & ParentProps) {
  let listRef: HTMLUListElement;
  return (
    <div
      id={props.popoverId}
      // @ts-expect-error
      popover
      class="w-60 m-0 rounded-md bg-neutral-900"
      onClick={props.onClick}
      style={{ top: `${props.y}px`, left: `${props.x}px` }}
    >
      <ul
        ref={listRef!}
        class={
          props.scroll
            ? "overflow-y-auto scrollbar-thumb-white scrollbar-track-rounded-sm scrollbar-thumb-rounded-sm w-full"
            : "w-full"
        }
      >
        {props.children}
      </ul>
    </div>
  );
}
