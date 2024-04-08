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
  if ("href" in props)
    return (
      <A href={props.href} class="btn-secondary">
        {props.children}
      </A>
    );
  return (
    <button onClick={props.onClick} class="btn-secondary">
      {props.children}
    </button>
  );
}
