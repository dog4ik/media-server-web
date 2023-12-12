import Modal from "../components/modals/Modal";

export default function Episode() {
  let dialog: HTMLDialogElement;
  return (
    <div>
      <button onClick={() => dialog.showModal()}>Open Modal</button>
      <Modal ref={dialog!}>
        <div class="w-full h-full flex justify-center items-center">Its me mario</div>
      </Modal>
    </div>
  );
}
