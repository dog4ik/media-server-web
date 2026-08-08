import { useQuery } from "@tanstack/solid-query";
import { useRouterState } from "@tanstack/solid-router";
import {
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  type ParentProps,
  Show,
} from "solid-js";
import { useRequiredContext } from "@/lib/context";
import tracing from "@/utils/tracing";

type BackdropContextType = ReturnType<typeof createBackdropContext>;

export const BackdropContext = createContext<BackdropContextType>();

export const useBackdropContext = () =>
  useRequiredContext(BackdropContext, "BackdropContext");

export function setBackdrop(url: (string | undefined)[]) {
  const [, { changeBackdrop }] = useBackdropContext();
  changeBackdrop(url);
}

function createBackdropContext() {
  let routerState = useRouterState();

  let [backdropSrcList, setBackdropSrcList] = createSignal<
    (string | undefined)[]
  >([]);
  let [hover, setHover] = createSignal(false);

  function loadImage(url: string) {
    let { resolve, reject, promise } =
      Promise.withResolvers<HTMLImageElement>();
    const img = new Image();
    img.src = url;
    img.onload = () => {
      resolve(img);
    };
    img.onerror = (_) => {
      tracing.warn("Failed to load image");
      reject();
    };
    img.onabort = () => {
      tracing.debug({ src: img.src }, "Aborted image download");
    };
    return promise;
  }

  async function loadImages(sources: (string | undefined)[]) {
    for (const source of sources.filter((source) => source !== undefined)) {
      const img = await loadImage(source).catch(() => undefined);
      if (img) {
        return img;
      }
    }
    throw Error("Failed to load backdrop sources");
  }

  function changeBackdrop(url: (string | undefined)[]) {
    tracing.trace({ url }, "Changing backdrop source list");
    setBackdropSrcList(url);
  }

  function removeBackdrop() {
    changeBackdrop([]);
  }

  createEffect(() => {
    let onBackdropRoute = routerState().matches.some(
      (match) => match.staticData.backdrop,
    );
    if (!onBackdropRoute) {
      removeBackdrop();
    }
  });

  let backdropQuery = useQuery(() => ({
    queryFn: () => {
      return loadImages(backdropSrcList());
    },
    queryKey: ["backdrop", backdropSrcList()],
    enabled: backdropSrcList().length > 0,
  }));

  return [
    { hover, backdropQuery },
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
  let [{ backdropQuery }, { setHover }] = useBackdropContext();
  onCleanup(() => setHover(false));

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: purely decorative backdrop preview, hover only toggles a visual effect
    // biome-ignore lint/a11y/useKeyWithMouseEvents: purely decorative backdrop preview, hover only toggles a visual effect
    <div
      onMouseOver={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      class="h-32 w-40 overflow-hidden rounded-2xl border-2 border-dashed border-white duration-0"
    >
      <div style={{ "clip-path": "inset(0px)" }} class="size-full">
        <Show when={backdropQuery.isSuccess && backdropQuery.data}>
          {(backdrop) => {
            return (
              <img
                class="fixed top-0 left-0 size-full object-cover"
                alt=""
                height={window.innerHeight}
                width={window.innerWidth}
                src={backdrop().src}
              />
            );
          }}
        </Show>
      </div>
    </div>
  );
}
