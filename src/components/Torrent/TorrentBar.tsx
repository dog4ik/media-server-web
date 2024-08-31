import { FiDelete, FiPause, FiPlay, FiPlus, } from "solid-icons/fi";
import { ParentProps, Show } from "solid-js";

type IconProps = {
  title?: string;
  onClick?: () => void;
} & ParentProps;

function Icon(props: IconProps) {
  return (
    <button
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
      <Icon title="Add torrent" >
        <FiPlus size={ICON_SIZE}/>
      </Icon>
      <Icon title="Pause torrents" >
        <FiPause size={ICON_SIZE}/>
      </Icon>
      <Icon title="Resume torrents" >
        <FiPlay size={ICON_SIZE}/>
      </Icon>
      <Icon title="Remove torrents" >
        <FiDelete size={ICON_SIZE}/>
      </Icon>
    </div>
  );
}
