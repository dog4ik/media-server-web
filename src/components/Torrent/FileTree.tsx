import { Button } from "@/ui/button";
import { Schemas } from "@/utils/serverApi";
import { For, Show } from "solid-js";
import { createStore, produce } from "solid-js/store";
import ChevronUp from "lucide-solid/icons/chevron-up";
import ChevronDown from "lucide-solid/icons/chevron-down";
import DirIcon from "lucide-solid/icons/folder";
import FileIcon from "lucide-solid/icons/file";
import { capitalize, formatSize } from "@/utils/formats";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { Progress } from "@/ui/progress";

type Child = {
  path: string;
  idx: number;
  size: number;
};

type Directory = {
  size: number;
  path: string;
  fullPath: string[];
  isCollapsed: boolean;
  children: Entry[];
};

export type Entry = Child | Directory;

function createTree(files: Schemas["StateFile"][]) {
  let root: Entry[] = [];
  for (let file of files) {
    let current = root;
    for (let i = 0; i < file.path.length; ++i) {
      let isLast = i == file.path.length - 1;
      if (isLast) {
        current.push({
          path: file.path[i],
          idx: file.index,
          size: file.size,
        });
      } else {
        let existingFolder = current.find((c) => c.path == file.path[i]);
        if (existingFolder && "children" in existingFolder) {
          existingFolder.size += file.size;
          current = existingFolder.children;
        } else {
          let next: Entry[] = [];
          current.push({
            path: file.path[i],
            children: next,
            fullPath: file.path.slice(0, i + 1),
            size: file.size,
            isCollapsed: true,
          });
          current = next;
        }
      }
    }
  }

  let first = root[0];
  if (first && "children" in first) {
    first.isCollapsed = false;
  }
  return root;
}

type ChildProps = {
  idx: number;
  size: number;
  path: string;
  file: Schemas["StateFile"];
  onPriorityUpdate: (idx: number, priority: Schemas["Priority"]) => void;
  fileProgress: (file: Schemas["StateFile"]) => number;
};

function Child(props: ChildProps) {
  let priority = () => props.file.priority;
  return (
    <div class="flex items-center gap-2">
      <FileIcon />
      <div class="flex-1 space-y-1">
        <div class="flex">
          <span class="flex-1">{props.path}</span>
          <div class="text-muted-foreground text-xs">
            {formatSize(props.size)}
          </div>
        </div>
        <Progress value={props.fileProgress(props.file)} class="h-1" />
      </div>
      <Select
        options={["disabled", "low", "medium", "high"]}
        defaultValue={priority()}
        value={priority()}
        onChange={(p) =>
          props.onPriorityUpdate(props.idx, p ?? priority() ?? "disabled")
        }
        itemComponent={(p) => (
          <SelectItem item={p.item}>{capitalize(p.item.rawValue)}</SelectItem>
        )}
      >
        <SelectTrigger class="w-[100px]">
          <SelectValue class="text-white">{capitalize(priority())}</SelectValue>
        </SelectTrigger>
        <SelectContent />
      </Select>
    </div>
  );
}

type DirectoryProps = {
  onPriorityUpdate: (idx: number, priority: Schemas["Priority"]) => void;
  items: Entry[];
  isCollapsed: boolean;
  onCollapseToggle: (path: string[]) => void;
  path: string;
  size: number;
  fullPath: string[];
  files: Schemas["StateFile"][];
  fileProgress: (file: Schemas["StateFile"]) => number;
};

function Directory(props: DirectoryProps) {
  return (
    <div>
      <div class="flex items-center gap-2">
        <Button
          class="p-1"
          onClick={() => props.onCollapseToggle(props.fullPath)}
        >
          <Show when={props.isCollapsed} fallback={<ChevronUp />}>
            <ChevronDown />
          </Show>
        </Button>
        <DirIcon class="inline" />
        <span class="flex-1">{props.path}</span>
        <div class="text-muted-foreground text-xs">
          {formatSize(props.size)}
        </div>
      </div>
      <Show when={!props.isCollapsed}>
        <div class="ml-2 flex flex-col gap-5">
          <For each={props.items}>
            {(item) =>
              "children" in item ? (
                <Directory
                  fileProgress={props.fileProgress}
                  onPriorityUpdate={props.onPriorityUpdate}
                  path={item.path}
                  items={item.children}
                  onCollapseToggle={props.onCollapseToggle}
                  isCollapsed={item.isCollapsed}
                  size={item.size}
                  fullPath={item.fullPath}
                  files={props.files}
                />
              ) : (
                <Child
                  idx={item.idx}
                  fileProgress={props.fileProgress}
                  path={item.path}
                  onPriorityUpdate={props.onPriorityUpdate}
                  size={item.size}
                  file={props.files.find((f) => f.index == item.idx)!}
                />
              )
            }
          </For>
        </div>
      </Show>
    </div>
  );
}

type Props = {
  files: Schemas["StateFile"][];
  onPriorityChange: (idx: number, priority: Schemas["Priority"]) => void;
  fileProgress: (file: Schemas["StateFile"]) => number;
};

export function FileTree(props: Props) {
  let [tree, setTree] = createStore(createTree(props.files));
  function onCollapseToggle(fullPath: string[]) {
    setTree(
      produce((tree) => {
        let current: Entry | undefined = undefined;
        for (let path of fullPath) {
          if (current === undefined) {
            current = tree.find((el) => el.path == path);
          } else if ("children" in current) {
            current = current.children.find((el) => el.path == path);
          }
        }
        if (current && "children" in current) {
          current.isCollapsed = !current.isCollapsed;
        }
      }),
    );
  }
  return (
    <div class="py-2">
      <For each={tree}>
        {(entry) => {
          if ("children" in entry) {
            return (
              <Directory
                fileProgress={props.fileProgress}
                items={entry.children}
                onPriorityUpdate={props.onPriorityChange}
                files={props.files}
                isCollapsed={entry.isCollapsed}
                path={entry.path}
                size={entry.size}
                fullPath={entry.fullPath}
                onCollapseToggle={onCollapseToggle}
              />
            );
          } else {
            return (
              <Child
                path={entry.path}
                onPriorityUpdate={props.onPriorityChange}
                fileProgress={props.fileProgress}
                file={props.files.find((f) => f.index == entry.idx)!}
                idx={entry.idx}
                size={entry.size}
              />
            );
          }
        }}
      </For>
    </div>
  );
}
