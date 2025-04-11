import {
  isBrowserAudioTracksSupported,
  isBrowserVideoTracksSupported,
  SelectedSubtitleTrack,
  useTracksSelection,
} from "@/pages/Watch/TracksSelectionContext";
import { formatCodec, formatResolution } from "@/utils/formats";
import { isCompatible } from "@/utils/mediaCapabilities/mediaCapabilities";
import { Schemas } from "@/utils/serverApi";
import { createAsync } from "@solidjs/router";
import { FiCheck } from "solid-icons/fi";
import { createMemo, For, Match, Show, Switch } from "solid-js";
import { createSignal } from "solid-js";
import { unwrap } from "solid-js/store";

type RowParams = {
  key: string;
  value?: () => string | number | boolean | undefined;
  root?: boolean;
  onClick: () => void;
  codecSupport?: Promise<boolean>;
  disabled?: boolean;
};

type MenuProps = {
  currentPlaybackSpeed: number;
  videoRef: HTMLVideoElement;
  onPlaybackSpeedChange: (speed: number) => void;
};

export function MenuRow(props: RowParams & { borderBottom?: boolean }) {
  let codecSupport = createAsync(async () =>
    props.codecSupport ? await props.codecSupport : true,
  );
  let isDisabled = () => !codecSupport() || props.disabled;

  return (
    <button
      disabled={isDisabled()}
      onClick={props.onClick}
      class={`flex h-12 w-full shrink-0 items-center justify-between disabled:text-gray-700 ${props.borderBottom ? "border-b" : ""}`}
    >
      <span>{props.key}</span>
      <Switch>
        <Match
          when={
            props.value &&
            (typeof props.value() == "string" ||
              typeof props.value() == "number")
          }
        >
          <span>{props.value && props.value()}</span>
        </Match>
        <Match when={props.value && typeof props.value() == "boolean"}>
          <Show when={props.value!()}>
            <FiCheck size={20} />
          </Show>
        </Match>
      </Switch>
    </button>
  );
}

const MAX_ROWS_BEFORE_SCROLL = 5;

function formatSubtitlesTrack(selection?: SelectedSubtitleTrack) {
  if (selection?.origin == "container") {
    return `${selection?.track.language ?? "unknown"} (container)`;
  }
  if (selection?.origin == "external") {
    return `${selection?.id} (external)`;
  }
  if (selection?.origin == "imported") {
    return "Imported";
  }
  return "None";
}

function formatAudioTrack(track?: {
  language?: string | null | undefined;
  codec: Schemas["AudioCodec"];
}) {
  if (track) {
    return `${track.language ?? "unknown"} (${formatCodec(track.codec)})`;
  }
  return "None";
}

function formatVideoTrack(track?: {
  resolution: Schemas["Resolution"];
  codec: Schemas["VideoCodec"];
}) {
  if (track) {
    return `${formatResolution(track.resolution)} (${formatCodec(track.codec)})`;
  }
  return "None";
}

function formatPlaybackSpeed(speed: number) {
  return `${speed}x`;
}

export default function PlayerMenu(props: MenuProps) {
  let [
    {
      tracks,
      videoTracks,
      audioTracks,
      containerSubtitlesTracks,
      externalSubtitlesTracks,
    },
    {
      unsetSubtitlesTrack,

      selectVideoTrack,
      selectAudioTrack,
      selectExternalSubtitlesTrack,
      selectImportedSubtitlesTrack,
      selectContainerSubtitlesTrack,
    },
  ] = useTracksSelection();

  let [menu, setMenu] = createSignal<keyof typeof menus>("main");

  const menus = {
    main: (): RowParams[] => [
      {
        key: "Playback speed",
        value: () => formatPlaybackSpeed(props.currentPlaybackSpeed),
        onClick: () => setMenu("playback"),
        root: true,
      },
      {
        key: "Subtitles",
        value: () => formatSubtitlesTrack(tracks.subtitles),
        onClick: () => setMenu("subtitles"),
        root: true,
      },
      {
        key: "Audio track",
        value: () => formatAudioTrack(tracks.audio),
        onClick: () => setMenu("audio"),
        root: true,
      },
      {
        key: "Video track",
        value: () => formatVideoTrack(tracks.video),
        onClick: () => setMenu("video"),
        root: true,
      },
    ],

    subtitles: (): RowParams[] => [
      {
        key: "None",
        onClick: () => unsetSubtitlesTrack(),
        value: () => tracks.subtitles === undefined,
      },
      ...containerSubtitlesTracks().map((s, i) => ({
        key: formatSubtitlesTrack({ origin: "container", track: s }),
        onClick: () => selectContainerSubtitlesTrack(i),
        value: () => {
          const t = tracks.subtitles;
          return t?.origin === "container" && unwrap(t).track === s;
        },
      })),
    ],

    audio: (): RowParams[] =>
      audioTracks().map((a, i) => ({
        key: `${i + 1}. ${formatAudioTrack(a)}`,
        onClick: () => selectAudioTrack(i, props.videoRef),
        value: () => a === unwrap(tracks.audio),
        codecSupport: isCompatible(undefined, a).then((r) => r.audio.supported),
        disabled: !isBrowserAudioTracksSupported(),
      })),

    video: (): RowParams[] =>
      videoTracks().map((v, i) => ({
        key: `${i + 1}. ${formatVideoTrack(v)}`,
        onClick: () => selectVideoTrack(i, props.videoRef),
        value: () => v === unwrap(tracks.video),
        codecSupport: isCompatible(v, undefined).then((r) => r.video.supported),
        disabled: !isBrowserVideoTracksSupported(),
      })),

    playback: (): RowParams[] =>
      [...Array(4)].map((_, i) => {
        let speed = (i + 1) / 2;
        return {
          key: formatPlaybackSpeed(speed),
          value: () => props.currentPlaybackSpeed === speed,
          onClick: () => props.onPlaybackSpeedChange(speed),
        };
      }),
  };

  const menuHeight = createMemo(
    () =>
      Math.min(
        menus[menu()]().length + (menu() === "main" ? 0 : 1),
        MAX_ROWS_BEFORE_SCROLL,
      ) * 48,
  );

  return (
    <div
      style={{
        height: `${menuHeight()}px`,
      }}
      class="flex w-80 flex-col overflow-hidden rounded-md bg-primary-foreground/80 px-2 transition-all"
    >
      <div class="w-full overflow-y-auto">
        <Show when={menu() !== "main"}>
          <MenuRow
            key="Back"
            root={false}
            onClick={() => setMenu("main")}
            borderBottom
          />
        </Show>
        <For each={menus[menu()]()}>
          {(row) => (
            <MenuRow
              key={row.key}
              value={row.value}
              root={row.root}
              codecSupport={row.codecSupport}
              disabled={row.disabled}
              onClick={() => {
                row.onClick();
                if (!row.root) {
                  setMenu("main");
                }
              }}
            />
          )}
        </For>
      </div>
    </div>
  );
}
