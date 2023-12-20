import { A } from "@solidjs/router";
import { ParentProps } from "solid-js";

type Props =
  | {
      onClick?: () => void;
    }
  | {
      href: string;
    };
export default function PrimeButton(props: Props & ParentProps) {
  let style =
    "rounded-xl bg-white/10 relative shadow-2xl backdrop-blur-xl py-2 px-4";
  if ("href" in props)
    return (
      <A href={props.href} class={style}>
        <span>{props.children}</span>
      </A>
    );
  return (
    <button onClick={props.onClick} class={style}>
      <span>{props.children}</span>
    </button>
  );
}
