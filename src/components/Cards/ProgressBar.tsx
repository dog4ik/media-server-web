import { Schemas } from "../../utils/serverApi";

type Props = {
  runtime: number;
  history: Schemas["DbHistory"];
};

function progressBarPercent(history: Schemas["DbHistory"], runtime: number) {
  return history.is_finished
    ? 100
    : Math.max(10, (history.time / runtime) * 100);
}

export default function ProgressBar(props: Props) {
  console.log(props);
  return (
    <div class="absolute bottom-0 left-0 right-0">
      <div
        class="z-50 h-1 bg-white"
        style={{
          width: `${progressBarPercent(props.history, props.runtime)}%`,
        }}
      />
    </div>
  );
}
