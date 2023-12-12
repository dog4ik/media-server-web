import {
  ParentProps,
  createContext,
  createSignal,
  onCleanup,
  useContext,
} from "solid-js";

type BackdropContextType = ReturnType<typeof createBackdropContext>;

export const BackdropContext = createContext<BackdropContextType>();

export const useBackdropContext = () => useContext(BackdropContext)!;

export function useBackdrop(url?: string) {
  let [{ backdrop }, { changeBackdrop }] = useBackdropContext();
  changeBackdrop(url);
  onCleanup(() => changeBackdrop(undefined));
  return backdrop();
}

function createBackdropContext() {
  let [backdrop, setBackdrop] = createSignal<string>();

  function removeBackdrop() {
    setBackdrop(undefined);
  }

  function changeBackdrop(url?: string) {
    setBackdrop(url);
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
