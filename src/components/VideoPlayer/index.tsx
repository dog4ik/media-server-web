import { FiLoader, FiMaximize, FiPause, FiPlay, FiSettings } from "solid-icons/fi";
import { JSX, ParentProps, Show, createSignal, onCleanup, onMount } from "solid-js";
import VolumeIcon from "./VolumeIcon";
import Timeline from "./Timeline";
import { FaSolidClosedCaptioning } from "solid-icons/fa";
import ActionIcon from "./ActionIcon";
import Subtitles from "./Subtitles";
import PlayerMenu from "./PlayerMenu";
import { Schemas } from "../../utils/serverApi";
import clsx from "clsx";
import { Button } from "@/ui/button";
import { useTracksSelection } from "@/pages/Watch/TracksSelectionContext";
import tracing from "@/utils/tracing";
import { Link, LinkOptions } from "@tanstack/solid-router";
import { MediaSessionState } from "@/lib/mediaSession";

function formatDuration(time: number) {
  let leadingZeroFormatter = new Intl.NumberFormat(undefined, {
    minimumIntegerDigits: 2,
  });
  let seconds = Math.floor(time % 60);
  let minutes = Math.floor(time / 60) % 60;
  let hours = Math.floor(time / 3600);
  if (hours === 0) {
    return `${minutes}:${leadingZeroFormatter.format(seconds)}`;
  } else {
    return `${hours}:${leadingZeroFormatter.format(
      minutes,
    )}:${leadingZeroFormatter.format(seconds)}`;
  }
}

export type NextVideo = {
  nextTitle: string;
  url: LinkOptions;
};

type Props = {
  /**
   * Initial position of the video in seconds
   */
  initialTime: number;
  /**
   * Initial duration of the video in seconds
   */
  initialDuration: number;
  onHistoryUpdate: (time: number) => void;
  previews?: { videoId: number; previewsAmount: number };
  mediaSession: MediaSessionState;
  intro?: Schemas["Intro"];
  chapters: Schemas["DetailedChapter"][];
  nextVideo?: NextVideo;
} & ParentProps;

const DEFAULT_VOLUME = 0.5;

export type StreamingMethod = "hls" | "direct";

export type DispatchedAction =
  | "pause"
  | "unpause"
  | "volumeup"
  | "volumedown"
  | "togglesubs"
  | "seekright"
  | "seekleft";

type VideoEventType = Parameters<JSX.EventHandler<HTMLVideoElement, Event>>[0];

function getInitialVolume() {
  let localStorageVolume = localStorage.getItem("volume");
  if (localStorageVolume === null) {
    saveVolume(DEFAULT_VOLUME);
    return DEFAULT_VOLUME;
  } else {
    return Math.min(Math.max(parseFloat(localStorageVolume), 0), 1);
  }
}

function getActionAnimation() {
  let animationOptions = { duration: 400 };
  let animation = [
    { transform: "scale(1)", opacity: 1 },
    { transform: "scale(1.2)", opacity: 0 },
  ];
  return { animationOptions, animation };
}
let { animationOptions, animation } = getActionAnimation();

function saveVolume(volume: number) {
  localStorage.setItem("volume", volume.toString());
}

