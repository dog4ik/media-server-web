import { Schemas } from "../utils/serverApi";
import { For, ParentProps } from "solid-js";
import { server } from "../utils/serverApi";
import { createAsync } from "@solidjs/router";
import { FiFile, FiFolder } from "solid-icons/fi";
import { formatSize } from "../utils/formats";

type TorrentDownloadProps = {
  info: Schemas["TorrentInfo"];
};

type FileProps = {
  file: Schemas["ResolvedTorrentFile"];
};

function File(props: FileProps) {
  let iconSize = 10;
  return (
    <li>
      <div class="flex items-center justify-between">
        <FiFile size={iconSize} />
        <span>{props.file.path}</span>
        <span>{formatSize(props.file.size)}</span>
      </div>
    </li>
  );
}

type MapFileTree = {
  [key: string]: MapFileTree | number;
};

function mapFileTree(files: Schemas["ResolvedTorrentFile"][]): MapFileTree {
  if (files.length == 1) {
    return { "/": 0 };
  }

  let tree: MapFileTree = {};

  for (let i = 0; i < files.length; ++i) {
    let file = files[i];
    let current = tree;

    file.path.forEach((part, index) => {
      if (index === file.path.length - 1) {
        // Last part, it's a file
        current[part] = i;
      } else {
        // It's a directory
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part] as MapFileTree;
      }
    });
  }

  return tree;
}

type DirectoryProps = {
  files: Schemas["ResolvedTorrentFile"][];
  tree: MapFileTree;
};

function Directory(props: DirectoryProps) {
  return (
    <li>
      <div class="flex items-center justify-between">
        <For each={Object.keys(props.tree)}>
          {(key) => {
            let value = props.tree[key];
            if (typeof value == "number") {
              let file = props.files[value];
              return (
                <>
                  <FiFile size={20} />
                  <span>{file.path}</span>
                  <span>{formatSize(file.size)}</span>
                </>
              );
            } else {
              return (
                <>
                  <FiFolder size={20} />
                  <span>{key}</span>
                  <ul class="menu menu-xs w-full rounded-lg bg-base-200">
                    <Directory files={props.files} tree={value} />
                  </ul>
                </>
              );
            }
          }}
        </For>
      </div>
    </li>
  );
}

function TorrentDownload(props: TorrentDownloadProps) {
  let tree = mapFileTree(props.info.contents.files);
  console.log("tree: ", tree);
  return (
    <div class="flex flex-col justify-between rounded-md bg-white text-black">
      <span>{props.info.name}</span>
      <div class="flex flex-col">
        <span>Files</span>
        <ul class="menu menu-xs w-full rounded-lg bg-base-200">
          <Directory tree={tree} files={props.info.contents.files} />
        </ul>
      </div>
    </div>
  );
}

export default function Torrent() {
  let downloads = createAsync(async () => {
    let torrents = await server.GET("/api/torrent/all").then((d) => d.data);
    return torrents;
  });

  return (
    <>
      <div class="h-full w-full">
        <For each={downloads()}>
          {(download) => <TorrentDownload info={download} />}
        </For>
      </div>
    </>
  );
}
