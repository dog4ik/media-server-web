import { createSignal } from "solid-js";

const [highlightedDir, setHighlightedDir] = createSignal<string | null>(null);

export { highlightedDir };

let clearTimer: ReturnType<typeof setTimeout> | undefined;

export function scrollToDir(id: string) {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
  setHighlightedDir(id);
  clearTimeout(clearTimer);
  clearTimer = setTimeout(() => setHighlightedDir(null), 1500);
}
