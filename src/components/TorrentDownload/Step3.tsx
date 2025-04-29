import { For } from "solid-js";
import { Schemas } from "../../utils/serverApi";
import { formatSize } from "../../utils/formats";
import { FilePicker } from "../FilePicker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";

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
      <TableCell>{props.file.path.slice(1).join("/")}</TableCell>
      <TableCell class="text-right">{formatSize(props.file.size)}</TableCell>
    </TableRow>
  );
}

export default function Step3(props: Props) {
  return (
    <div>
      <div>
        <h2 class="py-2 text-xl">Enabled files:</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-[100px]">#</TableHead>
              <TableHead>Path</TableHead>
              <TableHead class="text-right">Size</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <For
              each={props.selectedFiles.map(
                (idx) => props.content.contents.files[idx],
              )}
            >
              {(file, idx) => <FileRow file={file} number={idx() + 1} />}
            </For>
            <TableRow>
              <TableCell class="font-medium">Total:</TableCell>
              <TableCell></TableCell>
              <TableCell class="text-right">
                {formatSize(
                  props.selectedFiles
                    .map((idx) => props.content.contents.files[idx])
                    .reduce((acc, n) => acc + n.size, 0),
                )}
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
