import { createSignal, For, onCleanup, Show } from "solid-js";
import { Button } from "@/ui/button";
import { Progress } from "@/ui/progress";
import { Badge } from "@/ui/badge";

import { capitalize, formatSize, hexHash } from "@/utils/formats";

import Trash from "lucide-solid/icons/trash";
import Play from "lucide-solid/icons/play";
import Pause from "lucide-solid/icons/pause";
import ChevronUp from "lucide-solid/icons/chevron-up";
import ChevronDown from "lucide-solid/icons/chevron-down";
import Refresh from "lucide-solid/icons/refresh-cw";

import { revalidatePath, Schemas, server } from "@/utils/serverApi";
import { AddTorrentModal } from "./AddTorrentModal";
import { createStore, produce } from "solid-js/store";
import clsx from "clsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { PeersList } from "./PeerList";
import { TrackerList } from "./TrackerList";
import { FileTree } from "./FileTree";
import { useServerStatus } from "@/context/ServerStatusContext";
import { createAsync } from "@solidjs/router";
import tracing from "@/utils/tracing";
import { useNotificationsContext } from "@/context/NotificationContext";
import { notifyResponseErrors } from "@/utils/errors";

type TorrentStatus = Schemas["DownloadState"];

type FilterType = TorrentStatus["type"] | "all";

type TorrentFileProps = {
  idx: number;
  size: number;
  path: string;
  percent: number;
  priority: Schemas["Priority"];
  onPriorityUpdate: (newPriority: Schemas["Priority"]) => void;
};

