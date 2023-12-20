import { useLocation, useParams } from "@solidjs/router";
import {
  ParentProps,
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  useContext,
} from "solid-js";
import { getShowById } from "../utils/serverApi";

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
  let location = useLocation();
  let params = useParams();

  function changeBackdrop(url?: string) {
    setBackdrop(url);
  }

  createEffect(() => {
    if (location.pathname.startsWith("/shows/")) {
      let showId = +params.show_id;
      if (showId && !isNaN(showId)) {
        getShowById(+showId).then((data) => changeBackdrop(data.backdrop));
      }
    } else if (location.pathname.startsWith("/movies/")) {
      let movieId = +params.movie_id;
      if (movieId && !isNaN(movieId)) {
        getShowById(+movieId).then((data) => changeBackdrop(data.backdrop));
      }
    } else {
      changeBackdrop(undefined);
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
