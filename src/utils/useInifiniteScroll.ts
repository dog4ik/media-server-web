import { createSignal, onCleanup, onMount } from "solid-js";
import { createStore } from "solid-js/store";

type InfiniteScroll = { data: unknown[]; cursor?: string | undefined | null };

const TAKE = 10;

export default function useInfiniteScroll<T extends InfiniteScroll>(
  fetcher: (
    currentCursor: string | undefined | null,
    abortSignal: AbortSignal,
  ) => Promise<T | undefined>,
  observeTarget: () => HTMLElement,
) {
  let [reachedEnd, setReachedEnd] = createSignal(false);
  let [isLoading, setIsLoading] = createSignal(false);
  let [history, setHistory] = createStore<InfiniteScroll>({
    data: [],
  });
  let abortController = new AbortController();
  onCleanup(() => {
    abortController.abort();
  });

  async function fetchHistory(cursor?: string) {
    return await fetcher(cursor, abortController.signal);
  }

  function onObserve([entry]: IntersectionObserverEntry[]) {
    if (reachedEnd() || !entry.isIntersecting || isLoading()) return;
    setIsLoading(true);

    fetchHistory(history.cursor ?? undefined).then((data) => {
      if (data?.data) {
        setHistory("data", [...history.data, ...data.data]);
        setHistory("cursor", data.cursor);
        if (data.data.length < TAKE) {
          setReachedEnd(true);
        }
      }
      setIsLoading(false);
    });

  }
  const options: IntersectionObserverInit = {
    root: null,
    rootMargin: "0px",
    threshold: 0,
  };

  let observer = new IntersectionObserver(onObserve, options);
  onMount(() => {
    observer.observe(observeTarget());
  });
  return [() => history.data as T["data"], { isLoading, reachedEnd }] as const;
}
