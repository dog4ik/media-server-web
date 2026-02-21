import { Video } from "@/utils/library";
import { Schemas } from "@/utils/serverApi";
import tracing from "@/utils/tracing";
import Hls from "hls.js";
import { ParentProps, createContext, useContext } from "solid-js";
import { createStore } from "solid-js/store";

type WatchSessionContextType = ReturnType<typeof createWatchSessionContext>;

export const WatchSessionContext = createContext<WatchSessionContextType>();

export const useWatchSession = () => {
  let context = useContext(WatchSessionContext);
  if (!context) {
    let m = "Watch session context is not available";
    tracing.error(m);
    throw new Error(m);
  }
  return context;
};

type WatchSession = {
  video?: HTMLVideoElement;
  hls?: Hls;
};

function createWatchSessionContext() {
  let [store, setStore] = createStore<WatchSession>({
    hls: undefined,
    video: undefined,
  });

  async function createSession(
    video: HTMLVideoElement,
    audioTrack: Schemas["DetailedAudioTrack"],
    videoTrack: Schemas["DetailedVideoTrack"],
  ) {}

  async function destroySession() {}

  return [
    {
      tracks: store,
    },
    { createSession, destroySession },
  ] as const;
}

type Props = {} & ParentProps;

export default function WatchSessionProvider(props: Props) {
  let context = () => createWatchSessionContext();
  return (
    <WatchSessionContext.Provider value={context()}>
      {props.children}
    </WatchSessionContext.Provider>
  );
}
