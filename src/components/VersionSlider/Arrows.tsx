import { FiArrowLeft, FiArrowRight } from "solid-icons/fi";

type Props = {
  title: string;
  onLeft: () => void;
  onRight: () => void;
  disabledLeft: boolean;
  disabledRight: boolean;
};

export default function Arrows(props: Props) {
  return (
    <div class="flex items-center justify-between">
      <button
        class={props.disabledLeft ? "cursor-not-allowed opacity-50" : ""}
        disabled={props.disabledLeft}
        onClick={props.onLeft}
      >
        <FiArrowLeft size={40} />
      </button>
      <div class="text-3xl">{props.title}</div>
      <button
        class={props.disabledRight ? "cursor-not-allowed opacity-50" : ""}
        disabled={props.disabledRight}
        onClick={props.onRight}
      >
        <FiArrowRight size={40} />
      </button>
    </div>
  );
}
