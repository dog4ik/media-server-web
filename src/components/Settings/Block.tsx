import { A } from "@solidjs/router";
import { ParentProps } from "solid-js";

type Props = {
  href: string;
  title: string;
};
export default function SettingsBlock(props: Props & ParentProps) {
  return (
    <A
      href={props.href}
      class="flex aspect-square w-52 flex-col items-center justify-center gap-5
      rounded-xl bg-white/20 transition-all duration-500 hover:shadow-2xl"
    >
      <div>{props.children}</div>
      <div class="text-2xl">{props.title}</div>
    </A>
  );
}
