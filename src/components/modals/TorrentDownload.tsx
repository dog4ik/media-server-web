import { createAsync } from "@solidjs/router";
import { Schemas, server } from "../../utils/serverApi";
import Modal, { ModalProps } from "./Modal";
import { For, Show } from "solid-js";
import { formatSize } from "../../utils/formats";
import { FiDownload } from "solid-icons/fi";
import { useNotifications } from "../../context/NotificationContext";

type Props = {
  metadata_provider: Schemas["MetadataProvider"];
  metadata_id: string;
  content_type: Schemas["ContentType"];
  query: string;
};

type TorrentResultProps = {
  onDownload: () => void;
  result: Schemas["Torrent"];
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
  metadata_provider: Schemas["MetadataProvider"],
  metadata_id: string,
  content_type: Schemas["ContentType"],
) {
  let ids = await server.GET("/api/external_ids/{id}", {
    params: {
      path: {
        id: metadata_id,
      },
      query: {
        provider: metadata_provider,
        content_type,
      },
    },
  });
  let imdb_id = ids.data?.find((id) => id.provider == "imdb");
  if (!imdb_id) {
    return undefined;
  }
  return imdb_id.id;
}

export default function DownloadTorrentModal(props: Props & ModalProps) {
  let notificator = useNotifications();
  let torrentSearch = createAsync(async () => {
    let result = await server.GET("/api/torrent/search", {
      params: { query: { search: props.query } },
    });
    if (!result.data || result.data.length === 0) {
      return undefined;
    }
    return result;
  });
  function handleDownload(magnet: string) {
    server
      .POST("/api/torrent/download", {
        body: { magnet, save_location: "." },
      })
      .then(() => {
        notificator("success", "Started torrent download");
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
              <For each={torrentSearch()?.data}>
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
