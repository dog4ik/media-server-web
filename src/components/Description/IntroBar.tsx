import { formatDuration } from "@/utils/formats";
import { Schemas } from "@/utils/serverApi";

type Props = {
  intro: Schemas["Intro"];
  totalDuration: number;
};

export function IntroBar(props: Props) {
  let strippedDuration = props.totalDuration / 4;
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

function Intro(props: Props) {
  return <div></div>;
}
