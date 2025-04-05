import { useTracksSelection } from "@/pages/Watch/TracksSelectionContext";
import { formatCodec } from "@/utils/formats";
import { FiCheck } from "solid-icons/fi";
import { For, Match, Show, Switch } from "solid-js";
import { createSignal } from "solid-js";
import { unwrap } from "solid-js/store";

type RowParams = {
  key: string;
  value?: () => string | number | boolean | undefined;
  root: boolean;
  onClick: () => void;
};

type MenuProps = {
  currentPlaybackSpeed: number;
  videoRef: HTMLVideoElement;
  onPlaybackSpeedChange: (speed: number) => void;
};

export function MenuRow(props: RowParams & { borderBottom?: boolean }) {
  return (
    <button
      onClick={props.onClick}
      class={`flex h-12 w-full shrink-0 items-center justify-between ${props.borderBottom ? "border-b" : ""}`}
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

  const MAIN_MENU: RowParams[] = [
    {
      key: "Playback speed",
      value: () => props.currentPlaybackSpeed,
      onClick: () => setMenu(PLAYBACK_MENU),
      root: true,
    },
    {
      key: "Subtitles",
      value: () => tracks.subtitles?.origin ?? "none",
      onClick: () => setMenu(SUBTITLES_MENU),
      root: true,
    },
    {
      key: "Audio track",
      value: () => tracks.audio?.language ?? "none",
      onClick: () => setMenu(AUDIO_TARCKS_MENU),
      root: true,
    },
    {
      key: "Video track",
      value: () =>
        tracks.video?.codec ? formatCodec(tracks.video.codec) : "unknown",
      onClick: () => setMenu(VIDEO_TRACKS_MENU),
      root: true,
    },
  ];

  const SUBTITLES_MENU: RowParams[] = [
    {
      key: "None",
      onClick: () => unsetSubtitlesTrack(),
      value: () => (tracks.subtitles ? "" : "✓"),
      root: false,
    },
    ...containerSubtitlesTracks().map((s, i) => {
      return {
        key: s.language ?? "unknown",
        onClick: () => selectContainerSubtitlesTrack(i),
        value: () => {
          let track = tracks.subtitles;
          if (track?.origin != "container") return;
          let unwrappedTrack = unwrap(track);
          if (unwrappedTrack.track == s) {
            return "✓";
          }
        },
        root: false,
      };
    }),
  ];

  const AUDIO_TARCKS_MENU: RowParams[] = audioTracks().map((a, i) => {
    return {
      key: a.language ?? "unknown",
      onClick: () => {
        selectAudioTrack(i);
      },
      value: () => (a == unwrap(tracks.audio) ? "✓" : ""),
      root: false,
    };
  });

  const VIDEO_TRACKS_MENU: RowParams[] = videoTracks().map((v, i) => {
    return {
      key: formatCodec(v.codec),
      onClick: () => selectVideoTrack(i),
      value: () => (v == unwrap(tracks.video) ? "✓" : ""),
      root: false,
    };
  });

  const PLAYBACK_MENU: RowParams[] = [...Array(4)].map((_, i) => {
    let key = (i + 1) / 2;
    return {
      key: key.toString(),
      value: () => props.currentPlaybackSpeed === key,
      onClick: () => props.onPlaybackSpeedChange(key),
      root: false,
    };
  });

  let [menu, setMenu] = createSignal<RowParams[]>(MAIN_MENU);

  return (
    <div
      style={{
        height: `${Math.min(menu().length + (menu() === MAIN_MENU ? 0 : 1), MAX_ROWS_BEFORE_SCROLL) * 48}px`,
      }}
      class="flex w-60 flex-col overflow-hidden rounded-md bg-primary-foreground/80 px-2 transition-all"
    >
      <div class="w-full overflow-y-auto">
        <Show when={menu() !== MAIN_MENU}>
          <MenuRow
            key="Back"
            root={false}
            onClick={() => setMenu(MAIN_MENU)}
            borderBottom
          />
        </Show>
        <For each={menu()}>
          {(row) => (
            <MenuRow
              key={row.key}
              value={row.value}
              root={row.root}
              onClick={() => {
                row.onClick();
                if (!row.root) {
                  setMenu(MAIN_MENU);
                }
              }}
            />
          )}
        </For>
      </div>
    </div>
  );
}
