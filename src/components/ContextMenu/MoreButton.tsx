import { ParentProps, createUniqueId, onCleanup } from "solid-js";
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

const menuClass =
  "z-50 w-56 origin-top animate-menu-in rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md";

function closeWithTransition(el: HTMLElement) {
  if (!el.matches(":popover-open")) return;
  if (document.startViewTransition) {
    document.startViewTransition(() => el.hidePopover());
  } else {
    el.hidePopover();
  }
}

export function RecursiveRow(props: { title: string } & ParentProps) {
  let submenuId = createUniqueId();
  return (
    <li>
      <ExpandRow popoverTarget={submenuId}>{props.title}</ExpandRow>
      <ul
        id={submenuId}
        class={menuClass}
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
  let menuRef!: HTMLUListElement;
  let triggerRef!: HTMLButtonElement;
  let menuId = createUniqueId();

  // Manual popovers don't light-dismiss, so we wire it up ourselves while open.
  function onPointerDown(e: PointerEvent) {
    const target = e.target as Node;
    if (menuRef.contains(target) || triggerRef.contains(target)) return;
    closeWithTransition(menuRef);
  }
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") closeWithTransition(menuRef);
  }
  function onToggle(e: Event) {
    if ((e as ToggleEvent).newState === "open") {
      document.addEventListener("pointerdown", onPointerDown, true);
      document.addEventListener("keydown", onKeyDown, true);
    } else {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
    }
  }

  onCleanup(() => {
    document.removeEventListener("pointerdown", onPointerDown, true);
    document.removeEventListener("keydown", onKeyDown, true);
  });

  return (
    <div>
      <button
        ref={triggerRef}
        onClick={() =>
          menuRef.matches(":popover-open") ? closeWithTransition(menuRef) : menuRef.showPopover()
        }
        style={`
anchor-name: --${menuId};
`}
        class="flex cursor-pointer items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-none hover:text-secondary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <FiMoreVertical size={20} />
      </button>
      <ul
        id={menuId}
        ref={menuRef}
        popover="manual"
        on:toggle={onToggle}
        onClick={() => closeWithTransition(menuRef)}
        class={`${menuClass} [view-transition-name:context-menu]`}
        style={`
position-anchor: --${menuId};
position-area: right span-bottom;
position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline;
`}
      >
        {props.children}
      </ul>
    </div>
  );
}
