import { BiRegularMagnet } from "solid-icons/bi";
import { formatSize } from "../../utils/formats";
import { Schemas } from "../../utils/serverApi";
import { For } from "solid-js";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";

type TorrentResultProps = {
  result: Schemas["Torrent"];
  onClick: () => void;
};

type Props = {
  searchResults: Schemas["Torrent"][];
  onSelect: (magnetLink: string) => void;
};

function TorrentResult(props: TorrentResultProps) {
  return (
    <TableRow
      tabindex={0}
      class={`cursor-pointer hover:bg-neutral-800`}
      onClick={props.onClick}
    >
      <TableCell>{props.result.name}</TableCell>
      <TableCell>{props.result.author ?? ""}</TableCell>
      <TableCell>{props.result.seeders}</TableCell>
      <TableCell>{props.result.leechers}</TableCell>
      <TableCell>{formatSize(props.result.size)}</TableCell>
      <TableCell class="space-y-2">
        <a
          href={props.result.magnet}
          onClick={(e) => e.stopPropagation()}
          class="btn"
        >
          <BiRegularMagnet size={20} />
        </a>
      </TableCell>
    </TableRow>
  );
}

export default function Step1(props: Props) {
  return (
    <div class="overflow-y-auto">
      <Table class="table">
        <TableHeader>
          <TableRow class="text-white">
            <TableHead>Name</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Seeders</TableHead>
            <TableHead>Leechers</TableHead>
            <TableHead>Size</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <For each={props.searchResults}>
            {(res) => (
              <TorrentResult
                onClick={() => props.onSelect(res.magnet)}
                result={res}
              />
            )}
          </For>
        </TableBody>
      </Table>
    </div>
  );
}
