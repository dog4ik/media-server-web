import { TorrentDownloadSteps } from "../components/TorrentDownload";

export default function Torrent() {
  return (
    <div class="h-full w-full">
      <TorrentDownloadSteps onClose={() => null} downloadQuery="arcane" />
    </div>
  );
}
