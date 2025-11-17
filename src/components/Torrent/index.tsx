import { Show } from "solid-js";

import { formatSize } from "@/utils/formats";

import { Schemas } from "@/utils/serverApi";
import { useTorrentContext } from "@/context/TorrentContext";
import { TorrentTable } from "./TorrentTable";
import { TorrentSide } from "./TorrentSide";

type TorrentFileProps = {
  idx: number;
  size: number;
  path: string;
  percent: number;
  priority: Schemas["Priority"];
  onPriorityUpdate: (newPriority: Schemas["Priority"]) => void;
};

export function BottomBar() {
  let { sessionStats } = useTorrentContext();
  return (
    <div class="flex w-full items-center gap-2 rounded-md border">
      <span>{formatSize(sessionStats().download_speed)}/s</span>
      <span>/</span>
      <span>{formatSize(sessionStats().upload_speed)}/s</span>
      <span>{sessionStats().connected_peers} connected peers</span>
    </div>
  );
}

export default function BitTorrentClient() {
  let { expandedTorrent } = useTorrentContext();
  return (
    <div class="bg-background container mx-auto h-5/6 p-4">
      <TorrentTable />
      <Show when={expandedTorrent()}>
        {(row) => <TorrentSide torrent={row()} />}
      </Show>
      <BottomBar />
    </div>
  );
}
