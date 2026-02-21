import { Show } from "solid-js";

import { formatSize } from "@/utils/formats";

import { useTorrentContext } from "@/context/TorrentContext";
import { TorrentTable } from "./TorrentTable";
import { TorrentSide } from "./TorrentSide";
import { Skeleton } from "@/ui/skeleton";

export function BottomBar() {
  let { sessionStats } = useTorrentContext();
  return (
    <div class="flex w-full items-center gap-2">
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
    <div class="flex max-h-[calc(100vh-5.5rem)] flex-col gap-4">
      <TorrentTable />
      <Show when={expandedTorrent()}>
        {(row) => <TorrentSide torrent={row()} />}
      </Show>
      <BottomBar />
    </div>
  );
}

export function BittorrentClientSkeleton() {
  return (
    <div>
      <Skeleton class="h-20 w-20" />
    </div>
  );
}
