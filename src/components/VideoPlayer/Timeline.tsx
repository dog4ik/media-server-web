import { For, Show, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import Preview from "./Preview";
import { fullUrl, Schemas } from "@/utils/serverApi";
import { formatDuration } from "@/utils/formats";

type Props = {
  /**
   * Current playback position in seconds
   */
  time: number;
  /**
   * Total duration in seconds
   */
  duration: number;
  previews?: { videoId: number; previewsAmount: number };
  /**
   * Video chapters. `start`/`end` are expressed in milliseconds.
   */
  chapters: Schemas["DetailedChapter"][];
  /**
   * Called with the seeked position as a fraction of the duration (0..1)
   */
  onSeek: (percent: number) => void;
  onScrubbingChange: (isScrubbing: boolean) => void;
};

type Segment = {
  /** Offset from the start of the timeline in percent */
  left: number;
  /** Width of the chapter in percent */
  width: number;
  /** Played portion of this chapter in percent */
  fill: number;
};

export default function Timeline(props: Props) {
  let timelineRef: HTMLDivElement = {} as any;
  let [hoverPosition, setHoverPosition] = createSignal<number | null>(null);
  let [isScrubbing, setIsScrubbing] = createSignal(false);

  // Chapters in seconds, defaulting to a single segment spanning the whole video.
  let chapters = createMemo(() => {
    let duration = props.duration || 1;
    if (props.chapters.length === 0) {
      return [
        {
          start: 0,
          end: duration,
          title: undefined as string | null | undefined,
        },
      ];
    }
    return props.chapters.map((c) => ({
      start: c.start / 1000,
      end: c.end / 1000,
      title: c.title,
    }));
  });

  let segments = createMemo<Segment[]>(() => {
    let duration = props.duration || 1;
    return chapters().map((c) => {
      let left = (c.start / duration) * 100;
      let width = ((c.end - c.start) / duration) * 100;
      let fill =
        props.time <= c.start
          ? 0
          : props.time >= c.end
            ? 100
            : ((props.time - c.start) / (c.end - c.start)) * 100;
      return { left, width, fill };
    });
  });

  /** Hovered (or scrubbed) time in seconds */
  let hoverTime = createMemo(() => {
    let position = hoverPosition();
    if (position === null) return null;
    let percent = Math.min(Math.max(0, position / timelineRef.offsetWidth), 1);
    return percent * props.duration;
  });

  let hoveredChapter = createMemo(() => {
    let time = hoverTime();
    if (time === null || props.chapters.length === 0) return undefined;
    let chapter = chapters().find((c) => time >= c.start && time < c.end);
    return chapter?.title ?? undefined;
  });

  let previewSrc = createMemo(() => {
    let position = hoverPosition();
    if (position === null || !props.previews) return undefined;
    return fullUrl("/api/video/{id}/previews/{number}", {
      path: {
        id: props.previews.videoId,
        number: Math.max(
          Math.round((position / timelineRef.offsetWidth) * props.previews.previewsAmount),
          1,
        ),
      },
    });
  });

  function percentFromEvent(e: MouseEvent) {
    let rect = timelineRef.getBoundingClientRect();
    let offsetX = e.pageX - rect.left;
    return Math.min(Math.max(0, offsetX), rect.width) / rect.width;
  }

  function handleMouseDown(e: MouseEvent) {
    e.preventDefault();
    setIsScrubbing(true);
    props.onScrubbingChange(true);
    let percent = percentFromEvent(e);
    setHoverPosition(percent * timelineRef.offsetWidth);
    props.onSeek(percent);
  }

  function handleDocumentMouseMove(e: MouseEvent) {
    if (!isScrubbing()) return;
    let percent = percentFromEvent(e);
    setHoverPosition(percent * timelineRef.offsetWidth);
    props.onSeek(percent);
  }

  function handleDocumentMouseUp() {
    if (!isScrubbing()) return;
    setIsScrubbing(false);
    setHoverPosition(null);
    props.onScrubbingChange(false);
  }

  onMount(() => {
    document.addEventListener("mousemove", handleDocumentMouseMove);
    document.addEventListener("mouseup", handleDocumentMouseUp);
  });

  onCleanup(() => {
    document.removeEventListener("mousemove", handleDocumentMouseMove);
    document.removeEventListener("mouseup", handleDocumentMouseUp);
  });

  let playheadPercent = () => Math.min((props.time / (props.duration || 1)) * 100, 100);

  return (
    <div
      ref={timelineRef!}
      class="group relative top-0 flex cursor-pointer items-center"
      onMouseDown={handleMouseDown}
      onMouseMove={(e) => {
        if (isScrubbing()) return;
        let bounds = timelineRef.getBoundingClientRect();
        setHoverPosition(e.pageX - bounds.left);
      }}
      onMouseLeave={() => {
        if (!isScrubbing()) setHoverPosition(null);
      }}
    >
      <Show when={hoverPosition() !== null}>
        <Preview
          src={previewSrc()}
          chapter={hoveredChapter()}
          X={hoverPosition()!}
          timelineWidth={timelineRef!.offsetWidth}
          time={formatDuration((hoverTime() ?? 0) * 1000)}
        />
      </Show>
      <div class="relative flex h-1.5 w-full items-center transition-[height] duration-150 group-hover:h-2.5">
        <For each={segments()}>
          {(segment) => (
            <div
              class="bg-background/30 absolute top-0 h-full overflow-hidden rounded-[1px]"
              style={{
                left: `calc(${segment.left}%)`,
                width: `calc(${segment.width}% - 3px)`,
              }}
            >
              <div class="bg-accent h-full" style={{ width: `${segment.fill}%` }} />
            </div>
          )}
        </For>
        <div
          class="pointer-events-none absolute size-3.5 -translate-x-1/2 rounded-full bg-white opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          style={{ left: `${playheadPercent()}%` }}
        />
      </div>
    </div>
  );
}
