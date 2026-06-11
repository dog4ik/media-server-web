import { SelectedSubtitleTrack, useTracksSelection } from "@/pages/Watch/TracksSelectionContext";
import { cn } from "@/lib/cn";
import { formatCodec, formatResolution } from "@/utils/formats";
import { Schemas } from "@/utils/serverApi";
import {
  FiArrowLeft,
  FiCheck,
  FiChevronRight,
  FiFastForward,
  FiMusic,
  FiType,
  FiVideo,
} from "solid-icons/fi";
import { createSignal, For, Match, Show, Switch } from "solid-js";
import { Dynamic } from "solid-js/web";
import { unwrap } from "solid-js/store";

type SubMenuKey = "subtitles" | "audio" | "video" | "playback";
type MenuKey = "main" | SubMenuKey;

type IconComponent = typeof FiVideo;

/** A row in the main menu that drills down into a sub menu. */
type NavRow = {
  kind: "nav";
  icon: IconComponent;
  label: string;
  value: () => string;
  target: SubMenuKey;
};

/** A selectable option inside a sub menu. */
type SelectRow = {
  kind: "select";
  label: string;
  selected: () => boolean;
  onSelect: () => void;
  disabled?: boolean;
};

/** A non interactive group label inside a sub menu. */
type SeparatorRow = {
  kind: "separator";
  label: string;
};

type Row = NavRow | SelectRow | SeparatorRow;

type MenuProps = {
  currentPlaybackSpeed: number;
  videoRef: HTMLVideoElement;
  onPlaybackSpeedChange: (speed: number) => void;
};

const ROW_HEIGHT = 48;

const SUB_MENU_TITLES: Record<SubMenuKey, string> = {
  subtitles: "Subtitles",
  audio: "Audio",
  video: "Video",
  playback: "Playback speed",
};

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

function PanelHeader(props: { title: string; onBack: () => void }) {
  return (
    <button
      onClick={props.onBack}
      class="border-border text-popover-foreground hover:bg-accent hover:text-accent-foreground flex h-12 w-full shrink-0 items-center gap-2 border-b px-2 text-sm font-medium transition-colors"
      style={{ height: `${ROW_HEIGHT}px` }}
    >
      <FiArrowLeft class="size-5 shrink-0" />
      <span class="truncate">{props.title}</span>
    </button>
  );
}

function NavMenuRow(props: { row: NavRow; onNavigate: (target: SubMenuKey) => void }) {
  return (
    <button
      onClick={() => props.onNavigate(props.row.target)}
      class="group text-popover-foreground hover:bg-accent hover:text-accent-foreground flex h-12 w-full shrink-0 items-center gap-3 px-3 text-sm transition-colors"
      style={{ height: `${ROW_HEIGHT}px` }}
    >
      <Dynamic
        component={props.row.icon}
        class="text-muted-foreground group-hover:text-accent-foreground size-5 shrink-0 transition-colors"
      />
      <span class="flex-1 truncate text-left">{props.row.label}</span>
      <span class="text-muted-foreground group-hover:text-accent-foreground truncate transition-colors">
        {props.row.value()}
      </span>
      <FiChevronRight class="text-muted-foreground group-hover:text-accent-foreground size-4 shrink-0 transition-colors" />
    </button>
  );
}

function SelectMenuRow(props: { row: SelectRow; onSelected: () => void }) {
  return (
    <button
      disabled={props.row.disabled}
      onClick={() => {
        props.row.onSelect();
        props.onSelected();
      }}
      class="group text-popover-foreground hover:bg-accent hover:text-accent-foreground flex h-12 w-full shrink-0 items-center gap-3 px-3 text-sm transition-colors disabled:pointer-events-none disabled:opacity-40"
      style={{ height: `${ROW_HEIGHT}px` }}
    >
      <span class="flex size-5 shrink-0 items-center justify-center">
        <Show when={props.row.selected()}>
          <FiCheck class="size-5" />
        </Show>
      </span>
      <span class="flex-1 truncate text-left">{props.row.label}</span>
    </button>
  );
}

function SeparatorMenuRow(props: { row: SeparatorRow }) {
  return (
    <div class="text-muted-foreground px-3 pt-3 pb-1 text-xs font-semibold tracking-wide uppercase">
      {props.row.label}
    </div>
  );
}

