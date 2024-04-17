import { FiCheck } from "solid-icons/fi";
import { For, Match, Show, Switch } from "solid-js";
import { createSignal } from "solid-js";
import { Subtitle } from "../../pages/Watch";

type RowParams = {
  key: string;
  value?: () => string | number | boolean | undefined;
  root: boolean;
  onClick: () => void;
};

type MenuProps = {
  currentPlaybackSpeed: number;
  selectedSubtitles?: string;
  availableSubtitles: Subtitle[];
  onSubtitlesChange: (subtitle: Subtitle) => void;
  onPlaybackSpeedChange: (speed: number) => void;
};

export function MenuRow(props: RowParams & { borderBottom?: boolean }) {
  return (
    <button
      onClick={props.onClick}
      class={`flex h-16 items-center justify-between ${props.borderBottom ? "border-b" : ""}`}
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

export default function PlayerMenu(props: MenuProps) {
  const MAIN_MENU: RowParams[] = [
    {
      key: "Playback speed",
      value: () => props.currentPlaybackSpeed,
      onClick: () => setMenu(PLAYBACK_MENU),
      root: true,
    },
    {
      key: "Selected Subtitle",
      value: () => props.selectedSubtitles,
      onClick: () => setMenu(SUBTITLES_MENU),
      root: true,
    },
  ];

  const SUBTITLES_MENU: RowParams[] = props.availableSubtitles.map((s) => {
    return {
      key: s.language ?? "unknown",
      onClick: () => {
        props.onSubtitlesChange(s);
      },
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
        height: `${(menu().length + (menu() === MAIN_MENU ? 0 : 1)) * 64}px`,
      }}
      class="flex w-60 flex-col overflow-hidden rounded-xl bg-black/80 px-2 py-0.5 transition-all"
    >
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
  );
}
