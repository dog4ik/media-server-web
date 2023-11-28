import Modal from "./Modal";

type Props = {
  video_id: string;
  onClose: () => void;
};

export function TranscodeModal(props: Props) {
  return (
    <Modal onClose={props.onClose}>
      <div></div>
    </Modal>
  );
}
