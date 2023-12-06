import { FiX } from "solid-icons/fi";
import { ParentProps, Ref, createUniqueId, onMount } from "solid-js";
import "./modal.module.css";

type Props = {
  ref: Ref<HTMLDialogElement>;
};

export default function Modal(props: ParentProps & Props) {
  let dialog: HTMLDialogElement | undefined = undefined;
  let id = createUniqueId();
  onMount(() => {
    dialog = document.querySelector(`dialog#${id}`) as HTMLDialogElement;
  });
  function closeDialog() {
    dialog?.close();
  }
  return (
    <dialog
      onClick={closeDialog}
      ref={props.ref}
      id={id}
      class="w-5/6 h-2/3 text-white bg-neutral-900 rounded-xl"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        class="w-full h-full bg-neutral-900 rounded-xl relative"
      >
        <button onClick={closeDialog} class="absolute top-5 right-5">
          <FiX size={25} stroke="white" />
        </button>
        {props.children}
      </div>
    </dialog>
  );
}
