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
  if ("href" in props)
    return (
      <A href={props.href} class="btn-primary">
        <span>{props.children}</span>
      </A>
    );
  return (
    <button onClick={props.onClick} class="btn-primary">
      <span>{props.children}</span>
    </button>
  );
}
