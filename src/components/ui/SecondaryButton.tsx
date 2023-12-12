import { ParentProps } from "solid-js";

type Props = {
  onClick?: () => void;
};
export default function PrimeButton(props: Props & ParentProps) {
  return (
    <button
      onClick={props.onClick}
      class="rounded-xl bg-neutral-200 text-black py-2 px-4"
    >
      {props.children}
    </button>
  );
}
