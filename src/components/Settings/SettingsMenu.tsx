import { A, useLocation } from "@solidjs/router";
import { For } from "solid-js";
import nameToHash from "../../utils/nameToHash";

type Props = {
  options: string[];
};

function SettingsRow(props: { selected: boolean; option: string }) {
  return (
    <A href={nameToHash(props.option)}>
      <li>
        <div class={props.selected ? "active" : ""}>{props.option}</div>
      </li>
    </A>
  );
}

export default function SettingsMenu(props: Props) {
  let location = useLocation();
  return (
    <ul class="menu w-52 h-full bg-white/20 rounded-l-xl">
      <For each={props.options}>
        {(option) => (
          <SettingsRow
            option={option}
            selected={nameToHash(option) == location.hash}
          />
        )}
      </For>
    </ul>
  );
}
