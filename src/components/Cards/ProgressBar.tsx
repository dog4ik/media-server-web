import { Schemas } from "../../utils/serverApi";

type Props = {
  runtime: number;
  history: Schemas["History"];
};

function progressBarPercent(history: Schemas["History"], runtime: number) {
  return history.is_finished ? 100 : Math.max(10, (history.time / runtime) * 100);
}

export function WatchProgressBar(props: Props) {
  return (
    <div class="absolute right-0 bottom-0 left-0">
      <div
        class="bg-primary z-50 h-1"
        style={{
          width: `${progressBarPercent(props.history, props.runtime)}%`,
        }}
      />
    </div>
  );
}
