import { FiCheck, FiRefreshCcw, FiX } from "solid-icons/fi";
import { For, Show, createEffect, createMemo, createSignal, untrack } from "solid-js";
import { Button } from "@/ui/button";
import { Progress } from "@/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/ui/dropdown-menu";
import { useServerStatus } from "@/context/ServerStatusContext";
import { Schemas } from "@/utils/serverApi";
import { queryApi } from "@/utils/queryApi";
import { useNotifications } from "@/context/NotificationContext";
import { cn } from "@/utils/cn";
import tracing from "@/utils/tracing";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/ui/tooltip";

const PHASES = [
  { type: "metadata_fetch", label: "Fetching metadata" },
  { type: "metadata_save", label: "Saving metadata" },
  { type: "assets_save", label: "Saving assets" },
] as const;

const METADATA_FETCH_PHASE_IDX = 0;
const DB_SAVE_PHASE_IDX = 1;
const ASSETS_SAVE_PHASE_IDX = 2;

type PhaseIndex = 0 | 1 | 2;

type ScanView = {
  phaseIndex: PhaseIndex;
  phaseLabel: string;
  done?: number;
  total?: number;
  failed: number;
  /** Progress within the current phase, 0..1. */
  fraction: number;
  /** Progress across the whole scan, 0..1. */
  overall: number;
  /** True while the active phase reports no measurable progress. */
  indeterminate: boolean;
};

function deriveScanView(progress: Schemas["ProgressChunk"] | undefined): ScanView {
  if (!progress) {
    return {
      phaseIndex: METADATA_FETCH_PHASE_IDX,
      phaseLabel: "Starting scan",
      failed: 0,
      fraction: 0,
      overall: 0,
      indeterminate: true,
    };
  }
  if (progress.type === "metadata_fetch") {
    let done = progress.success_count + progress.fail_count;
    let total = progress.total_video_files;
    let fraction = total > 0 ? done / total : 0;
    return {
      phaseIndex: METADATA_FETCH_PHASE_IDX,
      phaseLabel: "Fetching metadata",
      done,
      total,
      failed: progress.fail_count,
      fraction,
      overall: fraction / PHASES.length,
      indeterminate: total === 0,
    };
  }
  if (progress.type === "metadata_save") {
    return {
      phaseIndex: DB_SAVE_PHASE_IDX,
      phaseLabel: "Saving metadata",
      failed: 0,
      fraction: 0,
      overall: 1 / PHASES.length,
      indeterminate: true,
    };
  }
  let done = progress.success_count + progress.fail_count;
  let total = progress.total_assets_count;
  let fraction = total > 0 ? done / total : 0;
  return {
    phaseIndex: ASSETS_SAVE_PHASE_IDX,
    phaseLabel: "Saving assets",
    done,
    total,
    failed: progress.fail_count,
    fraction,
    overall: (2 + fraction) / PHASES.length,
    indeterminate: total === 0,
  };
}

function ProgressRing(props: { progress: number; indeterminate?: boolean }) {
  const RADIUS = 15;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  let offset = () => CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, props.progress)));
  return (
    <svg viewBox="0 0 36 36" class="absolute inset-0 size-full -rotate-90">
      <circle cx="18" cy="18" r={RADIUS} fill="none" stroke-width="3" class="stroke-white/15" />
      <circle
        cx="18"
        cy="18"
        r={RADIUS}
        fill="none"
        stroke-width="3"
        stroke-linecap="round"
        stroke-dasharray={`${CIRCUMFERENCE}`}
        stroke-dashoffset={`${offset()}`}
        class={cn(
          "stroke-primary transition-[stroke-dashoffset] duration-500 ease-out",
          props.indeterminate && "animate-pulse",
        )}
      />
    </svg>
  );
}

