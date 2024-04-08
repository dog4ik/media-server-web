import { createAsync } from "@solidjs/router";
import {
  ContentType,
  MetadataProvider,
  TorrentSearchResult,
  getExternalIds,
  searchTorrent,
} from "../../utils/serverApi";
import Modal, { ModalProps } from "./Modal";
import { For, Show } from "solid-js";
import { formatSize } from "../../utils/formats";
import { FiDownload } from "solid-icons/fi";

type Props = {
  metadata_provider: MetadataProvider;
  metadata_id: string;
  content_type: ContentType;
  name: string;
};

type TorrentResultProps = {
  onDownload: () => void;
  result: TorrentSearchResult;
};

function TorrentResult(props: TorrentResultProps) {
  return (
    <tr>
      <td>{props.result.name}</td>
      <td>{props.result.author ?? ""}</td>
      <td>{props.result.seeders}</td>
      <td>{props.result.leechers}</td>
      <td>{formatSize(props.result.size)}</td>
      <td>
        <button onClick={props.onDownload} class="btn">
          <FiDownload />
        </button>
      </td>
    </tr>
  );
}

export default function DownloadTorrentModal(props: Props & ModalProps) {
  let torrentSearch = createAsync(async () => {
    let ids = await getExternalIds(
      props.metadata_id,
      props.content_type,
      props.metadata_provider,
    );
    let imdb_id = ids.find((id) => id.provider == "imdb");
    if (!imdb_id) {
      return undefined;
    }
    console.log(ids);
    return await searchTorrent(imdb_id.id);

  });
  function handleDownload() {
    console.log("download");
  }
  return (
    <Modal ref={props.ref}>
      <Show when={torrentSearch()}>
        <div class="overflow-x-auto text-white">
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
              <For each={torrentSearch()!}>
                {(res) => (
                  <TorrentResult
                    onDownload={() => handleDownload()}
                    result={res}
                  />
                )}
              </For>
            </tbody>
          </table>
        </div>
      </Show>
    </Modal>
  );
}
