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
    <div class="absolute bottom-0 left-0 right-0">
      <div
        class="z-50 h-1 bg-primary"
        style={{
          width: `${progressBarPercent(props.history, props.runtime)}%`,
        }}
      />
    </div>
  );
}
