import { formatDuration } from "@/utils/formats";
import { Schemas } from "@/utils/serverApi";
import { FiArrowLeft, FiArrowRight } from "solid-icons/fi";
import { createSignal, onCleanup, ParentProps } from "solid-js";

const STRIP_FACTOR = 4;

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
    <div class="relative mx-10 h-1 w-full bg-white">
      <div
        class="absolute h-full bg-green-500"
        style={{
          left: `${startPercent * 100}%`,
          width: `${durationPercent * 100}%`,
        }}
      />
      <span
        style={{ left: `${startPercent * 100}%` }}
        class="absolute bottom-0 -translate-x-1/2 translate-y-full text-sm"
      >
        {formatDuration({ secs: props.intro.start_sec, nanos: 0 })}
      </span>
      <span
        style={{ left: `${endPercent * 100}%` }}
        class="absolute bottom-0 -translate-x-1/2 translate-y-full text-sm"
      >
        {formatDuration({ secs: props.intro.end_sec, nanos: 0 })}
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
};

type PointerProps = {
  positionOffset: number;
  onChange: (newPercent: number) => void;
  timelineRef: () => HTMLDivElement;
};

function IntroPointer(props: PointerProps & ParentProps) {
  let [isDragging, setIsDragging] = createSignal(false);
  let timelineRef = () => props.timelineRef();

  let handleScubbing = (e: MouseEvent) => {
    e.preventDefault();
    let rect = timelineRef().getBoundingClientRect();
    let offsetX = e.pageX - rect.left;
    let percent = Math.min(Math.max(0, offsetX), rect.width) / rect.width;
    props.onChange(percent);
  };

  let handleMouseDown = () => {
    setIsDragging(true);
  };

  let handleMouseUp = () => {
    setIsDragging(false);
  };

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging()) return;
    handleScubbing(e);
  }

  let controller = new AbortController();
  let signal = controller.signal;
  document.addEventListener("mouseup", handleMouseUp, { signal });
  document.addEventListener("mousemove", handleMouseMove, { signal });
  onCleanup(() => controller.abort());

  return (
    <button
      style={{ left: `${props.positionOffset * 100}%` }}
      class="absolute z-20 flex h-full w-2 cursor-grab items-center justify-center bg-gray-900"
      onMouseDown={handleMouseDown}
    >
      {props.children}
    </button>
  );
}

const ICON_SIZE = 15;

export function DynamicIntro(props: DynamicIntroProps) {
  let timelineRef: HTMLDivElement;
  let strippedDuration = props.totalDuration / STRIP_FACTOR;
  let startPercent = () => props.start / strippedDuration;
  let endPercent = () => props.end / strippedDuration;

  let changeStartPosition = (newPercent: number) => {
    let clampedPercent = Math.min(newPercent, endPercent());
    props.onChange({
      start_sec: clampedPercent * strippedDuration,
      end_sec: props.end,
    });
  };

  let changeEndPosition = (newPercent: number) => {
    let clampedPercent = Math.max(newPercent, startPercent());
    props.onChange({
      start_sec: props.start,
      end_sec: clampedPercent * strippedDuration,
    });
  };

  let duration = () => props.end - props.start;

  let durationPercent = () => duration() / strippedDuration;

  return (
    <div ref={timelineRef!} class="relative h-10 bg-white">
      <span class="absolute -left-10">
        {formatDuration({ secs: 0, nanos: 0 })}
      </span>
      <span class="absolute -right-10">
        {formatDuration({ secs: strippedDuration, nanos: 0 })}
      </span>
      <IntroPointer
        timelineRef={() => timelineRef!}
        positionOffset={startPercent()}
        onChange={changeStartPosition}
      >
        <span class="pointer-events-none absolute bottom-10">
          {formatDuration({ nanos: 0, secs: props.start })}
        </span>
        <FiArrowLeft size={ICON_SIZE} />
      </IntroPointer>
      <IntroPointer
        timelineRef={() => timelineRef!}
        positionOffset={endPercent()}
        onChange={changeEndPosition}
      >
        <span class="pointer-events-none absolute top-10">
          {formatDuration({ nanos: 0, secs: props.end })}
        </span>
        <FiArrowRight size={ICON_SIZE} />
      </IntroPointer>
      <div
        class="absolute h-full bg-green-500"
        style={{
          left: `${startPercent() * 100}%`,
          width: `${durationPercent() * 100}%`,
        }}
      />
    </div>
  );
}
