import {
  ParentProps,
  createSignal,
  createUniqueId,
  onCleanup,
  onMount,
} from "solid-js";
import { MenuWrapper } from "./Menu";
import { FiMoreVertical } from "solid-icons/fi";

export default function MoreButton(props: ParentProps) {
  let [buttonBounds, setButtonBounds] = createSignal({ x: 0, y: 0 });
  let popoverId = createUniqueId();
  let popoverElement: HTMLDivElement;
  let popoverButton: HTMLButtonElement;
  let mainContainer: HTMLElement;

  let resizeObserver = new ResizeObserver((_) => handleResize());

  function handleResize() {
    popoverElement.hidePopover();
    let bounds = popoverButton.getBoundingClientRect();
    if (window.innerWidth < bounds.right + 240) {
      setButtonBounds({ x: bounds.x - 240, y: bounds.bottom });
    } else {
      setButtonBounds({ x: bounds.right, y: bounds.bottom });
    }
  }

  onMount(() => {
    popoverElement = document.getElementById(popoverId) as HTMLDivElement;
    mainContainer = document.querySelector("main")!;
    window.addEventListener("resize", handleResize);
    mainContainer.addEventListener("scroll", handleResize);
    resizeObserver.observe(popoverButton);
  });

  onCleanup(() => {
    window.removeEventListener("resize", handleResize);
    mainContainer.removeEventListener("scroll", handleResize);
    resizeObserver.unobserve(popoverButton);
    resizeObserver.disconnect();
  });

  return (
    <>
      <MenuWrapper
        onClick={() => {
          popoverElement.togglePopover(false);
        }}
        popoverId={popoverId}
        y={buttonBounds().y}
        x={buttonBounds().x}
      >
        {props.children}
      </MenuWrapper>
      <button
        // @ts-expect-error
        popovertarget={popoverId}
        ref={popoverButton!}
        class="hover:bg-neutral-600 p-1.5 rounded-full transition-colors"
      >
        <FiMoreVertical size={25} stroke="white" />
      </button>
    </>
  );
}
