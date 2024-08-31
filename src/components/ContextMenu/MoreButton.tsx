import { For, ParentProps, createUniqueId } from "solid-js";
import { FiMoreVertical } from "solid-icons/fi";
import { ExpandRow, MenuRow } from "./Menu";
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
inset-area: right span-bottom;
position-try-options: inset-area(left span-bottom), inset-area(right span-top), inset-area(left span-top);
`}
        popover
      >
        {props.children}
      </ul>
    </li>
  );
}

export default function MoreButton(props: ParentProps) {
  let menuRef: HTMLUListElement;
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
inset-area: right span-bottom;
position-try-options: inset-area(left span-bottom), inset-area(top span-right), inset-area(left span-top);
`}
        popover
      >
        {props.children}
      </ul>
    </div>
  );
}
