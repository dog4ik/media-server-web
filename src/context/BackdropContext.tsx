import tracing from "@/utils/tracing";
import { useLocation } from "@solidjs/router";
import {
  ParentProps,
  Show,
  createContext,
  createEffect,
  createSignal,
  onCleanup,
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
  let location = useLocation();

  let [backdropSrcList, setBackdropSrcList] = createSignal<
    (string | undefined)[]
  >([]);
  let [currentBackdrop, setCurrentBackdrop] = createSignal<string>();
  let [hover, setHover] = createSignal(false);

  let abortController = new AbortController();
  let image = new Image();

  function handleAbort() {
    image.src = "";
  }

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
    { backdropSrcList, currentBackdrop, hover },
    { changeBackdrop, removeBackdrop, setHover },
  ] as const;
}

export default function BackdropProvider(props: ParentProps) {
  let context = createBackdropContext();
  return (
    <BackdropContext.Provider value={context}>
      <Show
        when={context[0].hover()}
        fallback={
          <style>
            {`
.hover-hide {
  opacity: 1;
  transition: opacity 0.3s ease, visibility 0s linear 0.3s;
}
          `}
          </style>
        }
      >
        <style>
          {`
.hover-hide {
  opacity: 0;
  transition: opacity 0.3s ease, visibility 0s linear 0.3s;
}
        `}
        </style>
      </Show>
      {props.children}
    </BackdropContext.Provider>
  );
}

export function HoverArea() {
  let [{ currentBackdrop }, { setHover }] = useBackdropContext();
  onCleanup(() => setHover(false));

  return (
    <div
      onMouseOver={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      class="h-32 w-40 overflow-hidden rounded-2xl border-2 border-dashed border-white duration-0"
    >
      <div style={{ "clip-path": "inset(0px)" }} class="size-full">
        <Show when={currentBackdrop()}>
          {(backdrop) => (
            <img
              class="fixed left-0 top-0 size-full object-cover"
              alt="Backdrop hole image"
              height={window.innerHeight}
              width={window.innerWidth}
              src={backdrop()}
            />
          )}
        </Show>
      </div>
    </div>
  );
}
