import { A } from "@solidjs/router";
import { ParentProps } from "solid-js";

type Props =
  | {
      onClick?: () => void;
    }
  | {
      href: string;
    };
export default function SecondaryButton(props: Props & ParentProps) {
  let style = "rounded-xl bg-neutral-200 text-black py-2 px-4";
  if ("href" in props)
    return (
      <A href={props.href} class={style}>
        {props.children}
      </A>
    );
  return (
    <button onClick={props.onClick} class={style}>
      {props.children}
    </button>
  );
}
