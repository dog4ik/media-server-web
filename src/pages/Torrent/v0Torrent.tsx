import { createSignal, For, Show } from "solid-js";
import { Button } from "@/ui/button";
import { Progress } from "@/ui/progress";
import { Badge } from "@/ui/badge";

import Trash from "lucide-solid/icons/trash";
import Plus from "lucide-solid/icons/plus";
import Play from "lucide-solid/icons/play";
import Pause from "lucide-solid/icons/pause";
import Download from "lucide-solid/icons/download";
import ChevronUp from "lucide-solid/icons/chevron-up";
import ChevronDown from "lucide-solid/icons/chevron-down";

import FileInput from "@/components/ui/FileInput";

type TorrentStatus = "downloading" | "seeding" | "paused" | "error";

interface Torrent {
  id: string;
  name: string;
  status: TorrentStatus;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  peers: number;
  size: string;
}

const initialTorrents: Torrent[] = [
  {
    id: "1",
    name: "Ubuntu 22.04 LTS",
    status: "downloading",
    progress: 35,
    downloadSpeed: 2.5,
    uploadSpeed: 0.5,
    peers: 15,
    size: "3.8 GB",
  },
  {
    id: "2",
    name: "Debian 11",
    status: "seeding",
    progress: 100,
    downloadSpeed: 0,
    uploadSpeed: 1.2,
    peers: 7,
    size: "2.1 GB",
  },
  {
    id: "3",
    name: "Arch Linux",
    status: "paused",
    progress: 68,
    downloadSpeed: 0,
    uploadSpeed: 0,
    peers: 0,
    size: "768 MB",
  },
  {
    id: "4",
    name: "Fedora 35 Workstation",
    status: "error",
    progress: 12,
    downloadSpeed: 0,
    uploadSpeed: 0,
    peers: 0,
    size: "2.4 GB",
  },
];

export default function BitTorrentClient() {
  const [torrents, setTorrents] = createSignal<Torrent[]>(initialTorrents);
  const [filter, setFilter] = createSignal<TorrentStatus | "all">("all");
  const [expandedTorrent, setExpandedTorrent] = createSignal<string | null>(
    null,
  );

  const filteredTorrents = () =>
    filter() === "all"
      ? torrents()
      : torrents().filter((t) => t.status === filter());

  const toggleExpand = (id: string) => {
    setExpandedTorrent((prev) => (prev === id ? null : id));
  };

  return (
    <div class="container mx-auto min-h-screen bg-background p-4">
      <h1 class="mb-6 text-3xl font-bold">BitTorrent Client</h1>
      <div class="mb-4 flex space-x-2">
        <Button variant="outline" onClick={() => setFilter("all")}>
          All
        </Button>
        <Button variant="outline" onClick={() => setFilter("downloading")}>
          Downloading
        </Button>
        <Button variant="outline" onClick={() => setFilter("seeding")}>
          Seeding
        </Button>
        <Button variant="outline" onClick={() => setFilter("paused")}>
          Paused
        </Button>
        <Button variant="outline" onClick={() => setFilter("error")}>
          Error
        </Button>
      </div>
      <div class="mb-4 flex space-x-2">
        <FileInput
          title="Select .torrent file location"
          value="Torrent"
          onChange={() => {}}
        />
        <Button>
          <Plus class="mr-2 h-4 w-4" /> Add Torrent
        </Button>
      </div>
      <div class="h-[calc(100vh-200px)] overflow-y-auto rounded-md border">
        <For each={filteredTorrents()}>
          {(torrent) => (
            <div class="border-b last:border-b-0">
              <div
                class="flex cursor-pointer items-center justify-between p-4"
                onClick={() => toggleExpand(torrent.id)}
              >
                <div class="flex-grow">
                  <div class="mb-2 flex items-center justify-between">
                    <h3 class="font-semibold">{torrent.name}</h3>
                    <Badge
                      variant={
                        torrent.status === "error" ? "destructive" : "secondary"
                      }
                    >
                      {torrent.status}
                    </Badge>
                  </div>
                  <Progress value={torrent.progress} class="h-2" />
                </div>
                {expandedTorrent() === torrent.id ? (
                  <ChevronUp class="ml-2" />
                ) : (
                  <ChevronDown class="ml-2" />
                )}
              </div>
              <Show when={expandedTorrent() === torrent.id}>
                <div class="bg-muted p-4">
                  <div class="mb-4 grid grid-cols-2 gap-4">
                    <div>
                      <p class="text-sm text-muted-foreground">
                        Download Speed
                      </p>
                      <p class="font-medium">{torrent.downloadSpeed} MB/s</p>
                    </div>
                    <div>
                      <p class="text-sm text-muted-foreground">Upload Speed</p>
                      <p class="font-medium">{torrent.uploadSpeed} MB/s</p>
                    </div>
                    <div>
                      <p class="text-sm text-muted-foreground">Peers</p>
                      <p class="font-medium">{torrent.peers}</p>
                    </div>
                    <div>
                      <p class="text-sm text-muted-foreground">Size</p>
                      <p class="font-medium">{torrent.size}</p>
                    </div>
                  </div>
                  <div class="flex space-x-2">
                    {torrent.status === "paused" ? (
                      <Button size="sm">
                        <Play class="mr-2 h-4 w-4" /> Resume
                      </Button>
                    ) : (
                      <Button size="sm">
                        <Pause class="mr-2 h-4 w-4" /> Pause
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Download class="mr-2 h-4 w-4" /> Force Download
                    </Button>
                    <Button size="sm" variant="destructive">
                      <Trash class="mr-2 h-4 w-4" /> Remove
                    </Button>
                  </div>
                </div>
              </Show>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
