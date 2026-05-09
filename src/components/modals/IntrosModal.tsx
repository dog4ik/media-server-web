import { Schemas, server } from "@/utils/serverApi";
import { createEffect, createMemo, createSignal, For, ParentProps, Show } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { DynamicIntro, STRIP_FACTOR } from "../Description/IntroBar";
import { Button } from "@/ui/button";
import { ExtendedEpisode } from "@/utils/library";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { formatDuration, parseDuration } from "@/utils/formats";
import { FiPlusCircle, FiSave, FiTrash2 } from "solid-icons/fi";

type EpisodeData = {
  intro: Schemas["Intro"] | undefined;
  originalIntro: Schemas["Intro"] | undefined;
  videoId: number | undefined;
  duration: number;
  loading: boolean;
  saving: boolean;
};

function defaultIntro(duration: number) {
  return { start_sec: 0, end_sec: Math.max(Math.floor(duration / 8), 1) };
}

function cmpIntro(lhs: Schemas["Intro"] | undefined, rhs: Schemas["Intro"] | undefined) {
  if (lhs === undefined && rhs === undefined) return true;
  if (!lhs || !rhs) return false;
  return (
    Math.floor(lhs.start_sec) === Math.floor(rhs.start_sec) &&
    Math.floor(lhs.end_sec) === Math.floor(rhs.end_sec)
  );
}

type SecondsInputProps = {
  value: number;
  onChange: (seconds: number) => void;
  max: number;
  min: number;
} & ParentProps;

function SecondsInput(props: SecondsInputProps) {
  let [rawValue, setRawValue] = createSignal(formatDuration(props.value * 1000));

  // Sync display when value changes externally (e.g. slider drag)
  createEffect(() => setRawValue(formatDuration(props.value * 1000)));

  function onBlur() {
    let parsed = parseDuration(rawValue());
    if (parsed !== undefined) {
      props.onChange(Math.max(Math.min(parsed, props.max), props.min));
    } else {
      setRawValue(formatDuration(props.value * 1000));
    }
  }

  return (
    <div class="flex flex-col gap-1">
      <span class="text-xs text-muted-foreground">{props.children}</span>
      <div class="flex items-center rounded-md border border-white/10 bg-white/4">
        <button
          class="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          onClick={() => props.onChange(Math.max(props.value - 1, props.min))}
        >
          <svg
            class="size-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
          >
            <path d="M5 12h14" />
          </svg>
        </button>
        <input
          class="h-8 w-20 min-w-0 bg-transparent text-center text-sm outline-none"
          value={rawValue()}
          onInput={(e) => setRawValue(e.currentTarget.value)}
          onBlur={onBlur}
        />
        <button
          class="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          onClick={() => props.onChange(Math.min(props.value + 1, props.max))}
        >
          <svg
            class="size-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </div>
  );
}

type IntroRowProps = {
  episode: ExtendedEpisode;
  data: EpisodeData;
  onChange: (intro: Schemas["Intro"]) => void;
  onReset: () => void;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
};

