import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from "@/ui/tabs";
import { Schemas } from "@/utils/serverApi";
import { PeerList } from "./TorrentTable/PeerList";
import { TrackerList } from "./TrackerList";
import { FileList } from "./TorrentTable/FileList";

type Props = {
  torrent: Schemas["TorrentState"];
};

export function TorrentSide(props: Props) {
  return (
    <Tabs defaultValue="files" class="h-full gap-0 overflow-hidden border-t">
      <TabsList class="h-9 w-full justify-start rounded-none border-b bg-transparent px-2 ring-0">
        <TabsTrigger value="files" class="flex-none px-4">Files</TabsTrigger>
        <TabsTrigger value="peers" class="flex-none px-4">Peers</TabsTrigger>
        <TabsTrigger value="trackers" class="flex-none px-4">Trackers</TabsTrigger>
        <TabsIndicator class="top-auto bottom-0 h-0.5 rounded-none border-none bg-primary shadow-none" />
      </TabsList>
      <TabsContent value="files" class="overflow-auto p-2">
        <FileList
          infoHash={props.torrent.info_hash}
          downloadedPieces={props.torrent.downloaded_pieces}
          files={props.torrent.files}
        />
      </TabsContent>
      <TabsContent value="peers" class="overflow-auto p-2">
        <PeerList peers={props.torrent.peers} />
      </TabsContent>
      <TabsContent value="trackers" class="overflow-auto p-2">
        <TrackerList trackers={props.torrent.trackers} />
      </TabsContent>
    </Tabs>
  );
}
