import { createMemo, For } from "solid-js";
import { torrentFilesIndex } from "@/lib/torrentContent";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { formatSize } from "../../utils/formats";
import type { Schemas } from "../../utils/serverApi";
import { FilePicker } from "../FilePicker";

type Props = {
  content: Schemas["TorrentInfo"];
  output?: string;
  selectedFiles: number[];
  onOutputSelect: (path: string) => void;
};

type FileRowProps = {
  file: Schemas["ResolvedTorrentFile"];
  number: number;
};

function FileRow(props: FileRowProps) {
  return (
    <TableRow>
      <TableCell>{props.number}</TableCell>
      <TableCell>{props.file.path.join("/")}</TableCell>
      <TableCell class="text-right">{formatSize(props.file.size)}</TableCell>
    </TableRow>
  );
}

export default function Step3(props: Props) {
  let files = createMemo(() => {
    let index = torrentFilesIndex(props.content);
    return props.selectedFiles
      .map((idx) => index.get(idx))
      .filter((file) => file !== undefined);
  });

  return (
    <div>
      <div>
        <h2 class="py-2 text-xl">Enabled files:</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-25">#</TableHead>
              <TableHead>Path</TableHead>
              <TableHead class="text-right">Size</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <For each={files()}>
              {(file, idx) => <FileRow file={file} number={idx() + 1} />}
            </For>
            <TableRow>
              <TableCell class="font-medium">Total:</TableCell>
              <TableCell></TableCell>
              <TableCell class="text-right">
                {formatSize(files().reduce((acc, n) => acc + n.size, 0))}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <div>
        <h2 class="py-2 text-xl">Output location: </h2>
        <FilePicker
          onChange={props.onOutputSelect}
          disallowFiles
          initialDir={props.output}
        />
      </div>
    </div>
  );
}
