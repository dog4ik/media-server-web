import { createSignal, Show } from "solid-js";
import Modal from "../modals/Modal";
import { FilePicker } from "../FilePicker";
import { FiEdit2 } from "solid-icons/fi";

type FileInputProps = {
  value: string;
  onChange: (val: string) => void;
};

export default function FileInput(props: FileInputProps) {
  let [showModal, setShowModal] = createSignal(false);
  let modal: HTMLDialogElement;
  return (
    <>
      <Show when={showModal()}>
        <Modal ref={modal!} onClose={() => setShowModal(false)}>
          <FilePicker
            onSubmit={(val) => {
              props.onChange(val);
              modal.close();
            }}
            disallowFiles
            initialDir={props.value}
          />
        </Modal>
      </Show>
      <div class="flex items-center flex-1 justify-between gap-2 rounded-xl bg-neutral-800 p-1">
        <span>{props.value}</span>
        <button
          class="btn"
          onClick={() => {
            setShowModal(true);
            modal.showModal();
          }}
        >
          <FiEdit2 size={10} />
        </button>
      </div>
    </>
  );
}
