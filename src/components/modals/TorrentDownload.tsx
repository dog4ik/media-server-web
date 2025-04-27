import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Schemas } from "../../utils/serverApi";
import { TorrentDownloadSteps } from "../TorrentDownload";

type Props = {
  metadata_provider: Schemas["MetadataProvider"];
  metadata_id: string;
  content_type: Schemas["ContentType"];
  onClose: () => void;
  query: string;
  open: boolean;
};

export default function DownloadTorrentModal(props: Props) {
  return (
    <Dialog
      open={props.open}
      onOpenChange={(isOpen) => isOpen || props.onClose()}
    >
      <DialogContent class="h-3/4 w-2/3">
        <div class="h-full overflow-hidden">
          <DialogHeader>
            <DialogTitle>Download</DialogTitle>
          </DialogHeader>
          <TorrentDownloadSteps
            content_hint={{
              content_type: props.content_type,
              metadata_id: props.metadata_id,
              metadata_provider: props.metadata_provider,
            }}
            onClose={props.onClose}
            downloadQuery={props.query}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