export default function PlayerMenu(props: MenuProps) {
  let [
    { tracks, videoTracks, audioTracks, containerSubtitlesTracks, externalSubtitlesTracks },
    {
      unsetSubtitlesTrack,
      selectVideoTrack,
      selectAudioTrack,
      selectExternalSubtitlesTrack,
      selectContainerSubtitlesTrack,
    },
  ] = useTracksSelection();

  let [menu, setMenu] = createSignal<MenuKey>("main");
  let [direction, setDirection] = createSignal<"forward" | "backward">("forward");
  let [hasNavigated, setHasNavigated] = createSignal(false);

  function navigate(target: SubMenuKey) {
    setDirection("forward");
    setHasNavigated(true);
    setMenu(target);
  }

  function goToMain() {
    setDirection("backward");
    setHasNavigated(true);
    setMenu("main");
  }

  const menus: Record<MenuKey, () => Row[]> = {
    main: () => [
      {
        kind: "nav",
        icon: FiFastForward,
        label: "Playback speed",
        value: () => formatPlaybackSpeed(props.currentPlaybackSpeed),
        target: "playback",
      },
      {
        kind: "nav",
        icon: FiType,
        label: "Subtitles",
        value: () => formatSubtitlesTrack(tracks.subtitles),
        target: "subtitles",
      },
      {
        kind: "nav",
        icon: FiMusic,
        label: "Audio",
        value: () => formatAudioTrack(tracks.audio),
        target: "audio",
      },
      {
        kind: "nav",
        icon: FiVideo,
        label: "Video",
        value: () => formatVideoTrack(tracks.video),
        target: "video",
      },
    ],

    subtitles: () => [
      {
        kind: "select",
        label: "None",
        selected: () => tracks.subtitles === undefined,
        onSelect: () => unsetSubtitlesTrack(),
      },
      ...(externalSubtitlesTracks().length > 0
        ? [{ kind: "separator", label: "External subtitles" } as SeparatorRow]
        : []),
      ...externalSubtitlesTracks().map(
        (s): SelectRow => ({
          kind: "select",
          label: formatSubtitlesTrack({ origin: "external", id: s.id }),
          selected: () => {
            let t = tracks.subtitles;
            return t?.origin === "external" && unwrap(t).id === s.id;
          },
          onSelect: () => selectExternalSubtitlesTrack(s.id),
        }),
      ),
      ...(containerSubtitlesTracks().length > 0
        ? [{ kind: "separator", label: "Container subtitles" } as SeparatorRow]
        : []),
      ...containerSubtitlesTracks().map(
        (s, i): SelectRow => ({
          kind: "select",
          label: formatSubtitlesTrack({ origin: "container", track: s }),
          selected: () => {
            let t = tracks.subtitles;
            return t?.origin === "container" && unwrap(t).track === s;
          },
          onSelect: () => selectContainerSubtitlesTrack(i),
          disabled: !s.is_text_format,
        }),
      ),
    ],

    audio: () =>
      audioTracks().map(
        (a, i): SelectRow => ({
          kind: "select",
          label: `${i + 1}. ${formatAudioTrack(a)}`,
          selected: () => a === unwrap(tracks.audio),
          onSelect: () => selectAudioTrack(i),
        }),
      ),

    video: () =>
      videoTracks().map(
        (v, i): SelectRow => ({
          kind: "select",
          label: `${i + 1}. ${formatVideoTrack(v)}`,
          selected: () => v === unwrap(tracks.video),
          onSelect: () => selectVideoTrack(i, props.videoRef),
          disabled: false,
        }),
      ),

    playback: () =>
      [...Array(4)].map((_, i): SelectRow => {
        let speed = (i + 1) / 2;
        return {
          kind: "select",
          label: formatPlaybackSpeed(speed),
          selected: () => props.currentPlaybackSpeed === speed,
          onSelect: () => props.onPlaybackSpeedChange(speed),
        };
      }),
  };

  return (
    <div class="bg-popover/95 text-popover-foreground border-border w-80 overflow-hidden rounded-xl border shadow-xl backdrop-blur-md">
      <div class="max-h-72 overflow-x-hidden overflow-y-auto">
        <Show when={menu()} keyed>
          {(key) => (
            <div
              class={cn(
                "flex flex-col",
                hasNavigated() &&
                  (direction() === "forward"
                    ? "animate-slide-from-right"
                    : "animate-slide-from-left"),
              )}
            >
              <Show when={key !== "main"}>
                <PanelHeader title={SUB_MENU_TITLES[key as SubMenuKey]} onBack={goToMain} />
              </Show>
              <For each={menus[key]()}>
                {(row) => (
                  <Switch>
                    <Match when={row.kind === "separator" && row}>
                      {(sep) => <SeparatorMenuRow row={sep()} />}
                    </Match>
                    <Match when={row.kind === "nav" && row}>
                      {(nav) => <NavMenuRow row={nav()} onNavigate={navigate} />}
                    </Match>
                    <Match when={row.kind === "select" && row}>
                      {(sel) => <SelectMenuRow row={sel()} onSelected={goToMain} />}
                    </Match>
                  </Switch>
                )}
              </For>
            </div>
          )}
        </Show>
      </div>
    </div>
  );
}