function IntroRow(props: IntroRowProps) {
  let hasChanged = () => !cmpIntro(props.data.originalIntro, props.data.intro);
  let isDisabled = () => props.data.loading || props.data.saving;

  return (
    <div class="flex flex-col gap-2 py-4">
      <div class="flex items-center justify-between">
        <div class="flex flex-col">
          <span class="text-sm font-medium">E{props.episode.number}</span>
          <span class="text-xs text-muted-foreground">{props.episode.title}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <Button
            disabled={isDisabled() || !hasChanged()}
            onClick={props.onReset}
            size="sm"
            variant="ghost"
            class="h-7 px-2 text-xs"
          >
            Reset
          </Button>
          <Button
            disabled={isDisabled() || !hasChanged()}
            onClick={props.onSave}
            size="sm"
            class="h-7 px-3 text-xs gap-1.5"
          >
            <FiSave size={12} />
            {props.data.saving ? "Saving…" : "Save"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={props.onDelete}
            disabled={isDisabled() || props.data.intro === undefined}
            class="h-7 w-7 p-0 text-destructive hover:text-destructive"
          >
            <FiTrash2 size={14} />
          </Button>
        </div>
      </div>

      <Show
        when={!props.data.loading}
        fallback={<div class="h-14 animate-pulse rounded-md bg-white/4" />}
      >
        <Show
          when={props.data.intro !== undefined}
          fallback={
            <button
              onClick={() => props.onChange(defaultIntro(props.data.duration))}
              disabled={props.data.videoId === undefined}
              class="flex h-14 w-full items-center justify-center gap-2 rounded-md border border-dashed border-white/20 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
            >
              <FiPlusCircle size={15} />
              Add intro
            </button>
          }
        >
          <div class="rounded-md bg-white/3 px-4 py-1">
            <DynamicIntro
              totalDuration={props.data.duration}
              start={props.data.intro!.start_sec}
              end={props.data.intro!.end_sec}
              onChange={props.onChange}
            />
            <div class="flex items-center gap-4 pb-2">
              <SecondsInput
                onChange={(v) =>
                  props.onChange({ start_sec: v, end_sec: props.data.intro!.end_sec })
                }
                value={props.data.intro!.start_sec}
                max={props.data.intro!.end_sec}
                min={0}
              >
                Start
              </SecondsInput>
              <SecondsInput
                onChange={(v) =>
                  props.onChange({ start_sec: props.data.intro!.start_sec, end_sec: v })
                }
                value={props.data.intro!.end_sec}
                max={props.data.duration}
                min={props.data.intro!.start_sec}
              >
                End
              </SecondsInput>
              <span class="ml-auto text-xs text-muted-foreground">
                {Math.floor(props.data.intro!.end_sec - props.data.intro!.start_sec)}s
              </span>
            </div>
          </div>
        </Show>
      </Show>
    </div>
  );
}

type Props = {
  episodes: ExtendedEpisode[];
  show_id: number;
  season: number;
  open: boolean;
  onClose: () => void;
};

export function IntrosModal(props: Props) {
  let [data, setData] = createStore<EpisodeData[]>([]);
  let [masterIntro, setMasterIntro] = createSignal<Schemas["Intro"] | undefined>(undefined);

  let masterDuration = createMemo(() => {
    let max = 0;
    for (let d of data) {
      if (!d.loading && d.duration > max) max = d.duration;
    }
    return max;
  });

  createEffect(() => {
    if (!props.open) return;
    setMasterIntro(undefined);
    let episodes = props.episodes;
    setData(
      reconcile(
        episodes.map((ep) => ({
          intro: ep.local?.intro ?? undefined,
          originalIntro: ep.local?.intro ?? undefined,
          videoId: undefined,
          duration: 0,
          loading: true,
          saving: false,
        })),
      ),
    );
    episodes.forEach(async (ep, i) => {
      let videos = await ep.fetchVideos();
      let video = videos?.[0];
      if (video) {
        setData(i, {
          videoId: video.details.id,
          duration: video.details.duration / 1000,
          loading: false,
        });
      } else {
        setData(i, "loading", false);
      }
    });
  });

  function applyMaster(intro: Schemas["Intro"]) {
    setMasterIntro(intro);
    for (let i = 0; i < data.length; i++) {
      let d = data[i];
      if (!d.loading && d.duration > 0) {
        let maxSec = d.duration / STRIP_FACTOR;
        let clampedEnd = Math.min(intro.end_sec, maxSec);
        let clampedStart = Math.min(intro.start_sec, clampedEnd);
        setData(i, "intro", { start_sec: clampedStart, end_sec: clampedEnd });
      }
    }
  }

  async function save(index: number) {
    let d = data[index];
    if (!d.intro || d.videoId === undefined) return;
    setData(index, "saving", true);
    await server.PUT("/api/video/{video_id}/intro", {
      params: { path: { video_id: d.videoId } },
      body: { start: Math.floor(d.intro.start_sec), end: Math.floor(d.intro.end_sec) },
    });
    setData(index, { saving: false, originalIntro: { ...d.intro } });
  }

  async function remove(index: number) {
    let d = data[index];
    if (d.videoId === undefined) return;
    setData(index, "saving", true);
    await server.DELETE("/api/video/{video_id}/intro", {
      params: { path: { video_id: d.videoId } },
    });
    setData(index, { saving: false, intro: undefined, originalIntro: undefined });
  }

  async function saveAll() {
    await Promise.all(data.map((_, i) => save(i)));
  }

  let anyChanged = createMemo(() => data.some((d) => !cmpIntro(d.intro, d.originalIntro)));

  return (
    <Dialog open={props.open} onOpenChange={(isOpen) => isOpen || props.onClose()}>
      <DialogContent class="flex h-[80vh] w-170 max-w-[95vw] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader class="shrink-0 border-b border-white/8 px-6 py-4">
          <DialogTitle class="text-base font-semibold">
            Manage intros — Season {props.season}
          </DialogTitle>
        </DialogHeader>

        <div class="shrink-0 border-b border-white/8 px-6 py-3">
          <div class="flex items-center gap-3">
            <span class="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              All
            </span>
            <div class="flex-1">
              <Show
                when={masterDuration() > 0}
                fallback={<div class="h-8 animate-pulse rounded-md bg-white/4" />}
              >
                <Show
                  when={masterIntro()}
                  fallback={
                    <button
                      onClick={() => applyMaster(defaultIntro(masterDuration()))}
                      class="flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-white/15 text-xs text-muted-foreground/60 transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      <FiPlusCircle size={12} />
                      Set range for all episodes
                    </button>
                  }
                >
                  {(intro) => (
                    <DynamicIntro
                      compact
                      totalDuration={masterDuration()}
                      start={intro().start_sec}
                      end={intro().end_sec}
                      onChange={applyMaster}
                    />
                  )}
                </Show>
              </Show>
            </div>
            <Button
              size="sm"
              disabled={!anyChanged()}
              onClick={saveAll}
              class="h-7 shrink-0 px-3 text-xs gap-1.5"
            >
              <FiSave size={12} />
              Save all
            </Button>
          </div>
        </div>

        <div class="flex-1 divide-y divide-white/6 overflow-y-auto px-6">
          <For each={props.episodes}>
            {(episode, i) => (
              <Show when={data[i()]}>
                {(d) => (
                  <IntroRow
                    episode={episode}
                    data={d()}
                    onChange={(intro) => setData(i(), "intro", intro)}
                    onReset={() => setData(i(), "intro", data[i()].originalIntro)}
                    onSave={() => save(i())}
                    onDelete={() => remove(i())}
                  />
                )}
              </Show>
            )}
          </For>
        </div>
      </DialogContent>
    </Dialog>
  );
}
