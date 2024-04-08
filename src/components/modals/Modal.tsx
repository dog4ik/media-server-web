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
      class="w-5/6 h-2/3 text-white bg-black rounded-xl"
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        class="w-full h-full p-4 bg-black rounded-xl relative"
      >
        <button onClick={closeDialog} class="absolute top-5 right-5">
          <FiX size={25} stroke="white" />
        </button>
        {props.children}
      </div>
    </dialog>
  );
}
