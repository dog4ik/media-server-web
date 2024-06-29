import { Schemas, server } from "../../utils/serverApi";
import { createAsync } from "@solidjs/router";
import {
  FiFileText,
  FiFolder,
  FiHardDrive,
  FiHome,
  FiVideo,
} from "solid-icons/fi";
import { createSignal, For, Match, Show, Switch } from "solid-js";

type FileType = "file" | "directory" | "disk" | "home" | "videos";

function FileIcon(props: { fileType: FileType }) {
  const size = 20;
  return (
    <Switch>
      <Match when={props.fileType == "file"}>
        <FiFileText size={size} />
      </Match>
      <Match when={props.fileType == "disk"}>
        <FiHardDrive size={size} />
      </Match>
      <Match when={props.fileType == "directory"}>
        <FiFolder size={size} />
      </Match>
      <Match when={props.fileType == "home"}>
        <FiHome size={size} />
      </Match>
      <Match when={props.fileType == "videos"}>
        <FiVideo size={size} />
      </Match>
    </Switch>
  );
}

type FileRowProps = {
  title: string;
  fileType: FileType;
  onClick: () => void;
  isSelected?: boolean;
  disabled?: boolean;
};

function FileRow(props: FileRowProps) {
  return (
    <button
      disabled={props.disabled}
      onClick={() => !props.disabled && props.onClick()}
      class={`flex items-center gap-2 p-2 ${props.disabled ? "text-neutral-400" : "text-white"}`}
      title={props.title}
    >
      <div>
        <FileIcon fileType={props.fileType} />
      </div>
      <span class="truncate text-left">{props.title}</span>
    </button>
  );
}

async function exploreDirectory(key: string) {
  return await server
    .GET_NO_CACHE("/api/file_browser/browse/{key}", {
      params: { path: { key } },
    })
    .then((d) => d.data);
}

function makeFile(path: string): Schemas["BrowseFile"] {
  let key = window.btoa(path);
  return {
    path,
    key,
    title: path,
  };
}

type Props = {
  onSubmit: (path: string) => void;
  initialDir?: string;
  disallowFiles?: boolean;
};

export function FilePicker(props: Props) {
  let initialPath = props.initialDir ? makeFile(props.initialDir) : undefined;
  let [selectedDir, setSelectedDir] = createSignal<
    Schemas["BrowseFile"] | undefined
  >(initialPath);
  let lastWorkingPath: Schemas["BrowseFile"] | undefined = undefined;
  let [selectedOutput, setSelectedOutput] = createSignal<
    Schemas["BrowseFile"] | undefined
  >(initialPath);

  let currentDirectory = createAsync(async () => {
    if (selectedDir()?.path) {
      let explored = await exploreDirectory(selectedDir()!.key);
      if (!explored && lastWorkingPath) {
        return await exploreDirectory(lastWorkingPath.key);
      }
      if (explored) {
        lastWorkingPath = selectedDir();
      }
      return explored;
    }
  });

  let locations = createAsync(async () => {
    return await server
      .GET_NO_CACHE("/api/file_browser/root_dirs")
      .then((d) => d.data);
  });

  function handleDirSelect(file: Schemas["BrowseFile"]) {
    setSelectedDir(file);
    setSelectedOutput(file);
  }

  function handleFileSelect(file: Schemas["BrowseFile"]) {
    setSelectedOutput(file);
  }

  async function handleBack(currentKey: string) {
    let parent = await server
      .GET_NO_CACHE("/api/file_browser/parent/{key}", {
        params: { path: { key: currentKey } },
      })
      .then((d) => d.data);
    if (parent) {
      setSelectedDir(parent);
      setSelectedOutput(parent);
    }
  }

  return (
    <div class="w-fit space-y-2 bg-neutral-900 p-2">
      <div class="flex">
        <input
          onChange={(e) => {
            let value = e.currentTarget.value;
            let file = makeFile(value);
            setSelectedOutput(file);
            setSelectedDir(file);
          }}
          value={selectedOutput()?.path ?? ""}
          class="input w-full text-black"
        />
        <button
          onClick={() => props.onSubmit(selectedOutput()!.path)}
          disabled={!selectedOutput()}
          class="btn disabled:bg-neutral-400 disabled:text-black"
        >
          Submit
        </button>
      </div>
      <Show when={locations()}>
        {(locations) => (
          <div class="grid h-96 max-w-xl grid-cols-3 grid-rows-1">
            <div class="col-span-1 flex h-full flex-col">
              <Show when={locations().home}>
                {(home) => (
                  <FileRow
                    fileType="home"
                    title={home().path}
                    onClick={() => handleDirSelect(home())}
                  />
                )}
              </Show>
              <Show when={locations().videos}>
                {(videos) => (
                  <FileRow
                    fileType="videos"
                    title={videos().path}
                    onClick={() => handleDirSelect(videos())}
                  />
                )}
              </Show>
              <Show when={locations().root}>
                {(root) => (
                  <FileRow
                    fileType="directory"
                    title={root().path}
                    onClick={() => handleDirSelect(root())}
                  />
                )}
              </Show>
              <For each={locations().disks}>
                {(disk) => (
                  <FileRow
                    fileType="disk"
                    title={disk.path}
                    onClick={() => handleDirSelect(disk)}
                  />
                )}
              </For>
            </div>
            <div class="col-span-2 flex h-full flex-col overflow-auto">
              <Show when={selectedDir()}>
                {(prev) => (
                  <FileRow
                    fileType="directory"
                    title="..[Back]"
                    onClick={() => handleBack(prev().key)}
                  />
                )}
              </Show>
              <Show when={currentDirectory()}>
                {(dir) => (
                  <>
                    <For each={dir().directories}>
                      {(childDir) => (
                        <FileRow
                          onClick={() => handleDirSelect(childDir)}
                          title={childDir.title}
                          fileType="directory"
                        />
                      )}
                    </For>
                    <For each={dir().files}>
                      {(childFile) => (
                        <FileRow
                          disabled={props.disallowFiles}
                          onClick={() => handleFileSelect(childFile)}
                          title={childFile.title}
                          fileType="file"
                        />
                      )}
                    </For>
                  </>
                )}
              </Show>
            </div>
          </div>
        )}
      </Show>
    </div>
  );
}
