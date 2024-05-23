import { FiArrowRight } from "solid-icons/fi";
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
};

export function MenuRow(props: RowProps & ParentProps) {
  return (
    <li
      class="flex w-full cursor-pointer items-center rounded-md py-1 pl-2 hover:bg-neutral-700"
      onClick={props.onClick}
    >
      <span class="pointer-events-none text-white">{props.children}</span>
    </li>
  );
}

type ExpandRowProps = {
  popoverTarget: string;
  onClick?: () => void;
};

export function ExpandRow(props: ExpandRowProps & ParentProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        props.onClick && props.onClick();
      }}
      popovertarget={props.popoverTarget}
      style={`
anchor-name: --${props.popoverTarget};
`}
      class="flex w-full cursor-pointer items-center justify-between rounded-md py-1 pl-2 hover:bg-neutral-700"
    >
      <span class="pointer-events-none text-white">{props.children}</span>
      <FiArrowRight size={20} class="stroke-white" />
    </button>
  );
}
