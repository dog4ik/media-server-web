import {
  ParentProps,
  createContext,
  createMemo,
  createSignal,
  onCleanup,
  useContext,
} from "solid-js";
import { Schemas, server } from "@/utils/serverApi";
import { createStore, produce, SetStoreFunction } from "solid-js/store";
import { useServerStatus } from "./ServerStatusContext";
import tracing from "@/utils/tracing";
import { hexHash } from "@/utils/formats";
import { ServerConnection } from "@/utils/serverStatus";
import {
  ColumnFiltersState,
  createSolidTable,
  ExpandedState,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  VisibilityState,
} from "@tanstack/solid-table";
import { TORRENT_TABLE_COLUMNS } from "@/components/Torrent/TorrentTable";
import { PersistentTableState } from "@/utils/persistent_table_state";

type TorrentContextType = ReturnType<typeof createTorrentContext>;

export const TorrentContext = createContext<TorrentContextType>();

export const useTorrentContext = () => useContext(TorrentContext)!;

export type FilterType = Schemas["DownloadState"]["type"] | "all";

function createTorrentContext(sessionState: TorrentStateManager) {
  tracing.debug("Creating torrent context");
  let [{ serverStatus }] = useServerStatus();

  function cleanup() {
    serverStatus.unsubscribeTorrents();
  }

  window.addEventListener("beforeunload", cleanup);

  onCleanup(() => {
    window.removeEventListener("beforeunload", cleanup);
    cleanup();
  });

  function torrentState(hash: string) {
    let torrent = sessionState.session.torrents[hash];
    if (torrent) {
      return torrent;
    }
  }

  function sessionStats() {
    return sessionState.session.session_stats;
  }

  let persintentVisibily = new PersistentTableState("torrent");
  let data = createMemo(() => Object.values(sessionState.session.torrents));
  const [rowSelection, setRowSelection] = createSignal({});
  const [columnVisibility, setColumnVisibility] = createSignal<VisibilityState>(
    persintentVisibily.loadVisibilityState() ?? {},
  );

  const [columnFilters, setColumnFilters] = createSignal<ColumnFiltersState>(
    [],
  );
  const [expanded, setExpanded] = createSignal<ExpandedState>({});
  const [sorting, setSorting] = createSignal<SortingState>([]);
  let table = createSolidTable({
    get data() {
      return data();
    },
    columns: TORRENT_TABLE_COLUMNS,
    state: {
      get sorting() {
        return sorting();
      },
      get columnVisibility() {
        return columnVisibility();
      },
      get rowSelection() {
        return rowSelection();
      },
      get columnFilters() {
        return columnFilters();
      },
      get expanded() {
        return expanded();
      },
    },
    enableRowSelection: true,
    enableMultiSort: false,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: (update) => {
      setColumnVisibility(update);
      persintentVisibily.saveVisibilyState(columnVisibility());
    },
    onExpandedChange: (newExpanded) => {
      const nextExpanded =
        typeof newExpanded === "function" ? newExpanded({}) : newExpanded;
      setExpanded(
        Object.keys(expanded())[0] === Object.keys(nextExpanded)[0]
          ? {}
          : nextExpanded,
      );
    },
    autoResetExpanded: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  function expandedTorrent() {
    let index = Object.keys(expanded()).at(0);
    if (index === undefined) return;
    return Object.values(sessionState.session.torrents)[+index];
  }

  function batchAction(action: Schemas["Action"], hashes: string[]) {
    server.POST("/api/torrent/batch_action", { body: { action, hashes } });
  }

  return {
    torrentState,
    sessionStats,
    expandedTorrent,
    table,
    batchAction,
  } as const;
}

type ContextProps = {
  sessionState: TorrentStateManager;
} & ParentProps;

export function TorrentProvider(props: ContextProps) {
  tracing.debug("Rendering torrent context provider");
  let context = createTorrentContext(props.sessionState);
  return (
    <TorrentContext.Provider value={context}>
      {props.children}
    </TorrentContext.Provider>
  );
}

type ManagerStateType = Omit<Schemas["SessionState"], "torrents"> & {
  torrents: Record<string, Schemas["TorrentState"]>;
};

export class TorrentStateManager {
  session: ManagerStateType;
  private setSession: SetStoreFunction<ManagerStateType>;
  constructor({ session_stats, torrents }: Schemas["SessionState"]) {
    tracing.debug("State manager constructor start");
    let [session, setSession] = createStore<ManagerStateType>(
      TorrentStateManager.intoManagerState({ session_stats, torrents }),
    );

    this.session = session;
    this.setSession = setSession;

    tracing.debug("State manager made session context");
  }

  static intoManagerState({
    session_stats,
    torrents,
  }: Schemas["SessionState"]): ManagerStateType {
    return {
      session_stats,
      torrents: torrents.reduce(
        (acc, n) => ((acc[n.info_hash] = n), acc),
        {} as Record<string, Schemas["TorrentState"]>,
      ),
    };
  }

  setTorrentHandler(serverConnection: ServerConnection) {
    serverConnection.setTorrentHandler(this.torrentProgressHandler.bind(this));
  }

  private torrentProgressHandler(
    progress: Schemas["Progress"] | Schemas["SessionState"],
  ) {
    if ("session_stats" in progress) {
      this.setSession(TorrentStateManager.intoManagerState(progress));
      return;
    }
    if (progress.session_update) {
      this.applySessionUpdate(progress.session_update);
    }
    this.setSession(
      "torrents",
      produce((map) =>
        TorrentStateManager.applyTorrentEvents(map, progress.changed_torrents),
      ),
    );
  }

  private static applyTorrentEvents(
    torrentMap: Record<string, Schemas["TorrentState"]>,
    changedTorrents: Schemas["TorrentUpdate"][],
  ) {
    for (let torrentUpdate of changedTorrents) {
      let hexInfoHash = hexHash(torrentUpdate.info_hash);
      let torrent = torrentMap[hexInfoHash];
      if (!torrent) {
        let [addEvent] = torrentUpdate.events.splice(0, 1);
        if (
          addEvent.event_kind === "session" &&
          addEvent.kind === "torrentadd"
        ) {
          torrent = addEvent.state;
          torrentMap[hexInfoHash] = torrent;
        } else {
          tracing.error(
            { info_hash: hexInfoHash },
            `Expected 'torrentadd' event, got ${addEvent.event_kind}`,
          );
          continue;
        }
      }

      let torrentHandler = new TorrentProgressHandler(torrent);
      torrent.upload_speed = torrentUpdate.upload_speed;
      torrent.download_speed = torrentUpdate.download_speed;
      torrent.state = torrentUpdate.state;
      torrent.percent =
        (torrentUpdate.total_downloaded / torrent.total_size) * 100;
      for (let event of torrentUpdate.events) {
        if (event.event_kind === "session") {
          if (event.kind === "torrentremove") {
            delete torrentMap[hexInfoHash];
            // NOTE: Having torrent added and removed in the same tick is not possible.
            // Consider switching to tick/subtick progress model so I don't even have to think about it.
            break;
          }
        }

        if (event.event_kind == "tracker") {
          torrentHandler.applyTrackerUpdate(event);
          continue;
        }
        if (event.event_kind == "peer") {
          torrentHandler.applyPeerUpdate(event);
          continue;
        }
        if (event.event_kind == "storagepiece") {
          torrentHandler.applyPieceUpdate(event);
          continue;
        }
        if (event.event_kind == "storagefile") {
          torrentHandler.applyFileUpdate(event);
          continue;
        }
      }
    }
  }

  private applySessionUpdate(update: Schemas["SessionUpdate"]) {
    this.setSession("session_stats", "connected_peers", update.connected_peers);
    this.setSession("session_stats", "download_speed", update.download_speed);
    this.setSession("session_stats", "upload_speed", update.upload_speed);
  }
}

class TorrentProgressHandler {
  constructor(private torrent: ManagerStateType["torrents"][string]) {}

  applyTrackerUpdate({ tracker_event, url }: Schemas["TrackerEvent"]) {
    let trackerIdx = this.torrent.trackers.findIndex((t) => t.url == url);
    if (trackerIdx == -1) {
      return tracing.warn({ url }, `Event for unhandled tracker`);
    }
    let tracker = this.torrent.trackers[trackerIdx];
    if (tracker_event.kind == "reannounce") {
      tracing.trace(
        { url },
        `Recieved reannounce event with new interval: ${tracker_event.interval.secs}`,
      );
      tracker.status = "working";
      tracker.announce_interval = tracker_event.interval;
    }
  }

  applyPeerUpdate({ peer_event, ip }: Schemas["PeerEvent"]) {
    if (peer_event.kind == "connect") {
      return this.torrent.peers.push(peer_event.state);
    }

    let peerIdx = this.torrent.peers.findIndex((p) => p.addr == ip);
    if (peerIdx == -1) {
      return tracing.error({ ip }, `Event for unhandled peer`);
    }

    if (peer_event.kind == "disconnect") {
      this.torrent.peers.splice(peerIdx, 1);
    }

    let peer = this.torrent.peers[peerIdx];
    if (peer_event.kind == "statupdate") {
      tracing.trace({ ip }, `Recieved stats update for peer`);
      peer.downloaded = peer_event.downloaded;
      peer.download_speed = peer_event.download_speed;
      peer.uploaded = peer_event.uploaded;
      peer.upload_speed = peer_event.upload_speed;
      peer.in_status.choked = peer_event.in_choked;
      peer.in_status.interested = peer_event.in_interested;
      peer.out_status.choked = peer_event.out_choked;
      peer.out_status.interested = peer_event.out_interested;
    }
  }

  applyPieceUpdate({ piece, piece_event }: Schemas["StoragePieceEvent"]) {
    tracing.warn("Storage pice events are not yet implemented");
  }

  applyFileUpdate({ idx, file_event }: Schemas["StorageFileEvent"]) {
    if (file_event.kind === "prioritychange") {
      tracing.trace(
        { priority: file_event.priority, file_idx: idx },
        `Priority change event`,
      );
      this.torrent.files[idx].priority = file_event.priority;
    }
  }
}
