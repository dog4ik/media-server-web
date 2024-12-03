import { ParentProps, createUniqueId } from "solid-js";
import { FiMoreVertical } from "solid-icons/fi";
import { ExpandRow } from "./Menu";
import { JSX } from "solid-js";

export type Row =
  | {
      onClick?: () => void;
      title: string;
    }
  | {
      custom: JSX.Element;
    }
  | {
      expanded: Row[];
      title: string;
    };

export function RecursiveRow(props: { title: string } & ParentProps) {
  let submenuId = createUniqueId();
  return (
    <li>
      <ExpandRow popoverTarget={submenuId}>{props.title}</ExpandRow>
      <ul
        id={submenuId}
        class={`w-60 bg-neutral-800`}
        style={`
position-anchor: --${submenuId};
position-area: right span-bottom;
position-try: position-area(left span-bottom), position-area(right span-top), position-area(left span-top);
`}
        popover
      >
        {props.children}
      </ul>
    </li>
  );
}

export default function MoreButton(props: ParentProps) {
  let menuRef: HTMLUListElement = {} as any;
  let menuId = createUniqueId();
  return (
    <div>
      <button
        popovertarget={menuId}
        style={`
anchor-name: --${menuId};
`}
        id="menu-btn"
        class="rounded-full p-1.5 transition-colors hover:bg-neutral-600/50"
      >
        <FiMoreVertical size={20} />
      </button>
      <ul
        id={menuId}
        ref={menuRef!}
        onClick={() => menuRef.togglePopover(false)}
        class="w-60 bg-neutral-800"
        style={`
position-anchor: --${menuId};
position-area: right span-bottom;
position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline;
`}
        popover
      >
        {props.children}
      </ul>
    </div>
  );
}
