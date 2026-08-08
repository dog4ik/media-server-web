import { useQuery } from "@tanstack/solid-query";
import { ErrorBoundary, Show, Suspense } from "solid-js";
import { errorBoundaryFallback } from "@/components/Error";
import {
  BitTorrentClient,
  BittorrentClientSkeleton,
} from "@/components/Torrent";
import { useServerStatus } from "@/context/ServerStatusContext";
import { TorrentProvider, TorrentStateManager } from "@/context/TorrentContext";

export default function Torrent() {
  let [{ serverStatus }] = useServerStatus();

  let torrentState = useQuery(() => ({
    queryFn: async () => {
      let sessionState = await serverStatus.subscribeTorrents();
      let manager = new TorrentStateManager(sessionState);
      manager.setTorrentHandler(serverStatus);
      return manager;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryKey: ["torrent_state"],
    retry: false,
  }));

  return (
    <ErrorBoundary
      fallback={errorBoundaryFallback("Failed to load bittorrent client")}
    >
      <Suspense fallback={<BittorrentClientSkeleton />}>
        <Show when={torrentState.data}>
          {(state) => (
            <TorrentProvider sessionState={state()}>
              <BitTorrentClient />
            </TorrentProvider>
          )}
        </Show>
      </Suspense>
    </ErrorBoundary>
  );
}
