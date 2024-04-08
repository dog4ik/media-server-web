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

export function useBackdrop(url: string | undefined) {
  let [{ backdrop }, { changeBackdrop }] = useBackdropContext();
  changeBackdrop(url);
  return backdrop();
}

function createBackdropContext() {
  let [backdrop, setBackdrop] = createSignal<string>();
  let location = useLocation();

  function changeBackdrop(url?: string) {
    setBackdrop(url);
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
    changeBackdrop(undefined);
  }

  return [{ backdrop }, { changeBackdrop, removeBackdrop }] as const;
}

export default function BackdropProvider(props: ParentProps) {
  let context = createBackdropContext();
  return (
    <BackdropContext.Provider value={context}>
      {props.children}
    </BackdropContext.Provider>
  );
}
