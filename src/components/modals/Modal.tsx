import { FiX } from "solid-icons/fi";
import { ParentProps, Ref, createUniqueId, onMount } from "solid-js";
import "./modal.module.css";

type ModalSize = "xl";

export type ModalProps = {
  ref: Ref<HTMLDialogElement>;
  onClose?: () => void;
  size?: ModalSize;
};

function modalSize(size?: ModalSize) {
  if (size == "xl") {
    return "w-5/6 h-5/6";
  }
  return "";
}

export default function Modal(props: ParentProps & ModalProps) {
  let dialog: HTMLDialogElement;
  let id = createUniqueId();
  onMount(() => {
    dialog = document.getElementById(id) as HTMLDialogElement;
  });
  return (
    <dialog
      onClose={() => props.onClose && props.onClose()}
      onMouseDown={() => dialog.close()}
      ref={props.ref}
      id={id}
      class={`rounded-xl bg-stone-800 text-white ${modalSize(props.size)}`}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        class="relative h-full w-full rounded-xl p-4"
      >
        <button onClick={() => dialog.close()} class="absolute right-5 top-5">
          <FiX size={25} stroke="white" />
        </button>
        {props.children}
      </div>
    </dialog>
  );
}
