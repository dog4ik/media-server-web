import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { formatSize } from "@/utils/formats";
import { Schemas } from "@/utils/serverApi";
import { For } from "solid-js";

type PeerProps = {
  peer: Schemas["StatePeer"];
};

function Peer(props: PeerProps) {
  return (
    <TableRow>
      <TableCell class="font-medium">
        {props.peer.addr} ({props.peer.client_name})
      </TableCell>
      <TableCell>{formatSize(props.peer.uploaded)}</TableCell>
      <TableCell>{formatSize(props.peer.upload_speed)}/s</TableCell>
      <TableCell>{formatSize(props.peer.downloaded)}</TableCell>
      <TableCell>
        {formatSize(props.peer.download_speed)}/s{" "}
        {props.peer.pending_blocks_amount} blocks in flight
      </TableCell>
      <TableCell>
        {props.peer.in_status.choked ? "choked" : "unchoked"}
        {", "}
        {props.peer.in_status.interested ? "interested" : "not interested"}
      </TableCell>
      <TableCell class="text-right">
        {props.peer.out_status.choked ? "choked" : "unchoked"}
        {", "}
        {props.peer.out_status.interested
          ? `interested (${props.peer.interested_amount})`
          : "not interested"}
      </TableCell>
    </TableRow>
  );
}

type Props = {
  peers: Schemas["StatePeer"][];
};

export function PeersList(props: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ip</TableHead>
          <TableHead>Uploaded</TableHead>
          <TableHead>Upload speed</TableHead>
          <TableHead>Downloaded</TableHead>
          <TableHead>Download speed</TableHead>
          <TableHead>In status</TableHead>
          <TableHead class="text-right">Out status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <For each={props.peers}>{(peer) => <Peer peer={peer} />}</For>
      </TableBody>
    </Table>
  );
}
