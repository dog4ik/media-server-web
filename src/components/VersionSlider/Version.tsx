import { ParentProps } from "solid-js";
import { Schemas } from "../../utils/serverApi";
import {
  FiClock,
  FiHardDrive,
  FiMaximize,
  FiVideo,
  FiVolume2,
} from "solid-icons/fi";

type Props = {
  variant: Omit<Schemas["DetailedVariant"], "video_id">;
};

type StatProps = {
  title: string;
  value: string | number;
};

function codecToString<T extends string | { other: string }>(codec: T): string {
  if (typeof codec === "object") {
    return codec.other;
  } else {
    return codec;
  }
}

function formatDuration(secs: number) {
  let hours = Math.floor(secs / (60 * 60));
  let minutes = Math.floor((secs % (60 * 60)) / 60);
  let formattedDuration = "";

  if (hours > 0) {
    formattedDuration += `${hours} h `;
  }
  if (minutes > 0 || (hours === 0 && minutes === 0)) {
    formattedDuration += `${minutes} min`;
  }

  return formattedDuration.trim();
}

function formatSize(bytes: number) {
  let gb = bytes / (1024 * 1024 * 1024);
  let mb = Math.floor(bytes / (1024 * 1024));
  if (gb > 1) {
    return `${gb.toFixed(2)} Gb`;
  }
  return `${mb} Mb`;
}

function Stat(props: StatProps & ParentProps) {
  return (
    <div class="flex w-full items-center justify-start gap-6">
      <div title={props.title}>{props.children}</div>
      <div class="text-xl">{props.value}</div>
    </div>
  );
}

const ICON_SIZE = 30;

export default function Version(props: Props) {
  let { width, height } = props.variant.video_tracks[0].resolution;
  let defaultAudio = () => {
    return props.variant.audio_tracks.find((a) => a.is_default)!;
  };
  let defaultVideo = () => {
    return props.variant.video_tracks.find((a) => a.is_default)!;
  };

  return (
    <div class="grid grid-cols-1 grid-rows-2 place-items-center gap-10 sm:grid-cols-2 md:grid-cols-3">
      <Stat title="Resolution" value={`${width}x${height}`}>
        <FiMaximize size={ICON_SIZE} />
      </Stat>
      <Stat title="Audio codec" value={codecToString(defaultAudio().codec)}>
        <FiVolume2 size={ICON_SIZE} />
      </Stat>
      <Stat title="Duration" value={formatDuration(+props.variant.duration!)}>
        <FiClock size={ICON_SIZE} />
      </Stat>
      <Stat
        title="Video codec"
        value={`${defaultVideo()?.codec} (${defaultVideo()?.profile_idc})`}
      >
        <FiVideo size={ICON_SIZE} />
      </Stat>
      <Stat title="File size" value={formatSize(props.variant.size)}>
        <FiHardDrive size={ICON_SIZE} />
      </Stat>
    </div>
  );
}
