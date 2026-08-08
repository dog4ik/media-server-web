import File from "lucide-solid/icons/file";
import FileImage from "lucide-solid/icons/file-image";
import FileMusic from "lucide-solid/icons/file-music";
import FilePlay from "lucide-solid/icons/file-play";
import FileText from "lucide-solid/icons/file-text";
import FolderClosed from "lucide-solid/icons/folder-closed";
import FolderOpen from "lucide-solid/icons/folder-open";
import { createMemo, Match, Show, Switch } from "solid-js";

type FileType = "video" | "text" | "image" | "audio" | "other";

const ICON_SIZE = 18;

function classifyFileName(name: string): FileType {
  if ([".txt"].some((ext) => name.endsWith(ext))) {
    return "text";
  }
  if ([".mp4", ".mkv", ".avi"].some((ext) => name.endsWith(ext))) {
    return "video";
  }
  if ([".mp3"].some((ext) => name.endsWith(ext))) {
    return "audio";
  }
  if ([".png", ".jpg", ".jpeg", ".webp"].some((ext) => name.endsWith(ext))) {
    return "image";
  }
  return "other";
}

export function FileIcon(props: { name: string }) {
  let fileType = createMemo(() => classifyFileName(props.name));
  return (
    <div>
      <Switch fallback={<File size={ICON_SIZE} />}>
        <Match when={fileType() === "text"}>
          <FileText size={ICON_SIZE} />
        </Match>
        <Match when={fileType() === "video"}>
          <FilePlay size={ICON_SIZE} />
        </Match>
        <Match when={fileType() === "image"}>
          <FileImage size={ICON_SIZE} />
        </Match>
        <Match when={fileType() === "audio"}>
          <FileMusic size={ICON_SIZE} />
        </Match>
        <Match when={fileType() === "other"}>
          <File size={ICON_SIZE} />
        </Match>
      </Switch>
    </div>
  );
}

export function DirectoryIcon(props: { expanded: boolean }) {
  return (
    <div>
      <Show when={props.expanded} fallback={<FolderClosed size={ICON_SIZE} />}>
        <FolderOpen size={ICON_SIZE} />
      </Show>
    </div>
  );
}
