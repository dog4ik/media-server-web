import Modal from "./Modal";

type Props = {
  video_id: string;
};

export function TranscodeModal(props: Props) {
  let dialog: HTMLDialogElement;
  return (
    <Modal ref={dialog!}>
      <div></div>
    </Modal>
  );
}