function PhaseSteps(props: { current: number }) {
  return (
    <div class="flex items-center gap-1">
      <For each={PHASES}>
        {(phase, i) => {
          let state = () =>
            i() < props.current ? "done" : i() === props.current ? "active" : "todo";
          return (
            <>
              <Show when={i() > 0}>
                <div
                  class={cn(
                    "h-px flex-1 transition-colors",
                    i() <= props.current ? "bg-primary" : "bg-white/15",
                  )}
                />
              </Show>
              <div
                class={cn(
                  "flex size-5 items-center justify-center rounded-full text-[10px] font-semibold transition-colors",
                  state() === "done" && "bg-primary text-primary-foreground",
                  state() === "active" && "bg-primary/20 text-primary ring-primary ring-2",
                  state() === "todo" && "bg-white/10 text-muted-foreground",
                )}
                title={phase.label}
              >
                <Show when={state() === "done"} fallback={i() + 1}>
                  <FiCheck size={10} />
                </Show>
              </div>
            </>
          );
        }}
      </For>
    </div>
  );
}

const LANGUAGE_LABELS: Record<Schemas["Language"], string> = {
  en: "English",
  es: "Spanish",
  de: "German",
  fr: "French",
  ru: "Russian",
  ja: "Japanese",
  sr: "Serbian",
};

