import Modal, { ModalProps } from "./Modal";

type Props = {
  video_id: string;
};

export function TranscodeModal(props: Props & ModalProps) {
  return (
    <Modal ref={props.ref}>
      <div>Wanna transcode?</div>
    </Modal>
  );
}
