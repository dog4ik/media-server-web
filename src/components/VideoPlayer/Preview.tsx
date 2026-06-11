import { Show } from "solid-js";

type PreviewProps = {
  X: number;
  timelineWidth: number;
  time: string;
  src?: string;
  chapter?: string;
};

export default function Preview(props: PreviewProps) {
  const IMG_WIDTH = 150;
  const IMG_HEIGHT = 98;
  let position = () => {
    if (props.X < IMG_WIDTH / 2) return IMG_WIDTH / 2;
    if (props.timelineWidth - props.X < IMG_WIDTH / 2) return props.timelineWidth - IMG_WIDTH / 2;
    return props.X;
  };
  return (
    <div
      class="pointer-events-none absolute bottom-6 flex shrink-0 -translate-x-1/2 flex-col items-center justify-center gap-1"
      style={{
        left: `${position()}px`,
      }}
    >
      <Show when={props.src}>
        <div class="overflow-hidden rounded-md p-0.5">
          <img width={IMG_WIDTH} height={IMG_HEIGHT} src={props.src} alt="Preview" />
        </div>
      </Show>
      <div class="bg-black/60 rounded-md text-sm px-2 py-1 space-x-2">
        <Show when={props.chapter}>
          <span class="max-w-48 truncate text-center text-sm font-semibold drop-shadow-md">
            {props.chapter}
          </span>
        </Show>
        <span>{props.time}</span>
      </div>
    </div>
  );
}
