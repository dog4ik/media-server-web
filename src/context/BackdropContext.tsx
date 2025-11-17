import tracing from "@/utils/tracing";
import { useQuery } from "@tanstack/solid-query";
import { useRouterState } from "@tanstack/solid-router";
import {
  ParentProps,
  Show,
  createContext,
  createSignal,
  onCleanup,
  useContext,
} from "solid-js";

type BackdropContextType = ReturnType<typeof createBackdropContext>;

export const BackdropContext = createContext<BackdropContextType>();

export const useBackdropContext = () => useContext(BackdropContext)!;

export function setBackdrop(url: (string | undefined)[]) {
  let [{}, { changeBackdrop }] = useBackdropContext();
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
    for (let source of sources.filter((source) => source !== undefined)) {
      let img = await loadImage(source).catch(() => undefined);
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

  // createEffect(() => {
  //   if (
  //     !routerState().location.pathname.startsWith("/shows/") &&
  //     !routerState().location.pathname.startsWith("/movies/")
  //   ) {
  //     removeBackdrop();
  //   }
  // });

  function removeBackdrop() {
    changeBackdrop([]);
  }

  let backdropQuery = useQuery(() => ({
    queryFn: () => {
      return loadImages(backdropSrcList());
    },
    queryKey: ["backdrop", backdropSrcList()],
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
    <div
      onMouseOver={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      class="h-32 w-40 overflow-hidden rounded-2xl border-2 border-dashed border-white duration-0"
    >
      <div style={{ "clip-path": "inset(0px)" }} class="size-full">
        <Show when={backdropQuery.data}>
          {(backdrop) => {
            return (
              <img
                class="fixed top-0 left-0 size-full object-cover"
                alt="Backdrop hole image"
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
