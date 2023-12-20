import Modal, { ModalProps } from "./Modal";

type Props = {
  video_id: string;
};

export function TranscodeModal(props: Props & ModalProps) {
  return (
    <Modal ref={props.ref}>
      <form method="dialog">
        <div>Wanna transcode: {props.video_id}</div>
      </form>
    </Modal>
  );
}
