import Loader from "@/components/Loader";
import BitTorrentClient from "@/components/Torrent";
import { useServerStatus } from "@/context/ServerStatusContext";
import { TorrentStateManager, TorrentProvider } from "@/context/TorrentContext";
import { useQuery } from "@tanstack/solid-query";
import { Suspense, Show } from "solid-js";

export default function Torrent() {
  let [{ serverStatus }] = useServerStatus();

  let torrentState = useQuery(() => ({
    queryFn: async () => {
      let sessionState = await serverStatus.subscribeTorrents();
      let manager = new TorrentStateManager(sessionState);
      manager.setTorrentHandler(serverStatus);
      return manager;
    },
    refetchOnMount: false,
    queryKey: ["torrent_state"],
  }));

  return (
    <div class="size-full">
      <Suspense fallback={<Loader showDelay={100} />}>
        <Show when={torrentState.data}>
          {(state) => (
            <TorrentProvider sessionState={state()}>
              <BitTorrentClient />
            </TorrentProvider>
          )}
        </Show>
      </Suspense>
    </div>
  );
}
