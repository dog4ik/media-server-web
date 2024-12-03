import clsx from "clsx";
import { For, ParentProps } from "solid-js";

type StepsProps = {
  current: number;
  steps: string[];
};

type StepProps = {
  title: string;
  index: number;
  active: boolean;
};

function Step(props: StepProps) {
  return (
    <div
      class={clsx(
        props.active ? "bg-green-500" : "bg-secondary",
        "relative z-10 flex h-10 w-10 items-center justify-center rounded-full",
      )}
    >
      {props.index + 1}
      <span class="absolute bottom-full w-40 text-center">{props.title}</span>
    </div>
  );
}

function Steps(props: StepsProps & ParentProps) {
  let percent = () => {
    if (props.current == 0) return 0;
    if (props.current == 1) return 50;
    if (props.current == 2) return 100;
  };
  return (
    <div class="relative flex items-center gap-40">
      <For each={props.steps}>
        {(title, i) => (
          <Step index={i()} active={props.current >= i()} title={title} />
        )}
      </For>
      <div class="absolute top-1/2 h-2 w-full -translate-y-1/2 rounded-full bg-secondary">
        <div
          style={{
            width: `${percent()}%`,
          }}
          class={clsx("h-full w-1/2 bg-green-500")}
        ></div>
      </div>
    </div>
  );
}
export { Steps };