function FailedContentList(props: { failed: Schemas["FailedContent"][] }) {
  return (
    <div class="flex flex-col gap-1.5 border-t p-3">
      <span class="text-muted-foreground text-xs font-medium">
        Failed to match ({props.failed.length})
      </span>
      <ul class="divide-border max-h-40 divide-y overflow-y-auto rounded-md border">
        <For each={props.failed}>
          {(item) => (
            <li class="flex flex-col gap-1 px-2 py-1.5">
              <div class="flex items-center justify-between gap-2">
                <p class="truncate text-xs font-medium" title={item.title}>
                  {item.title}
                </p>
                <span class="text-muted-foreground bg-muted shrink-0 rounded px-1.5 py-0.5 text-[10px] capitalize">
                  {item.content_type}
                </span>
              </div>
              <ul class="flex flex-col gap-0.5">
                <For each={item.videos}>
                  {(path) => (
                    <li
                      dir="rtl"
                      class="text-muted-foreground truncate text-left font-mono text-[10px]"
                      title={path}
                    >
                      {/* `dir=rtl` keeps the filename visible when the path is truncated. */}
                      <bdi>{path}</bdi>
                    </li>
                  )}
                </For>
              </ul>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}

function ScanDetails(props: {
  progress: Schemas["ProgressChunk"] | undefined;
  config: Schemas["ScanConfig"] | undefined;
  failed: Schemas["FailedContent"][];
  finished?: boolean;
}) {
  let view = createMemo(() => deriveScanView(props.progress));
  // A clean finish completes every phase and pins the bar to 100%
  let complete = () => props.finished;
  let showBar = () => complete() || !view().indeterminate;
  let barValue = () => (complete() ? 100 : view().fraction * 100);
  let title = () => (props.finished ? "Scan complete" : view().phaseLabel);
  return (
    <>
      <div class="flex flex-col gap-3 p-3">
        <div class="flex items-center justify-between gap-4">
          <span class={"text-sm font-semibold"}>{title()}</span>
          <Show
            when={complete()}
            fallback={
              <Show when={!view().indeterminate}>
                <span class="text-muted-foreground text-xs tabular-nums">
                  {Math.round(view().fraction * 100)}%
                </span>
              </Show>
            }
          >
            <span class="text-muted-foreground text-xs">Done</span>
          </Show>
        </div>

        <PhaseSteps current={complete() ? PHASES.length : view().phaseIndex} />

        <Show
          when={showBar()}
          fallback={
            <div class="bg-primary/20 relative h-2 w-full overflow-hidden rounded-full">
              <div class="bg-primary absolute inset-y-0 w-1/3 animate-[scan-indeterminate_1.2s_ease-in-out_infinite] rounded-full" />
            </div>
          }
        >
          <Progress value={barValue()} />
        </Show>

        <div class="text-muted-foreground flex items-center justify-between text-xs">
          <Show when={view().total !== undefined}>
            <span class="tabular-nums">
              {view().done} / {view().total} files
            </span>
          </Show>
          <Show when={view().failed > 0}>
            <span class="text-destructive tabular-nums">{view().failed} failed</span>
          </Show>
        </div>

        <Show when={!props.finished && props.config}>
          {(config) => (
            <div class="text-muted-foreground flex items-center justify-between text-xs">
              <Show
                when={view().phaseIndex == ASSETS_SAVE_PHASE_IDX}
                fallback={
                  <>
                    <span>Language</span>
                    <span class="text-foreground">
                      {LANGUAGE_LABELS[config().fetch_params.lang]}
                    </span>
                  </>
                }
              >
                <span>Asset concurrency</span>
                <span class="text-foreground tabular-nums">{config().max_asset_concurrency}</span>
              </Show>
            </div>
          )}
        </Show>
      </div>

      <Show when={props.failed.length > 0}>
        <FailedContentList failed={props.failed} />
      </Show>
    </>
  );
}

type ScanState = "idle" | "running" | "finished";

export default function ScanButton() {
  let [{ tasks, serverStatus }] = useServerStatus();
  let notificator = useNotifications();

  let [open, setOpen] = createSignal(false);

  let mutation = queryApi.useMutation("post", "/api/scan", () => ({
    onError(err) {
      tracing.error("Failed to initiate library scan");
      notificator(`Scan failed: ${err.message}`);
      setOpen(false);
    },
  }));

  let startScan = () => {
    setOpen(true);
    mutation.mutate({});
  };

  let [state, setState] = createSignal<ScanState>("idle");
  let [scanTaskRef, setScanTaskRef] = createSignal<Schemas["Task_LibraryScanTask"]>();

  createEffect(() => {
    let live = tasks.library_scan_tasks.at(0);
    if (live && untrack(scanTaskRef) === undefined && untrack(state) === "idle") {
      setScanTaskRef(live);
      setState("running");
    }
  });

  serverStatus.addProgressHandler("libraryscan", (event) => {
    if (event.progress_type === "start") {
      setState("running");
      setScanTaskRef(tasks.library_scan_tasks.at(0) ?? event.task);
    }
    // scan event is infallible
    if (event.progress_type == "finish") {
      setState("finished");
    }
  });

  let discard = () => {
    setState("idle");
    setScanTaskRef(undefined);
    setOpen(false);
  };

  let isFinished = () => state() === "finished";
  let overall = () => {
    let s = state();
    if (s === "finished") return 1;
    if (s === "running") return deriveScanView(scanTaskRef()?.latest_progress ?? undefined).overall;
    return 0;
  };

  return (
    <Show
      when={scanTaskRef()}
      fallback={
        <Tooltip>
          <TooltipTrigger as={Button} onClick={startScan} aria-label="Scan library">
            <FiRefreshCcw size={20} />
          </TooltipTrigger>
          <TooltipContent>Scan library</TooltipContent>
        </Tooltip>
      }
    >
      {(scanTask) => (
        <DropdownMenu modal={false} open={open()} onOpenChange={setOpen}>
          <DropdownMenuTrigger
            as={Button}
            variant="ghost"
            aria-label="Library scan progress"
            class="relative hover:bg-transparent size-9 cursor-default p-0"
          >
            <ProgressRing
              progress={overall()}
              indeterminate={state() === "running" && overall() <= 0}
            />
            <Show
              when={isFinished()}
              fallback={<FiRefreshCcw size={18} class="animate-spin text-white" />}
            >
              <FiCheck size={18} class="text-primary" />
            </Show>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-80 p-0">
            <div class="flex items-center justify-between border-b px-3 py-2">
              <span class="text-sm font-semibold">
                {isFinished() ? "Library scan" : "Scanning library"}
              </span>
              <Show when={isFinished()}>
                <button
                  type="button"
                  onClick={discard}
                  aria-label="Discard scan result"
                  class="text-muted-foreground hover:text-foreground -mr-1 flex size-6 items-center justify-center rounded-md transition-colors"
                >
                  <FiX size={16} />
                </button>
              </Show>
            </div>
            <ScanDetails
              progress={scanTask().latest_progress!}
              config={scanTask().kind.scan_config}
              failed={scanTask().kind.failed_content}
              finished={isFinished()}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </Show>
  );
}
