import { FiX } from "solid-icons/fi";
import { ParentProps, Ref, createUniqueId, onMount } from "solid-js";
import "./modal.module.css";

export type ModalProps = {
  ref: Ref<HTMLDialogElement>;
};

export default function Modal(props: ParentProps & ModalProps) {
  let dialog: HTMLDialogElement;
  let id = createUniqueId();
  onMount(() => {
    dialog = document.getElementById(id) as HTMLDialogElement;
  });
  function closeDialog() {
    dialog.close();
  }
  return (
    <dialog
      onMouseDown={closeDialog}
      ref={props.ref}
      id={id}
      class="h-2/3 w-5/6 rounded-xl bg-black text-white"
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        class="relative h-full w-full rounded-xl bg-black p-4"
      >
        <button onClick={closeDialog} class="absolute right-5 top-5">
          <FiX size={25} stroke="white" />
        </button>
        {props.children}
      </div>
    </dialog>
  );
}
