import { Schemas } from "../../utils/serverApi";
import Modal, { ModalProps } from "./Modal";
import { TorrentDownloadSteps } from "../TorrentDownload";

type Props = {
  metadata_provider: Schemas["MetadataProvider"];
  metadata_id: string;
  content_type: Schemas["ContentType"];
  onClose: () => void;
  query: string;
};

export default function DownloadTorrentModal(props: Props & ModalProps) {
  return (
    <Modal ref={props.ref}>
      <TorrentDownloadSteps
        content_hint={{
          content_type: props.content_type,
          metadata_id: props.metadata_id,
          metadata_provider: props.metadata_provider,
        }}
        onClose={props.onClose}
        downloadQuery={props.query}
      />
    </Modal>
  );
}
