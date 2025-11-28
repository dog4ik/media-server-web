import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import {
  Tabs,
  TabsContent,
  TabsIndicator,
  TabsList,
  TabsTrigger,
} from "@/ui/tabs";
import { Schemas } from "@/utils/serverApi";
import { PeerList } from "./TorrentTable/PeerList";
import { TrackerList } from "./TrackerList";
import { FileList } from "./TorrentTable/FileList";

type Props = {
  torrent: Schemas["TorrentState"];
};

export function TorrentSide(props: Props) {
  return (
    <Tabs defaultValue="files" class="w-full">
      <TabsList>
        <TabsTrigger value="files">Files</TabsTrigger>
        <TabsTrigger value="peers">Peers</TabsTrigger>
        <TabsTrigger value="trackers">Trackers</TabsTrigger>
        <TabsIndicator />
      </TabsList>
      <TabsContent value="files">
        <Card>
          <CardHeader>
            <CardTitle>Files</CardTitle>
            <CardDescription>Torrent file list</CardDescription>
          </CardHeader>
          <CardContent class="space-y-2">
            <FileList
              infoHash={props.torrent.info_hash}
              downloadedPieces={props.torrent.downloaded_pieces}
              files={props.torrent.files}
            />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="peers">
        <Card>
          <CardHeader>
            <CardTitle>Peers</CardTitle>
            <CardDescription>Manage peers here</CardDescription>
          </CardHeader>
          <CardContent class="space-y-2">
            <PeerList peers={props.torrent.peers} />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="trackers">
        <Card>
          <CardHeader>
            <CardTitle>Trackers</CardTitle>
            <CardDescription>Manage trackers here</CardDescription>
          </CardHeader>
          <CardContent class="space-y-2">
            <TrackerList trackers={props.torrent.trackers} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