export default function VideoPlayer(props: Props) {
  let videoRef: HTMLVideoElement = {} as any;
  let videoContainerRef: HTMLDivElement = {} as any;
  let menuRef: HTMLDivElement = {} as any;
  let menuBtnRef: HTMLButtonElement = {} as any;
  let actionContainer: HTMLDivElement = {} as any;

  let [{ tracks }] = useTracksSelection();
  let showControlsTimeout: ReturnType<typeof setTimeout>;
  let [isPaused, setIsPaused] = createSignal(true);
  let [isError, setIsError] = createSignal(false);
  let [isMetadataLoading, setIsMetadataLoading] = createSignal(true);
  let [isWaiting, setIsWaiting] = createSignal(false);
  let [isMuted, setIsMuted] = createSignal(false);
  let [isEnded, setIsEnded] = createSignal(false);
  let [isScrubbing, setIsScrubbing] = createSignal(false);
  let lastSynced = 0;
  let [isFullScreen, setIsFullScreen] = createSignal(false);
  let [showControls, setShowControls] = createSignal(true);
  let [showCaptions, setShowCaptions] = createSignal(tracks.subtitles !== undefined);
  let [showMenu, setShowMenu] = createSignal(false);
  let [volume, setVolume] = createSignal(getInitialVolume());
  let [playbackSpeed, setPlaybackSpeed] = createSignal(1);
  let [time, setTime] = createSignal(props.initialTime);
  let [duration, setDuration] = createSignal(props.initialDuration);

  let shouldShowControls = () =>
    (showControls() || isScrubbing() || isEnded() || showMenu()) &&
    !isMetadataLoading() &&
    !isError() &&
    videoRef;

  let [dispatchedAction, setDispatchedAction] = createSignal<DispatchedAction>("unpause");

  function changeVolume(state: number) {
    if (state > 1) {
      videoRef.volume = 1;
      return;
    }
    if (state < 0) {
      videoRef.volume = 0;
      return;
    }
    videoRef.volume = state;
  }

  function changePlaybackSpeed(speed: number) {
    videoRef.playbackRate = speed;
    setPlaybackSpeed(speed);
  }

  function togglePlay(force?: boolean) {
    resetOverlayTimeout();
    if (force !== undefined) {
      if (force) {
        videoRef.play();
        dispatchAction("unpause");
      } else {
        videoRef.pause();
        dispatchAction("pause");
      }
      return;
    }
    if (videoRef.paused) {
      videoRef.play();
      dispatchAction("unpause");
    } else {
      videoRef.pause();
      dispatchAction("pause");
    }
  }

  function toggleFullScreenMode(force?: boolean) {
    resetOverlayTimeout();
    if (force !== undefined) {
      if (force) {
        videoContainerRef.requestFullscreen();
      } else if (document.fullscreenElement != null) {
        document.exitFullscreen();
      }
      setIsFullScreen(force);
      return;
    }
    if (document.fullscreenElement == null) {
      videoContainerRef.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  }

  function toggleCaptions() {
    resetOverlayTimeout();
    if (!tracks.subtitles) return;
    dispatchAction("togglesubs");
    setShowCaptions(!showCaptions());
  }

  function toggleMute() {
    if (videoRef.muted) {
      videoRef.muted = false;
      setIsMuted(false);
    } else {
      videoRef.muted = true;
      setIsMuted(true);
    }
  }
  function handleSync(curTime: number) {
    if (!isMetadataLoading() && Math.abs(curTime - lastSynced) > 5 && !isScrubbing()) {
      let time = Math.floor(curTime);
      tracing.trace({ time }, "Updating video history");
      props.onHistoryUpdate(time);
      lastSynced = curTime;
    }
  }

  let pauseTimeout: ReturnType<typeof setTimeout>;
  let pauseClicked = false;
  function handleClick() {
    // A click on the video while the menu is open should only dismiss the menu,
    // not toggle playback. Handling it here (instead of in the document mouseup
    // listener) lets us swallow the click before it reaches the play toggle.
    if (showMenu()) {
      setShowMenu(false);
      return;
    }
    if (pauseClicked === false) {
      pauseTimeout = setTimeout(() => {
        togglePlay();
        pauseClicked = false;
      }, 200);
    }
    pauseClicked = true;
  }

  function handleDoubleClick() {
    pauseClicked = false;
    clearTimeout(pauseTimeout);
    toggleFullScreenMode();
  }

  // Seeks are debounced for HLS streams only, to avoid frequent job restarts.
  let seekDebounceTimeout: ReturnType<typeof setTimeout>;
  let pendingSeekTarget: number | null = null;

  function clampTime(seconds: number) {
    let max = (duration() || videoRef.duration) - 1;
    return Math.max(0, Math.min(seconds, max));
  }

  function commitSeek() {
    if (pendingSeekTarget === null || !videoRef) return;
    videoRef.currentTime = pendingSeekTarget;
    pendingSeekTarget = null;
    videoRef.play();
  }

  function requestSeek(seconds: number, defer: boolean) {
    if (!videoRef) return;
    clearTimeout(seekDebounceTimeout);
    pendingSeekTarget = null;
    let target = clampTime(seconds);
    if (props.mediaSession.session?.type !== "hls") {
      videoRef.currentTime = target;
      return;
    }
    videoRef.pause();
    pendingSeekTarget = target;
    setTime(target);
    if (defer) seekDebounceTimeout = setTimeout(commitSeek, 300);
  }

  function handleSeek(percent: number) {
    requestSeek(percent * duration(), !isScrubbing());
  }

  function seekRelative(delta: number) {
    if (!videoRef) return;
    requestSeek((pendingSeekTarget ?? videoRef.currentTime) + delta, true);
  }

  function handleScrubbingChange(scrubbing: boolean) {
    setIsScrubbing(scrubbing);
    if (!scrubbing) {
      commitSeek();
      if (videoRef) handleSync(videoRef.currentTime);
    }
  }

  function resetOverlayTimeout() {
    setShowControls(true);
    clearTimeout(showControlsTimeout);
    showControlsTimeout = setTimeout(() => setShowControls(false), 5000);
  }

  function dispatchAction(action: DispatchedAction) {
    setDispatchedAction(action);
    actionContainer.animate(animation, animationOptions);
  }

  function handleKeyboardPress(event: KeyboardEvent) {
    if (event.code == "KeyF") {
      toggleFullScreenMode();
    }
    if (event.code == "Space") {
      event.preventDefault();
      togglePlay();
    }
    if (event.code == "KeyC") {
      toggleCaptions();
      resetOverlayTimeout();
    }
    if (event.code == "KeyJ") {
      seekRelative(-10);
      resetOverlayTimeout();
    }
    if (event.code == "KeyK") {
      togglePlay();
    }
    if (event.code == "KeyL") {
      seekRelative(10);
      resetOverlayTimeout();
    }
    if (event.code == "ArrowLeft") {
      seekRelative(-5);
      dispatchAction("seekleft");
      resetOverlayTimeout();
    }
    if (event.code == "ArrowRight") {
      seekRelative(5);
      dispatchAction("seekright");
      resetOverlayTimeout();
    }
    if (event.code == "ArrowUp") {
      changeVolume(videoRef.volume + 0.05);
      resetOverlayTimeout();
    }
    if (event.code == "ArrowDown") {
      changeVolume(videoRef.volume - 0.05);
      resetOverlayTimeout();
    }
    if (event.code == "KeyM") {
      toggleMute();
      resetOverlayTimeout();
    }
  }

  function handleVolumeChange(event: VideoEventType) {
    let newVolume = event.currentTarget.volume;
    let delta = newVolume - volume();
    tracing.trace({ newVolume, oldVolume: volume(), delta }, "Volume change event");

    if (delta > 0) dispatchAction("volumeup");
    else if (delta < 0) dispatchAction("volumedown");

    saveVolume(newVolume);
    setVolume(newVolume);
  }

  function handleMouseUp(e: MouseEvent) {
    if (videoRef) handleSync(videoRef.currentTime);
    if (!showMenu()) return;
    // Close the menu when clicking outside of it. Clicks on the video are
    // handled in `handleClick` so the play toggle can be suppressed; the menu
    // button toggles the menu itself.
    let target = e.target as HTMLElement;
    if (target !== videoRef && !menuRef?.contains(target) && !menuBtnRef?.contains(target)) {
      setShowMenu(false);
    }
  }

  onMount(() => {
    tracing.debug("Mounted video player");
    props.mediaSession.start(videoRef);
    videoRef.volume = getInitialVolume();
    window.addEventListener("keydown", handleKeyboardPress);
    document.addEventListener("mouseup", handleMouseUp);
  });

  onCleanup(() => {
    tracing.debug("Unmounted video player");
    setIsMetadataLoading(true);
    clearTimeout(seekDebounceTimeout);
    document.removeEventListener("mouseup", handleMouseUp);
    window.removeEventListener("keydown", handleKeyboardPress);
  });

  return (
    <div
      ref={videoContainerRef!}
      onMouseLeave={() => setShowControls(false)}
      class={`relative flex h-screen w-full items-center justify-center text-white ${showControls() ? "" : "cursor-none"}`}
    >
      <video
        onClick={handleClick}
        onPlay={() => {
          setIsPaused(false);
          resetOverlayTimeout();
        }}
        onPause={() => {
          setIsPaused(true);
          resetOverlayTimeout();
        }}
        onDblClick={handleDoubleClick}
        onVolumeChange={handleVolumeChange}
        onContextMenu={(e) => e.preventDefault()}
        onMouseMove={() => {
          resetOverlayTimeout();
        }}
        onTimeUpdate={(e) => {
          if (pendingSeekTarget !== null) return; // keep showing the previewed seek target
          setTime(e.currentTarget.currentTime);
          handleSync(e.currentTarget.currentTime);
        }}
        onPlaying={() => setIsWaiting(false)}
        onLoadedMetadata={(e) => {
          e.currentTarget.currentTime = time();
          setDuration(e.currentTarget.duration);
          setIsMetadataLoading(false);
          setIsError(false);
          setIsEnded(false);
        }}
        onDurationChange={(e) => {
          setDuration(e.currentTarget.duration);
        }}
        onError={() => {
          setIsMetadataLoading(false);
          setIsError(true);
          toggleFullScreenMode(false);
        }}
        onWaiting={() => {
          setIsWaiting(true);
        }}
        muted={isMuted()}
        onSeeking={(e) => {
          if (pendingSeekTarget !== null) return;
          setTime(e.currentTarget.currentTime);
        }}
        onSeeked={(e) => {
          setIsEnded(e.currentTarget.ended);
        }}
        onEnded={(e) => {
          setIsEnded(true);
          tracing.trace("Video end event");
          props.onHistoryUpdate(e.currentTarget.currentTime);
        }}
        ref={videoRef!}
        class={clsx("h-full w-full", (isMetadataLoading() || isEnded()) && "hidden")}
        controls={false}
        autoplay
        draggable={false}
      >
        Browser does not support videos
      </video>
      <ActionIcon ref={actionContainer!} action={dispatchedAction()} />
      <Show when={tracks.subtitles !== undefined && showCaptions()}>
        <Subtitles time={Math.floor(time() * 1000)} />
      </Show>
      <div class="absolute right-20 bottom-20">
        <Show
          when={
            !isMetadataLoading() &&
            props.intro &&
            time() < props.intro.end_sec &&
            time() > props.intro.start_sec
          }
        >
          <Button
            class="bg-black/80 py-5 text-lg text-white hover:bg-black"
            onClick={() => (videoRef.currentTime = props.intro!.end_sec)}
          >
            Skip intro
          </Button>
        </Show>
        <Show when={props.nextVideo}>
          {(next) => (
            <Show when={!isMetadataLoading() && duration() - time() < 120}>
              <Link
                onClick={() => setIsMetadataLoading(true)}
                class="rounded-md bg-black/80 px-2 py-4 text-lg hover:bg-black"
                {...next().url}
              >
                Next: {next().nextTitle}
              </Link>
            </Show>
          )}
        </Show>
      </div>
      <Show when={isWaiting()}>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <FiLoader class="h-10 w-10 animate-spin" />
        </div>
      </Show>
      {/* Rendered only while open so its internal navigation resets on close. */}
      <Show when={showMenu()}>
        <div
          ref={menuRef!}
          class="animate-fade-in absolute right-5 bottom-16 z-10 [animation-duration:150ms]"
        >
          <PlayerMenu
            videoRef={videoRef}
            onPlaybackSpeedChange={changePlaybackSpeed}
            currentPlaybackSpeed={playbackSpeed()}
          />
        </div>
      </Show>
      <div
        class={`${
          shouldShowControls() ? "opacity-100" : "opacity-0"
        } transition-opacity duration-200`}
      >
        <div class="size-full">{props.children}</div>
        <div
          onMouseMove={() => {
            clearTimeout(showControlsTimeout);
            setShowControls(true);
          }}
          class={`animate-fade-in absolute right-0 bottom-0 left-0 transition-opacity`}
        >
          <Timeline
            time={time()}
            duration={duration()}
            previews={props.previews}
            chapters={props.chapters}
            onSeek={handleSeek}
            onScrubbingChange={handleScrubbingChange}
          />
          <div class="flex items-center justify-between bg-black/70">
            <div class="flex gap-4">
              <div class="cursor-pointer p-2" onClick={() => togglePlay()}>
                {isPaused() ? <FiPlay size={30} /> : <FiPause size={30} />}
              </div>
              <div class="group flex items-center transition-all duration-300">
                <div class="cursor-pointer p-2" onClick={() => toggleMute()}>
                  <VolumeIcon volume={volume()} isMuted={isMuted()} />
                </div>

                <input
                  class="h-1.5 w-0 origin-left scale-x-0 rounded-lg bg-neutral-800 accent-white transition-all duration-300 group-hover:w-20 group-hover:scale-x-100"
                  onInput={(e) => {
                    changeVolume(e.target.valueAsNumber / 100);
                  }}
                  type="range"
                  min={0}
                  max={100}
                  value={!isMuted() ? volume() * 100 : 0}
                />
              </div>

              <div class="flex items-center justify-center">
                <span>{formatDuration(time()) + " / " + formatDuration(duration())}</span>
              </div>
            </div>

            <div class="flex items-center gap-5 select-none">
              <button class={"cursor-pointer"} onClick={() => toggleCaptions()}>
                <FaSolidClosedCaptioning
                  class={`${tracks.subtitles && showCaptions() ? "text-white" : "text-neutral-700"}`}
                  size={30}
                />
              </button>
              <button
                ref={menuBtnRef!}
                class={`cursor-pointer ${showMenu() ? "" : ""}`}
                onClick={() => {
                  setShowMenu(!showMenu());
                }}
              >
                <FiSettings size={30} />
              </button>
              <div class="cursor-pointer p-2" onClick={() => toggleFullScreenMode()}>
                <FiMaximize size={30} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
