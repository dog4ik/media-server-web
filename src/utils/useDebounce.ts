import { createSignal } from "solid-js";

export default function useDebounce<T>(time: number, initialValue: T) {
  let [input, setInput] = createSignal(initialValue);
  let [deferredInput, setDeferredInput] = createSignal(initialValue);
  let timeout: ReturnType<typeof setTimeout>;
  let setter = (value: T) => {
    setInput(() => value);
    clearTimeout(timeout);
    timeout = setTimeout(() => setDeferredInput(() => input()), time);
  };
  return [input, deferredInput, setter] as const;
}
