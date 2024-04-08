import { FiInfo } from "solid-icons/fi";
import { JSXElement, ParentProps, Show } from "solid-js";
import { JSX } from "solid-js/h/jsx-runtime";

type Props = {
  title: string;
};

export default function ContentSectionContainer(props: Props & ParentProps) {
  return (
    <div class="flex flex-col justify-center divide-y overflow-hidden rounded-xl bg-white/20">
      <span class="text-md p-3 font-bold">{props.title}</span>
      <div class="p-3">{props.children}</div>
    </div>
  );
}

type InfoProps = {
  icon?: JSX.Element;
  key: string;
  value: string | number;
};

export function Info(props: InfoProps & ParentProps) {
  return (
    <div class="flex flex-col gap-3">
      <div class="flex items-center gap-3">
        <div>
          <Show fallback={<FiInfo size={20} />} when={props.children}>
            {props.children}
          </Show>
        </div>
        <span class="text-sm">{props.key}</span>
      </div>
      <span class="text-sm font-bold">{props.value}</span>
    </div>
  );
}
