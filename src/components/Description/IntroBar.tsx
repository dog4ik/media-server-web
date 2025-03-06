import { formatDuration } from "@/utils/formats";
import { Schemas } from "@/utils/serverApi";
import { FiArrowLeft, FiArrowRight } from "solid-icons/fi";
import { createSignal, onCleanup, ParentProps } from "solid-js";

const STRIP_FACTOR = 4;

type Props = {
  intro: Schemas["Intro"];
  totalDuration: number;
};

export function IntroBar(self: Props) {
  let strippedDuration = self.totalDuration / STRIP_FACTOR;
  let startPercent = self.intro.start_sec / strippedDuration;
  let endPercent = self.intro.end_sec / strippedDuration;
  let duration = self.intro.end_sec - self.intro.start_sec;
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
        {formatDuration({ secs: self.intro.start_sec, nanos: 0 })}
      </span>
      <span
        style={{ left: `${endPercent * 100}%` }}
        class="absolute bottom-0 -translate-x-1/2 translate-y-full text-sm"
      >
        {formatDuration({ secs: self.intro.end_sec, nanos: 0 })}
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
  initialStart: number;
  initialEnd: number;
};

type PointerProps = {
  positionOffset: number;
  onChange: (newPercent: number) => void;
  timelineRef: () => HTMLDivElement;
};

function IntroPointer(self: PointerProps & ParentProps) {
  let [isDragging, setIsDragging] = createSignal(false);
  let timelineRef = () => self.timelineRef();

  let handleScubbing = (e: MouseEvent) => {
    e.preventDefault();
    let rect = timelineRef().getBoundingClientRect();
    let offsetX = e.pageX - rect.left;
    let percent = Math.min(Math.max(0, offsetX), rect.width) / rect.width;
    self.onChange(percent);
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
      style={{ left: `${self.positionOffset * 100}%` }}
      class="absolute z-20 flex h-full w-2 items-center justify-center bg-gray-900"
      onMouseDown={handleMouseDown}
    >
      {self.children}
    </button>
  );
}

const ICON_SIZE = 15;

export function DynamicIntro(self: DynamicIntroProps) {
  let timelineRef: HTMLDivElement;
  let strippedDuration = self.totalDuration / STRIP_FACTOR;
  let [startPointer, setStartPointer] = createSignal(self.initialStart);
  let [endPointer, setEndPointer] = createSignal(self.initialEnd);
  let startPercent = () => startPointer() / strippedDuration;
  let endPercent = () => endPointer() / strippedDuration;

  let changeStartPosition = (newPercent: number) => {
    let clampedPercent = Math.min(newPercent, endPercent());
    setStartPointer(clampedPercent * strippedDuration);
  };

  let changeEndPosition = (newPercent: number) => {
    let clampedPercent = Math.max(newPercent, startPercent());
    setEndPointer(clampedPercent * strippedDuration);
  };

  let duration = () => endPointer() - startPointer();

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
          {formatDuration({ nanos: 0, secs: startPointer() })}
        </span>
        <FiArrowLeft size={ICON_SIZE} />
      </IntroPointer>
      <IntroPointer
        timelineRef={() => timelineRef!}
        positionOffset={endPercent()}
        onChange={changeEndPosition}
      >
        <span class="pointer-events-none absolute top-10">
          {formatDuration({ nanos: 0, secs: endPointer() })}
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