function TorrentFile(props: TorrentFileProps) {
  return (
    <div class="flex items-center space-x-2">
      <div class="flex-grow">
        <p class="text-sm font-medium">{props.path}</p>
        <div class="flex items-center space-x-2">
          <Progress value={props.percent} class="h-2 flex-grow" />
          <span class="font-mono text-xs text-muted-foreground">
            {props.percent.toFixed(1)}%
          </span>
        </div>
      </div>
      <div class="text-xs text-muted-foreground">{formatSize(props.size)}</div>
      <Select
        options={["disabled", "low", "medium", "high"]}
        defaultValue={props.priority}
        value={props.priority}
        placeholder="Select priority"
        onChange={(p) => props.onPriorityUpdate(p ?? "disabled")}
        itemComponent={(p) => (
          <SelectItem item={p.item}>{capitalize(p.item.rawValue)}</SelectItem>
        )}
      >
        <SelectTrigger class="w-24">
          <SelectValue class="text-white">
            {capitalize(props.priority)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent />
      </Select>
    </div>
  );
}

function FilterButton<T extends FilterType>(props: {
  filter: T;
  onClick: (filter: T) => void;
  currentFilter: FilterType;
}) {
  let filter: () => string = () => {
    if (typeof props.filter == "object" && "error" in props.filter) {
      return "Error";
    }
    return capitalize(props.filter);
  };
  return (
    <Button
      variant={props.currentFilter == props.filter ? undefined : "outline"}
      onClick={() => props.onClick(props.filter)}
    >
      {filter()}
    </Button>
  );
}

type TorrentProps = {
  onRemove: (hash: string) => void;
  isExpanded: boolean;
  hash: string;
  name: string;
  id: string;
  percent: number;
  downloadSpeed: number;
  uploadSpeed: number;
  size: number;
  peers: Schemas["StatePeer"][];
  trackers: Schemas["StateTracker"][];
  status: Schemas["DownloadState"];
  files: Schemas["StateFile"][];
  pieces: boolean[];
  onExpand: (id: string) => void;
};

function Torrent(props: TorrentProps) {
  let [, { addNotification }] = useNotificationsContext();
  function handlePriorityUpdate(idx: number, priority: Schemas["Priority"]) {
    server
      .POST("/api/torrent/{info_hash}/file_priority", {
        params: { path: { info_hash: props.hash } },
        body: {
          file: idx,
          priority,
        },
      })
      .then(notifyResponseErrors(addNotification, "change file priority"));
  }

  function handleRevalidate() {
    server
      .POST("/api/torrent/{info_hash}/validate", {
        params: { path: { info_hash: props.hash } },
      })
      .then(notifyResponseErrors(addNotification, "start torrent validation"));
  }

  function fileProgress(file: Schemas["StateFile"]) {
    let length = file.end_piece - file.start_piece + 1;
    let have = props.pieces
      .slice(file.start_piece, file.end_piece + 1)
      .reduce((acc, n) => (n ? acc + 1 : acc), 0);
    return (have / length) * 100;
  }

  return (
    <div class="border-b last:border-b-0">
      <button
        class="flex w-full cursor-pointer items-center justify-between p-4"
        onClick={() => props.onExpand(props.id)}
      >
        <div class="flex-grow">
          <div class="mb-2 flex items-center justify-between">
            <h3 class="font-semibold">{props.name}</h3>
            <Badge
              class={clsx(
                "text-white",
                props.status.type == "pending" && "bg-green-500",
                props.status.type == "seeding" && "bg-sky-500",
                props.status.type == "paused" && "bg-neutral-500",
                props.status.type == "error" && "bg-red-500",
                props.status.type == "validation" && "bg-purple-500",
              )}
            >
              {props.status.type}
            </Badge>
          </div>
          <Progress value={props.percent} class="h-2" />
        </div>
        <Show when={props.isExpanded} fallback={<ChevronDown class="ml-2" />}>
          <ChevronUp class="ml-2" />
        </Show>
      </button>
      <Show when={props.isExpanded}>
        <div class="bg-muted p-4">
          <div class="mb-4 grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-muted-foreground">Download Speed</p>
              <p class="font-medium">{formatSize(props.downloadSpeed)} /s</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Upload Speed</p>
              <p class="font-medium">{formatSize(props.uploadSpeed)} /s</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Peers</p>
              <p class="font-medium">{props.peers.length}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Size</p>
              <p class="font-medium">{formatSize(props.size)}</p>
            </div>
          </div>
          <div class="flex space-x-2">
            <Show
              when={props.status.type == "paused"}
              fallback={
                <Button size="sm">
                  <Pause class="mr-2 h-4 w-4" /> Pause
                </Button>
              }
            >
              <Button size="sm">
                <Play class="mr-2 h-4 w-4" /> Resume
              </Button>
            </Show>
            <Button
              onClick={handleRevalidate}
              disabled={props.status.type == "validation"}
              size="sm"
            >
              <Refresh class="mr-2 h-4 w-4" /> Revalidate contents
            </Button>
            <Button
              onClick={() => props.onRemove(props.hash)}
              size="sm"
              variant="destructive"
            >
              <Trash class="mr-2 h-4 w-4" /> Remove
            </Button>
          </div>
          <div class="space-y-2">
            <h4 class="font-semibold">Files</h4>
            <FileTree
              onPriorityChange={handlePriorityUpdate}
              fileProgress={fileProgress}
              files={props.files}
            />
          </div>
          <div class="space-y-2">
            <h4 class="font-semibold">Peers</h4>
            <PeersList peers={props.peers} />
          </div>
          <div class="space-y-2">
            <h4 class="font-semibold">Trackers</h4>
            <TrackerList trackers={props.trackers} />
          </div>
        </div>
      </Show>
    </div>
  );
}

export default function BitTorrentClient() {
  let [torrents, setTorrents] = createStore<Schemas["TorrentState"][]>([]);
  let [filter, setFilter] = createSignal<FilterType>("all");
  let [expandedTorrent, setExpandedTorrent] = createSignal<string>();

  let [{ serverStatus }] = useServerStatus();

  function cleanup() {
    serverStatus.unsubscribeTorrents();
  }

  window.addEventListener("beforeunload", cleanup);

  createAsync(async () => {
    let torrents = await serverStatus.subscribeTorrents();
    setTorrents(torrents);
    Object.values(torrents).forEach((t) => {
      serverStatus.setTorrentHandler(t.info_hash, (chunk) => {
        if (chunk.type == "start") {
          server
            .GET("/api/torrent/{info_hash}/state", {
              params: { path: { info_hash: hexHash(chunk.torrent_hash) } },
            })
            .then((p) => p.data && setTorrents([...torrents, p.data]));
          return;
        }
        if (chunk.type == "delete") {
          setTorrents((t) =>
            t.filter((t) => t.info_hash != hexHash(chunk.torrent_hash)),
          );
          return;
        }
        // Skip all ticks before the fresh state
        if (t.tick_num >= chunk.tick_num) {
          tracing.warn(
            `Skipping progress chunk from the past: expected ${t.tick_num + 1}, got ${chunk.tick_num}`,
          );
          return;
        }
        if (t.tick_num + 1 != chunk.tick_num) {
          // We missied progress tick
          tracing.warn(
            `Detected missed progress tick: expected ${t.tick_num + 1}, got ${chunk.tick_num}`,
          );
        }
        let idx = torrents.findIndex(
          (t) => t.info_hash == hexHash(chunk.torrent_hash),
        );
        setTorrents(
          idx,
          produce((updated) => {
            for (let state of chunk.changes) {
              if (state.type == "peerstatechange") {
                const changeType = state.change.peer_change.change_type;
                if (changeType == "connect") {
                  updated.peers.push({
                    addr: state.change.ip,
                    in_status: { choked: true, interested: false },
                    out_status: { choked: true, interested: false },
                    download_speed: 0,
                    upload_speed: 0,
                    uploaded: 0,
                    downloaded: 0,
                    interested_amount: 0,
                    pending_blocks_amount: 0,
                    client_name: "",
                  });
                } else {
                  let idx = updated.peers.findIndex(
                    (p) => p.addr == state.change.ip,
                  );
                  let peer = updated.peers[idx];

                  if (changeType == "ininterested") {
                    peer.in_status.interested = state.change.peer_change.value;
                  }
                  if (changeType == "inchoke") {
                    peer.in_status.choked = state.change.peer_change.value;
                  }
                  if (changeType == "outinterested") {
                    peer.out_status.interested = state.change.peer_change.value;
                  }
                  if (changeType == "outchoke") {
                    peer.out_status.choked = state.change.peer_change.value;
                  }
                  if (changeType == "disconnect") {
                    updated.peers.splice(idx, 1);
                  }
                }
              }

              if (state.type == "finishedpiece") {
                let piece = state.change;
                updated.downloaded_pieces[piece] = true;
              }

              if (state.type == "trackerannounce") {
                let url = state.change;
                let tracker = updated.trackers.find((t) => t.url == url);
                if (!tracker) {
                  tracing.warn(
                    `Tracker with url ${url} is missing in tracker list`,
                  );
                }
                // todo: last announced at
              }

              if (state.type == "downloadstatechange") {
                let newState = state.change;
                updated.state = newState;
              }

              if (state.type == "fileprioritychange") {
                let { file_idx, priority } = state.change;
                let file = updated.files.find((f) => f.index == file_idx);
                if (!file) {
                  tracing.warn(`File with index ${file_idx} is missing`);
                } else {
                  file.priority = priority;
                }
              }
            }

            for (let peer of chunk.peers) {
              let toUpdate = updated.peers.find((p) => p.addr == peer.ip);
              if (toUpdate) {
                toUpdate.upload_speed = peer.upload_speed;
                toUpdate.uploaded = peer.uploaded;
                toUpdate.download_speed = peer.download_speed;
                toUpdate.downloaded = peer.downloaded;
                toUpdate.interested_amount = peer.interested_amount;
                toUpdate.pending_blocks_amount = peer.pending_blocks_amount;
              } else {
                tracing.warn(`Peer with ip ${peer.ip} is missing`);
              }
            }

            updated.percent = chunk.percent;
            updated.tick_num = chunk.tick_num;
          }),
        );
      });
    });
  });

  onCleanup(() => {
    window.removeEventListener("beforeunload", cleanup);
    cleanup();
  });

  let filteredTorrents = () =>
    filter() === "all"
      ? torrents
      : torrents.filter((t) => t.state.type === filter());

  let toggleExpand = (id: string) => {
    setExpandedTorrent((prev) => (prev === id ? undefined : id));
  };

  let downloadSpeed = (peers: Schemas["StatePeer"][]) =>
    peers.reduce((acc, peer) => acc + peer.download_speed, 0);

  let uploadSpeed = (peers: Schemas["StatePeer"][]) =>
    peers.reduce((acc, peer) => acc + peer.upload_speed, 0);

  function handleRemove(info_hash: string) {
    server.DELETE("/api/torrent/{info_hash}", {
      params: { path: { info_hash } },
    });
    revalidatePath("/api/torrent/all");
  }

  return (
    <div class="container mx-auto h-5/6 bg-background p-4">
      <div class="mb-4 flex space-x-2">
        <FilterButton
          filter="all"
          currentFilter={filter()}
          onClick={setFilter}
        />
        <FilterButton
          filter="pending"
          currentFilter={filter()}
          onClick={setFilter}
        />
        <FilterButton
          filter="seeding"
          currentFilter={filter()}
          onClick={setFilter}
        />
        <FilterButton
          filter="paused"
          currentFilter={filter()}
          onClick={setFilter}
        />
        <FilterButton
          filter="error"
          currentFilter={filter()}
          onClick={setFilter}
        />
      </div>
      <div class="mb-4 flex space-x-2">
        <AddTorrentModal />
      </div>
      <div class="overflow-y-auto rounded-md border">
        <For
          fallback={
            <div class="flex h-full min-h-80 items-center justify-center">
              <span class="text-xl">Torrent list is empty</span>
            </div>
          }
          each={filteredTorrents()}
        >
          {(torrent) => (
            <Torrent
              pieces={torrent.downloaded_pieces}
              onRemove={handleRemove}
              hash={torrent.info_hash}
              percent={torrent.percent}
              isExpanded={expandedTorrent() == torrent.info_hash}
              size={torrent.total_size}
              id={torrent.info_hash}
              name={torrent.name}
              peers={torrent.peers}
              trackers={torrent.trackers}
              onExpand={toggleExpand}
              status={torrent.state}
              downloadSpeed={downloadSpeed(torrent.peers)}
              uploadSpeed={uploadSpeed(torrent.peers)}
              files={torrent.files}
            />
          )}
        </For>
      </div>
    </div>
  );
}
