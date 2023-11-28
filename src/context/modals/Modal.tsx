import { FiX } from "solid-icons/fi";
import { ParentProps } from "solid-js";

type Props = {
  onClose: () => void;
};
export default function Modal(props: ParentProps & Props) {
  return (
    <div
      onClick={props.onClose}
      class="fixed inset-0 w-full h-full flex justify-center items-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        class="h-5/6 w-11/12 bg-neutral-800 rounded-xl relative"
      >
        <button onClick={props.onClose} class="absolute top-5 right-5">
          <FiX size={20} />
        </button>
        {props.children}
      </div>
    </div>
  );
}
