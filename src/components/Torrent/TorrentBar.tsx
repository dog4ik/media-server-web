import Delete from "lucide-solid/icons/delete";
import Pause from "lucide-solid/icons/pause";
import Play from "lucide-solid/icons/play";
import Plus from "lucide-solid/icons/plus";
import { type ParentProps, Show } from "solid-js";

type IconProps = {
  title?: string;
  onClick?: () => void;
} & ParentProps;

function Icon(props: IconProps) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      class="flex flex-col items-center justify-center"
    >
      {props.children}
      <Show when={props.title}>
        <span>{props.title}</span>
      </Show>
    </button>
  );
}

const ICON_SIZE = 20;

export function TorrentBar() {
  return (
    <div class="flex items-center gap-4">
      <Icon title="Add torrent">
        <Plus size={ICON_SIZE} />
      </Icon>
      <Icon title="Pause torrents">
        <Pause size={ICON_SIZE} />
      </Icon>
      <Icon title="Resume torrents">
        <Play size={ICON_SIZE} />
      </Icon>
      <Icon title="Remove torrents">
        <Delete size={ICON_SIZE} />
      </Icon>
    </div>
  );
}
