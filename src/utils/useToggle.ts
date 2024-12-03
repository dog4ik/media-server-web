import { createSignal } from "solid-js";

export default function useToggle(initialValue: boolean = false) {
  let [value, setValue] = createSignal(initialValue);
  let setter = (force?: boolean) => {
    if (force !== undefined) {
      setValue(force);
    } else {
      setValue(!value());
    }
  };
  return [value, setter] as const;
}
