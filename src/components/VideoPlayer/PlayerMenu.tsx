import {
  isBrowserAudioTracksSupported,
  isBrowserVideoTracksSupported,
  SelectedSubtitleTrack,
  useTracksSelection,
} from "@/pages/Watch/TracksSelectionContext";
import { formatCodec, formatResolution } from "@/utils/formats";
import { isCompatible } from "@/utils/mediaCapabilities";
import { Schemas } from "@/utils/serverApi";
import { useQuery } from "@tanstack/solid-query";
import { FiCheck } from "solid-icons/fi";
import { createMemo, For, Match, Show, Switch } from "solid-js";
import { createSignal } from "solid-js";
import { unwrap } from "solid-js/store";

type RowParams =
  | { type: "separator"; title: string }
  | {
      type: "row";
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

export function MenuRow(
  props: Exclude<RowParams, { type: "separator" }> & { borderBottom?: boolean },
) {
  let codecSupport = useQuery(() => ({
    queryFn: async () => (props.codecSupport ? await props.codecSupport : true),
    queryKey: ["codec_support"],
  }));
  let isDisabled = () => !codecSupport.data || props.disabled;

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

export function Separator(props: Exclude<RowParams, { type: "row" }>) {
  return (
    <div class="w-full border-t border-b py-1">
      <span class="text-xs font-bold">{props.title}</span>
    </div>
  );
}

const MAX_ROWS_BEFORE_SCROLL = 5;

function formatSubtitlesTrack(selection?: SelectedSubtitleTrack) {
  if (selection?.origin == "container") {
    return `${selection?.track.language ?? "unknown"}`;
  }
  if (selection?.origin == "external") {
    return `${selection?.id}`;
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
        type: "row",
        key: "Playback speed",
        value: () => formatPlaybackSpeed(props.currentPlaybackSpeed),
        onClick: () => setMenu("playback"),
        root: true,
      },
      {
        type: "row",
        key: "Subtitles",
        value: () => formatSubtitlesTrack(tracks.subtitles),
        onClick: () => setMenu("subtitles"),
        root: true,
      },
      {
        type: "row",
        key: "Audio track",
        value: () => formatAudioTrack(tracks.audio),
        onClick: () => setMenu("audio"),
        root: true,
      },
      {
        type: "row",
        key: "Video track",
        value: () => formatVideoTrack(tracks.video),
        onClick: () => setMenu("video"),
        root: true,
      },
    ],

    subtitles: (): RowParams[] => [
      {
        type: "row",
        key: "None",
        onClick: () => unsetSubtitlesTrack(),
        value: () => tracks.subtitles === undefined,
      },
      ...[
        {
          type: "separator",
          title: "External subtitles",
        } as RowParams,
      ].filter(() => externalSubtitlesTracks().length > 0),
      ...externalSubtitlesTracks().map(
        (s) =>
          ({
            type: "row",
            key: formatSubtitlesTrack({ origin: "external", id: s.id }),
            onClick: () => selectExternalSubtitlesTrack(s.id),
            value: () => {
              const t = tracks.subtitles;
              return t?.origin === "external" && unwrap(t).id === s.id;
            },
            disabled: false,
          }) as RowParams,
      ),
      ...[
        {
          type: "separator",
          title: "Container subtitles",
        } as RowParams,
      ].filter(() => containerSubtitlesTracks().length > 0),
      ...containerSubtitlesTracks().map(
        (s, i) =>
          ({
            type: "row",
            key: formatSubtitlesTrack({ origin: "container", track: s }),
            onClick: () => selectContainerSubtitlesTrack(i),
            value: () => {
              const t = tracks.subtitles;
              return t?.origin === "container" && unwrap(t).track === s;
            },
            disabled: !s.is_text_format,
          }) as RowParams,
      ),
    ],

    audio: (): RowParams[] =>
      audioTracks().map((a, i) => ({
        type: "row",
        key: `${i + 1}. ${formatAudioTrack(a)}`,
        onClick: () => selectAudioTrack(i, props.videoRef),
        value: () => a === unwrap(tracks.audio),
        codecSupport: isCompatible(undefined, a).then((r) => r.audio.supported),
        disabled: !isBrowserAudioTracksSupported(),
      })),

    video: (): RowParams[] =>
      videoTracks().map((v, i) => ({
        type: "row",
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
          type: "row",
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
      class="bg-primary-foreground/80 flex w-80 flex-col overflow-hidden rounded-md px-2 transition-all"
    >
      <div class="w-full overflow-y-auto">
        <Show when={menu() !== "main"}>
          <MenuRow
            type="row"
            key="Back"
            root={false}
            onClick={() => setMenu("main")}
            borderBottom
          />
        </Show>
        <For each={menus[menu()]()}>
          {(row) => (
            <>
              <Show when={row.type == "row"}>
                {(_) => {
                  let r = () =>
                    row as Exclude<RowParams, { type: "separator" }>;
                  return (
                    <MenuRow
                      type="row"
                      key={r().key}
                      value={r().value}
                      root={r().root}
                      codecSupport={r().codecSupport}
                      disabled={r().disabled}
                      onClick={() => {
                        r().onClick();
                        if (!r().root) {
                          setMenu("main");
                        }
                      }}
                    />
                  );
                }}
              </Show>
              <Show when={row.type == "separator"}>
                {(_) => {
                  let r = () => row as Exclude<RowParams, { type: "row" }>;
                  return <Separator type="separator" title={r().title} />;
                }}
              </Show>
            </>
          )}
        </For>
      </div>
    </div>
  );
}
