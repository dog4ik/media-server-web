import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import type { Schemas } from "../../utils/serverApi";
import { TorrentDownloadSteps } from "../TorrentDownload";

type Props = {
  metadata_provider: Schemas["MetadataProvider"];
  metadata_id: string;
  content_type: Schemas["ParentMediaType"];
  onClose: () => void;
  query: (provider: Schemas["TorrentIndexIdentifier"]) => string;
  open: boolean;
};

export default function DownloadTorrentModal(props: Props) {
  return (
    <Dialog
      open={props.open}
      onOpenChange={(isOpen) => isOpen || props.onClose()}
    >
      {/* DialogContent is `grid content-start`, so a lone auto row collapses to content
          height and `h-full` children can't fill the modal; force the row to span it */}
      <DialogContent class="grid-rows-[minmax(0,1fr)] sm:h-3/4 sm:w-2/3">
        <div class="flex min-h-0 min-w-0 flex-col gap-4 overflow-hidden">
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
