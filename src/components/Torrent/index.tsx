import { Show } from "solid-js";

import { formatSize } from "@/utils/formats";

import { useTorrentContext } from "@/context/TorrentContext";
import { TorrentTable } from "./TorrentTable";
import { TorrentSide } from "./TorrentSide";

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

export function BitTorrentClient() {
  let { expandedTorrent } = useTorrentContext();
  return (
    <>
      <TorrentTable />
      <Show when={expandedTorrent()}>
        {(row) => <TorrentSide torrent={row()} />}
      </Show>
      <BottomBar />
    </>
  );
}
