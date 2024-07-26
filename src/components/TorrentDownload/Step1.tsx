import { BiRegularMagnet } from "solid-icons/bi";
import { formatSize } from "../../utils/formats";
import { Schemas, } from "../../utils/serverApi";
import { For, } from "solid-js";

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
    <tr tabindex={0} class={`cursor-pointer hover:bg-neutral-800`} onClick={props.onClick}>
      <td>{props.result.name}</td>
      <td>{props.result.author ?? ""}</td>
      <td>{props.result.seeders}</td>
      <td>{props.result.leechers}</td>
      <td>{formatSize(props.result.size)}</td>
      <td class="space-y-2">
        <a href={props.result.magnet} onClick={(e) => e.stopPropagation()} class="btn">
          <BiRegularMagnet size={20} />
        </a>
      </td>
    </tr>
  );
}

export default function Step1(props: Props) {
  return (
      <div class="text-white h-fit">
        <table class="table">
          <thead>
            <tr class="text-white">
              <th>Name</th>
              <th>Author</th>
              <th>Seeders</th>
              <th>Leechers</th>
              <th>Size</th>
            </tr>
          </thead>
          <tbody>
            <For each={props.searchResults}>
              {(res) => (
                <TorrentResult
                  onClick={() => props.onSelect(res.magnet)}
                  result={res}
                />
              )}
            </For>
          </tbody>
        </table>
      </div>
  );
}
