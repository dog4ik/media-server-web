import { ParentProps, createUniqueId } from "solid-js";
import { JSX } from "solid-js/h/jsx-runtime";

type Props = {
  value: string | number;
};

type OptionProps = {
  disabled?: boolean;
  onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent>;
};

export function Option(props: OptionProps & ParentProps) {
  return (
    <li>
      <button
        disabled={props.disabled}
        onClick={(e) => !props.disabled && props.onClick && props.onClick(e)}
        class="w-full px-2 py-1 text-start hover:bg-neutral-300"
      >
        {props.children}
      </button>
    </li>
  );
}

export default function Selection(props: ParentProps & Props) {
  let popoverId = createUniqueId();

  let menu: HTMLUListElement;

  return (
    <div class="w-60">
      <button
        class="w-full rounded-lg bg-white px-2 py-1 text-start text-black hover:bg-neutral-300"
        style={`
anchor-name: --${popoverId};
`}
        popovertarget={popoverId}
      >
        {props.value}
      </button>
      <ul
        id={popoverId}
        class={`${popoverId} w-60 divide-y overflow-hidden rounded-lg`}
        style={`
position-anchor: --${popoverId};
inset-area: bottom span-all;
position-try-options: inset-area(top span-all);
`}
        ref={menu!}
        onClick={() => menu.togglePopover(false)}
        popover
      >
        {props.children}
      </ul>
    </div>
  );
}
