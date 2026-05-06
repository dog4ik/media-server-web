import { createSignal, Show } from "solid-js";

import { formatSize } from "@/utils/formats";

import { useTorrentContext } from "@/context/TorrentContext";
import { TorrentTable } from "./TorrentTable";
import { TorrentSide } from "./TorrentSide";
import { Skeleton } from "@/ui/skeleton";

export function BottomBar() {
  let { sessionStats } = useTorrentContext();
  return (
    <div class="flex w-full shrink-0 items-center gap-2 border-t px-2 py-1 text-sm">
      <span>{formatSize(sessionStats().download_speed)}/s</span>
      <span>/</span>
      <span>{formatSize(sessionStats().upload_speed)}/s</span>
      <span>{sessionStats().connected_peers} connected peers</span>
    </div>
  );
}

export function BitTorrentClient() {
  let { expandedTorrent } = useTorrentContext();
  let [sideHeight, setSideHeight] = createSignal(250);
  let dividerRef: HTMLDivElement | undefined = undefined;

  function onPointerDown(e: PointerEvent) {
    e.preventDefault();
    dividerRef!.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (!dividerRef?.hasPointerCapture(e.pointerId)) return;
    setSideHeight((h) => Math.max(80, Math.min(window.innerHeight * 0.8, h - e.movementY)));
  }

  function onPointerUp(e: PointerEvent) {
    dividerRef?.releasePointerCapture(e.pointerId);
  }

  return (
    <div class="bg-background flex h-[calc(100vh-5.5rem)] flex-col overflow-hidden rounded-lg border">
      <div class="flex min-h-0 flex-1 flex-col px-4 pt-4">
        <TorrentTable />
      </div>
      <Show when={expandedTorrent()}>
        {(torrent) => (
          <>
            <div
              ref={dividerRef!}
              class="h-1.5 shrink-0 cursor-row-resize bg-border transition-colors hover:bg-primary active:bg-primary"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
            <div class="shrink-0 overflow-hidden" style={{ height: `${sideHeight()}px` }}>
              <TorrentSide torrent={torrent()} />
            </div>
          </>
        )}
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
