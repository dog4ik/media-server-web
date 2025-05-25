import { Schemas, server } from "../../utils/serverApi";
import { createAsync } from "@solidjs/router";
import {
  FiFileText,
  FiFolder,
  FiHardDrive,
  FiHome,
  FiVideo,
} from "solid-icons/fi";
import { createEffect, createSignal, For, Match, Show, Switch } from "solid-js";
import { TextFieldRoot, TextField } from "@/ui/textfield";
import { Button } from "@/ui/button";

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

type EntryRowProps = {
  title: string;
  fileType: FileType;
  onClick: () => void;
  isSelected?: boolean;
  disabled?: boolean;
};

function EntryRow(props: EntryRowProps) {
  return (
    <button
      disabled={props.disabled}
      onClick={() => !props.disabled && props.onClick()}
      class={`flex max-w-full items-center gap-2 overflow-hidden truncate whitespace-nowrap p-2 ${props.disabled ? "text-neutral-400" : "text-white"}`}
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
  onSubmit?: (path: string) => void;
  onChange?: (path: string) => void;
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

  createEffect(() => {
    if (selectedOutput()) props.onChange?.(selectedOutput()!.path);
  });

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
    <div class="w-full space-y-2 rounded-md border bg-background p-2">
      <div class="flex">
        <TextFieldRoot class="w-full">
          <TextField
            onInput={(e) => {
              let value = e.currentTarget.value;
              let file = makeFile(value);
              setSelectedOutput(file);
              setSelectedDir(file);
            }}
            value={selectedOutput()?.path ?? ""}
          />
        </TextFieldRoot>
        <Show when={props.onSubmit}>
          <Button
            onClick={() => props.onSubmit?.(selectedOutput()!.path)}
            disabled={!selectedOutput()?.path}
          >
            Submit
          </Button>
        </Show>
      </div>
      <Show when={locations()}>
        {(locations) => (
          <div class="grid h-96 grid-cols-3 justify-between divide-x">
            <div class="grow-0 flex-col overflow-y-auto">
              <Show when={locations().home}>
                {(home) => (
                  <EntryRow
                    fileType="home"
                    title={home().path}
                    onClick={() => handleDirSelect(home())}
                  />
                )}
              </Show>
              <Show when={locations().videos}>
                {(videos) => (
                  <EntryRow
                    fileType="videos"
                    title={videos().path}
                    onClick={() => handleDirSelect(videos())}
                  />
                )}
              </Show>
              <Show when={locations().root}>
                {(root) => (
                  <EntryRow
                    fileType="directory"
                    title={root().path}
                    onClick={() => handleDirSelect(root())}
                  />
                )}
              </Show>
              <For each={locations().disks}>
                {(disk) => (
                  <EntryRow
                    fileType="disk"
                    title={disk.path}
                    onClick={() => handleDirSelect(disk)}
                  />
                )}
              </For>
            </div>
            <div class="col-span-2 flex-col overflow-y-auto">
              <Show when={selectedDir()}>
                {(prev) => (
                  <EntryRow
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
                        <EntryRow
                          onClick={() => handleDirSelect(childDir)}
                          title={childDir.title}
                          fileType="directory"
                        />
                      )}
                    </For>
                    <For each={dir().files}>
                      {(childFile) => (
                        <EntryRow
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
