import { FiChevronDown } from "solid-icons/fi";
import { ParentProps, Show, createSignal, onCleanup, onMount } from "solid-js";
import { JSX } from "solid-js/h/jsx-runtime";

type Props = {
  value: string | number;
};

type OptionProps = {
  title: string | number;
  disabled?: boolean;
  onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent>;
};

export function Option(props: OptionProps) {
  return (
    <button
      disabled={props.disabled}
      onClick={(e) => !props.disabled && props.onClick && props.onClick(e)}
      class="w-full px-2 py-1 text-start hover:bg-neutral-300"
    >
      {props.title}
    </button>
  );
}

export default function Selection(props: ParentProps & Props) {
  let [isOpen, setIsOpen] = createSignal(false);
  let expandButton: HTMLButtonElement;

  let togglePopover = (force?: boolean) => {
    if (force !== undefined) {
      setIsOpen(force);
    } else {
      setIsOpen(!isOpen());
    }
  };

  let handleDocumentClick = (e: MouseEvent) => {
    let target = e.target as HTMLElement;
    if (!expandButton.contains(target)) {
      if (isOpen()) togglePopover(false);
    }
  };

  onMount(() => {
    document.addEventListener("click", handleDocumentClick);
  });
  onCleanup(() => {
    document.removeEventListener("click", handleDocumentClick);
  });

  return (
    <div class="relative min-w-60 rounded-md bg-white text-black">
      <button
        ref={expandButton!}
        onClick={() => togglePopover()}
        class="flex w-full justify-between px-2 py-1 text-start"
      >
        <span>{props.value}</span>
        <div>
          <FiChevronDown size={25} />
        </div>
      </button>
      <Show when={isOpen()}>
        <div class="absolute w-full translate-y-2 divide-y overflow-hidden rounded-md bg-white">
          {props.children}
        </div>
      </Show>
    </div>
  );
}
