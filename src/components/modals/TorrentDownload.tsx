import { createAsync } from "@solidjs/router";
import {
  ContentType,
  MetadataProvider,
  TorrentSearchResult,
  downloadTorrent,
  getExternalIds,
  searchTorrent,
} from "../../utils/serverApi";
import Modal, { ModalProps } from "./Modal";
import { For, Show } from "solid-js";
import { formatSize } from "../../utils/formats";
import { FiDownload } from "solid-icons/fi";
import { useNotifications } from "../../context/NotificationContext";

type Props = {
  metadata_provider: MetadataProvider;
  metadata_id: string;
  content_type: ContentType;
  query: string;
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

async function imdb_id(
  metadata_provider: MetadataProvider,
  metadata_id: string,
  content_type: ContentType,
) {
  let ids = await getExternalIds(metadata_id, content_type, metadata_provider);
  let imdb_id = ids.find((id) => id.provider == "imdb");
  if (!imdb_id) {
    return undefined;
  }
  return imdb_id.id;
}

export default function DownloadTorrentModal(props: Props & ModalProps) {
  let notificator = useNotifications();
  let torrentSearch = createAsync(async () => {
    let result = await searchTorrent(props.query);
    if (result.length === 0) {
      return undefined;
    }
    return result;
  });
  function handleDownload(magnet: string) {
    downloadTorrent({
      magnet,
      content_hint: {
        metadata_provider: props.metadata_provider,
        metadata_id: props.metadata_id,
        content_type: props.content_type,
      },
      save_location: undefined,
    })
      .then(() => {
        notificator("success", "Created torrent download");
      })
      .catch(() => {
        notificator("error", "Failed to download torrent");
      });
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
                    onDownload={() => handleDownload(res.magnet)}
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
