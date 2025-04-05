import tracing from "@/utils/tracing";
import { useLocation } from "@solidjs/router";
import {
  ParentProps,
  createContext,
  createEffect,
  createSignal,
  useContext,
} from "solid-js";

type BackdropContextType = ReturnType<typeof createBackdropContext>;

export const BackdropContext = createContext<BackdropContextType>();

export const useBackdropContext = () => useContext(BackdropContext)!;

export function setBackdrop(url: (string | undefined)[]) {
  let [{ currentBackdrop }, { changeBackdrop }] = useBackdropContext();
  changeBackdrop(url);
  return currentBackdrop();
}

function createBackdropContext() {
  let [backdropSrcList, setBackdropSrcList] = createSignal<
    (string | undefined)[]
  >([]);
  let [currentBackdrop, setCurrentBackdrop] = createSignal<string>();
  let abortController = new AbortController();
  let image = new Image();
  function handleAbort() {
    image.src = "";
  }
  let location = useLocation();

  function loadImage(index: number) {
    if (index === backdropSrcList().length) {
      tracing.warn("Failed to load any of image sources");
      return;
    }

    let url = backdropSrcList()[index];
    if (url === undefined) {
      return loadImage(index + 1);
    }
    const img = new Image();
    img.src = url;
    img.onload = () => {
      setCurrentBackdrop(url);
    };
    img.onerror = (e) => {
      tracing.warn({ message: e.toString() }, "Failed to load image");
      loadImage(index + 1);
    };
    img.onabort = () => {
      tracing.debug({ src: img.src }, "Aborted image download");
    };
  }

  function changeBackdrop(url: (string | undefined)[]) {
    abortController.abort();
    abortController.signal.removeEventListener("abort", handleAbort);
    abortController = new AbortController();
    setBackdropSrcList(url);
    loadImage(0);
    abortController.signal.addEventListener("abort", handleAbort);
  }

  createEffect(() => {
    if (
      !location.pathname.startsWith("/shows/") &&
      !location.pathname.startsWith("/movies/")
    ) {
      removeBackdrop();
    }
  });

  function removeBackdrop() {
    changeBackdrop([]);
    setCurrentBackdrop(undefined);
  }

  return [
    { backdropSrcList, currentBackdrop },
    { changeBackdrop, removeBackdrop },
  ] as const;
}

export default function BackdropProvider(props: ParentProps) {
  let context = createBackdropContext();
  return (
    <BackdropContext.Provider value={context}>
      {props.children}
    </BackdropContext.Provider>
  );
}
