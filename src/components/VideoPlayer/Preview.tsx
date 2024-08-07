type PreviewProps = {
  X: number;
  timelineWidth: number;
  time: string;
  src: string;
};

export default function Preview(props: PreviewProps) {
  const IMG_WIDTH = 150;
  const IMG_HEIGHT = 98;
  let position = () => {
    if (props.X < IMG_WIDTH / 2) return IMG_WIDTH / 2;
    if (props.timelineWidth - props.X < IMG_WIDTH / 2)
      return props.timelineWidth - IMG_WIDTH / 2;
    return props.X;
  };
  return (
    <div
      class="pointer-events-none absolute bottom-14 hidden shrink-0 -translate-x-1/2 flex-col items-center justify-center group-hover:flex"
      style={{
        left: `${position()}px`,
        width: `${IMG_WIDTH}px`,
        height: `${IMG_HEIGHT}px`,
      }}
    >
      <div class="p-0.5">
        <img
          width={IMG_WIDTH}
          height={IMG_HEIGHT}
          src={props.src}
          alt="Preview"
        ></img>
      </div>
      <span class="rounded-md bg-black/40 p-0.5 text-sm">{props.time}</span>
    </div>
  );
}
