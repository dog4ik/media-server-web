import { FiPause, FiPlay, FiVolume1, FiVolume2 } from "solid-icons/fi";
import {
  JSX,
  Match,
  Ref,
  Switch,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";

type Props = {
  src: string;
  onVideoError: (error?: MediaError) => void;
  onAudioError: () => void;
};

type ActionIconProps = {
  ref: Ref<HTMLDivElement>;
  action: DispatchedAction;
};

type PlaybackState = "playing" | "pause" | "buffering" | "error";

type DispatchedAction = "pause" | "unpause" | "volumeup" | "volumedown";

type VideoEventType = Parameters<JSX.EventHandler<HTMLVideoElement, Event>>[0];

function getInitialVolume() {
  return Math.max(
    Math.min(parseFloat(localStorage.getItem("volume") ?? ""), 0),
    1,
  );
}

function getActionAnimation() {
  let animationOptions = { duration: 400 };
  let animation = [
    { transform: "scale(1)", opacity: 1 },
    { transform: "scale(1.2)", opacity: 0 },
  ];
  return { animationOptions, animation };
}
const { animationOptions, animation } = getActionAnimation();

function saveVolume(volume: number) {
  localStorage.setItem("volume", "" + volume);
}

function ActionIcon(props: ActionIconProps) {
  let size = 40;
  return (
    <div
      ref={props.ref}
      class="pointer-events-none absolute left-1/2 top-1/2 z-10 flex h-20 w-20 -translate-x-1/2 items-center justify-center rounded-full bg-black opacity-0"
    >
      <Switch>
        <Match when={props.action == "unpause"}>
          <FiPause stroke="white" size={size} />
        </Match>
        <Match when={props.action == "pause"}>
          <FiPlay stroke="white" size={size} />
        </Match>
        <Match when={props.action == "volumedown"}>
          <FiVolume1 stroke="white" size={size} />
        </Match>
        <Match when={props.action == "volumeup"}>
          <FiVolume2 stroke="white" size={size} />
        </Match>
      </Switch>
    </div>
  );
}

export default function VideoPlayer(props: Props) {
  let audioFailed = false;
  let videoFailed = false;

  function handleCodecsError(e: VideoEventType) {
    if (audioFailed || videoFailed) {
      return;
    }
    let audioDecodedBytes: number | undefined =
      // @ts-expect-error
      e.currentTarget?.webkitAudioDecodedByteCount;
    let videoDecodedBytes: number | undefined =
      // @ts-expect-error
      e.currentTarget?.webkitVideoDecodedByteCount;

    if (
      videoDecodedBytes !== undefined &&
      audioDecodedBytes !== undefined &&
      e.currentTarget.duration > 0
    ) {
      if (videoDecodedBytes == 0) {
        videoFailed = true;
        props.onVideoError();
      }
      if (audioDecodedBytes == 0) {
        audioFailed = true;
        props.onAudioError();
      }
    }
  }

  let videoRef: HTMLVideoElement;
  let actionContainer: HTMLDivElement;

  function handleVideoError(event: VideoEventType) {
    setPlaybackState("error");
    props.onVideoError(event.currentTarget.error ?? undefined);
  }

  function handlePause(event: VideoEventType) {
    setPlaybackState(event.currentTarget.paused ? "pause" : "playing");
  }

  function handleProgress(event: VideoEventType) {
    setPlaybackState("playing");
    handleCodecsError(event);
  }

  function handleVideoClick(event: VideoEventType) {
    event.preventDefault();
    if (event.currentTarget.paused) {
      dispatchAction("unpause");
      videoRef.play();
    } else {
      dispatchAction("pause");
      videoRef.pause();
    }
  }

  function handleKeyboardPress(event: KeyboardEvent) {
    if (event.key == "ArrowDown") {
    }
    if (event.key == "ArrowUp") {
    }
    if (event.key == "ArrowLeft") {
    }
    if (event.key == "ArrowRight") {
    }
  }

  function handleVolumeChange(event: VideoEventType) {
    let newVolume = event.currentTarget.volume;
    let delta = newVolume - volume();
    if (delta >= 0) dispatchAction("volumeup");
    else dispatchAction("volumedown");

    saveVolume(newVolume);
    setVolume(newVolume);
  }

  function dispatchAction(action: DispatchedAction) {
    setDispatchedAction(action);
    actionContainer.animate(animation, animationOptions);
  }

  let [playbackState, setPlaybackState] =
    createSignal<PlaybackState>("buffering");

  let [volume, setVolume] = createSignal<number>(getInitialVolume());

  let [dispatchedAction, setDispatchedAction] =
    createSignal<DispatchedAction>("unpause");

  onMount(() => {
    window.addEventListener("keydown", handleKeyboardPress);
  });
  onCleanup(() => {
    window.removeEventListener("keydown", handleKeyboardPress);
  });

  return (
    <>
      <video
        class="h-full w-full"
        onError={handleVideoError}
        onPause={handlePause}
        onVolumeChange={handleVolumeChange}
        onClick={handleVideoClick}
        onTimeUpdate={handleProgress}
        autoplay
        controls
        muted
        ref={videoRef!}
        src={props.src}
      >
        Browser does not support video
      </video>
      <ActionIcon ref={actionContainer!} action={dispatchedAction()!} />
    </>
  );
}
