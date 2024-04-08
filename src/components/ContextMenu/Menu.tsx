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
      class="flex cursor-pointer items-center rounded-md py-1 pl-2 hover:bg-neutral-700"
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
      popover
      class="m-0 w-60 select-none rounded-md bg-neutral-900"
      onClick={props.onClick}
      style={{ top: `${props.y}px`, left: `${props.x}px` }}
    >
      <ul
        ref={listRef!}
        class={
          props.scroll
            ? "scrollbar-thumb-white scrollbar-track-rounded-sm scrollbar-thumb-rounded-sm w-full overflow-y-auto"
            : "w-full"
        }
      >
        {props.children}
      </ul>
    </div>
  );
}
