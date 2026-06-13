import { formatDuration } from "@/utils/formats";
import { Schemas } from "@/utils/serverApi";
import { createSignal, onCleanup, ParentProps } from "solid-js";

export const STRIP_FACTOR = 4;

type Props = {
  intro: Schemas["Intro"];
  totalDuration: number;
};

export function IntroBar(props: Props) {
  let strippedDuration = props.totalDuration / STRIP_FACTOR;
  let startPercent = props.intro.start_sec / strippedDuration;
  let endPercent = props.intro.end_sec / strippedDuration;
  let duration = props.intro.end_sec - props.intro.start_sec;
  let durationPercent = duration / strippedDuration;

  return (
    <div class="relative mx-10 h-1 w-full rounded-full bg-white/10">
      <div
        class="bg-primary absolute h-full rounded-full"
        style={{
          left: `${startPercent * 100}%`,
          width: `${durationPercent * 100}%`,
        }}
      />
      <span
        style={{ left: `${startPercent * 100}%` }}
        class="absolute bottom-0 -translate-x-1/2 translate-y-full text-sm"
      >
        {formatDuration(props.intro.start_sec * 1000)}
      </span>
      <span
        style={{ left: `${endPercent * 100}%` }}
        class="absolute bottom-0 -translate-x-1/2 translate-y-full text-sm"
      >
        {formatDuration(props.intro.end_sec * 1000)}
      </span>
      <span
        style={{
          left: `${(endPercent - (endPercent - startPercent) / 2) * 100}%`,
        }}
        class="absolute top-0 -translate-x-1/2 -translate-y-full text-sm"
      >
        {duration} s
      </span>
    </div>
  );
}

type DynamicIntroProps = {
  totalDuration: number;
  start: number;
  end: number;
  onChange: (intro: Schemas["Intro"]) => void;
  compact?: boolean;
};

type PointerProps = {
  positionOffset: number;
  onChange: (newPercent: number) => void;
  label: string;
  labelPosition: "top" | "bottom";
  timelineRef: () => HTMLDivElement;
};

function IntroPointer(props: PointerProps) {
  let [isDragging, setIsDragging] = createSignal(false);

  let handleScrubbing = (e: MouseEvent) => {
    e.preventDefault();
    let rect = props.timelineRef().getBoundingClientRect();
    let offsetX = e.pageX - rect.left;
    let percent = Math.min(Math.max(0, offsetX), rect.width) / rect.width;
    props.onChange(percent);
  };

  let controller = new AbortController();
  let { signal } = controller;

  document.addEventListener("mouseup", () => setIsDragging(false), { signal });
  document.addEventListener(
    "mousemove",
    (e) => {
      if (isDragging()) handleScrubbing(e);
    },
    { signal },
  );
  onCleanup(() => controller.abort());

  return (
    <div
      class="absolute top-0 z-20 flex h-full -translate-x-1/2 cursor-grab flex-col items-center select-none active:cursor-grabbing"
      style={{ left: `${props.positionOffset * 100}%` }}
      onMouseDown={() => setIsDragging(true)}
    >
      <div class="bg-primary h-full w-0.5" />
      <div class="bg-primary absolute top-1/2 h-5 w-2.5 -translate-y-1/2 rounded-sm shadow-md" />
      <span
        class={`text-primary-foreground pointer-events-none absolute text-[11px] font-medium whitespace-nowrap ${
          props.labelPosition === "top" ? "-top-5" : "-bottom-5"
        }`}
      >
        {props.label}
      </span>
    </div>
  );
}

export function DynamicIntro(props: DynamicIntroProps) {
  let timelineRef: HTMLDivElement | undefined = undefined;
  let strippedDuration = props.totalDuration / STRIP_FACTOR;
  let startPercent = () => props.start / strippedDuration;
  let endPercent = () => props.end / strippedDuration;

  let changeStartPosition = (newPercent: number) => {
    let clamped = Math.min(newPercent, endPercent());
    props.onChange({
      start_sec: clamped * strippedDuration,
      end_sec: props.end,
    });
  };

  let changeEndPosition = (newPercent: number) => {
    let clamped = Math.max(newPercent, startPercent());
    props.onChange({
      start_sec: props.start,
      end_sec: clamped * strippedDuration,
    });
  };

  return (
    <div class={props.compact ? "" : "relative mx-8 mt-4 mb-6"}>
      {!props.compact && (
        <>
          <span class="text-muted-foreground absolute top-1/2 -left-8 -translate-y-1/2 text-xs">
            {formatDuration(0)}
          </span>
          <span class="text-muted-foreground absolute top-1/2 -right-8 -translate-y-1/2 text-xs">
            {formatDuration(strippedDuration * 1000)}
          </span>
        </>
      )}
      <div ref={timelineRef!} class="relative h-8 cursor-default rounded-md bg-white/[0.06]">
        <div
          class="bg-primary/25 absolute top-0 h-full rounded-md"
          style={{
            left: `${startPercent() * 100}%`,
            width: `${(endPercent() - startPercent()) * 100}%`,
          }}
        />
        <IntroPointer
          timelineRef={() => timelineRef!}
          positionOffset={startPercent()}
          onChange={changeStartPosition}
          label={props.compact ? "" : formatDuration(props.start * 1000)}
          labelPosition="top"
        />
        <IntroPointer
          timelineRef={() => timelineRef!}
          positionOffset={endPercent()}
          onChange={changeEndPosition}
          label={props.compact ? "" : formatDuration(props.end * 1000)}
          labelPosition="bottom"
        />
      </div>
    </div>
  );
}
