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
      class="aspect-square w-52 hover:shadow-2xl transition-all duration-500 bg-white/20 rounded-xl
      flex flex-col justify-center gap-5 items-center"
    >
      <div>{props.children}</div>
      <div class="text-2xl">{props.title}</div>
    </A>
  );
}
