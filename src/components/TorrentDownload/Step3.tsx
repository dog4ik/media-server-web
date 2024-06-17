import { For } from "solid-js";
import { Schemas } from "../../utils/serverApi";
import { formatSize } from "../../utils/formats";

type Props = {
  content: Schemas["TorrentInfo"];
  selectedFiles: number[];
};

type FileRowProps = {
  file: Schemas["ResolvedTorrentFile"];
  number: number;
};

function FileRow(props: FileRowProps) {
  return (
    <tr>
      <th>{props.number}</th>
      <td>{props.file.path.slice(1).join("/")}</td>
      <td>{formatSize(props.file.size)}</td>
    </tr>
  );
}

export default function Step3(props: Props) {
  return (
    <div class="max-w-3xl">
      <table class="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Path</th>
            <th>Size</th>
          </tr>
        </thead>
        <tbody>
          <For
            each={props.selectedFiles.map(
              (idx) => props.content.contents.files[idx],
            )}
          >
            {(file, idx) => <FileRow file={file} number={idx() + 1} />}
          </For>
          <tr>
            <th>Total:</th>
            <td></td>
            <td>
              {formatSize(
                props.selectedFiles
                  .map((idx) => props.content.contents.files[idx])
                  .reduce((acc, n) => acc + n.size, 0),
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
