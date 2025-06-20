import { FiMaximize, FiPause, FiPlay, FiSettings } from "solid-icons/fi";
import {
  JSX,
  ParentProps,
  Show,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import VolumeIcon from "./VolumeIcon";
import Preview from "./Preview";
import { FaSolidClosedCaptioning } from "solid-icons/fa";
import ActionIcon from "./ActionIcon";
import Subtitles from "./Subtitles";
import PlayerMenu from "./PlayerMenu";
import { fullUrl, Schemas } from "../../utils/serverApi";
import Hls from "hls.js";
import clsx from "clsx";
import { Button } from "@/ui/button";
import { useTracksSelection } from "@/pages/Watch/TracksSelectionContext";
import tracing from "@/utils/tracing";
import { StreamParams } from "@/pages/Watch";

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
  url: string;
};

type Props = {
  initialTime: number;
  onVideoError: (error?: MediaError) => void;
  onAudioError: () => void;
  onHistoryUpdate: (time: number) => void;
  previews?: { videoId: number; previewsAmount: number };
  streamParams: StreamParams;
  hls: Hls;
  intro?: Schemas["Intro"];
  nextVideo?: NextVideo;
} & ParentProps;

const DEFAULT_VOLUME = 0.5;

type PlaybackState = "playing" | "pause" | "buffering" | "error";

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

  let videoRef: HTMLVideoElement = {} as any;
  let videoContainerRef: HTMLDivElement = {} as any;
  let timelineRef: HTMLDivElement = {} as any;
  let menuRef: HTMLDivElement = {} as any;
  let menuBtnRef: HTMLButtonElement = {} as any;
  let actionContainer: HTMLDivElement = {} as any;

  let [{ tracks }] = useTracksSelection();
  let showControlsTimeout: ReturnType<typeof setTimeout>;
  let [previewPosition, setPreviewPosition] = createSignal<number | null>(null);
  let [isPaused, setIsPaused] = createSignal(true);
  let [isError, setIsError] = createSignal(false);
  let [isMetadataLoading, setIsMetadataLoading] = createSignal(true);
  let [isWaiting, setIsWaiting] = createSignal(false);
  let [isMuted, setIsMuted] = createSignal(false);
  let [isEnded, setIsEnded] = createSignal(false);
  let isScubbing = false;
  let lastSynced = 0;
  let [isFullScreen, setIsFullScreen] = createSignal(false);
  let [showControls, setShowControls] = createSignal(true);
  let [showCaptions, setShowCaptions] = createSignal(
    tracks.subtitles !== undefined,
  );
  let [showMenu, setShowMenu] = createSignal(false);
  let [volume, setVolume] = createSignal(getInitialVolume());
  let [playbackSpeed, setPlaybackSpeed] = createSignal(1);
  let [time, setTime] = createSignal(props.initialTime);
  let [duration, setDuration] = createSignal(0);
  let [playbackState, setPlaybackState] =
    createSignal<PlaybackState>("buffering");

  let shouldShowControls = () =>
    (showControls() || isScubbing || isEnded() || showMenu()) &&
    !isMetadataLoading() &&
    !isError() &&
    videoRef;

  let [dispatchedAction, setDispatchedAction] =
    createSignal<DispatchedAction>("unpause");

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
      force ? videoRef.play() : videoRef.pause();
      force ? dispatchAction("unpause") : dispatchAction("pause");
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
      force
        ? videoContainerRef.requestFullscreen()
        : document.fullscreenElement != null && document.exitFullscreen();
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
    if (!isMetadataLoading() && Math.abs(curTime - lastSynced) > 5 && !isScubbing) {
      let time = Math.floor(curTime);
      tracing.trace({ time }, "Updating video history");
      props.onHistoryUpdate(time);
      lastSynced = curTime;
    }
  }

  let pauseTimeout: ReturnType<typeof setTimeout>;
  let pauseClicked = false;
  function handleClick() {
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

  function handleScubbing(e: MouseEvent) {
    e.preventDefault();
    isScubbing = true;
    let rect = timelineRef.getBoundingClientRect();
    let offsetX = e.pageX - rect.left;
    let percent = Math.min(Math.max(0, offsetX), rect.width) / rect.width;
    videoRef.currentTime = Math.min(
      percent * duration(),
      videoRef.duration - 1,
    );
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

  function handleVideoError() {
    setPlaybackState("error");
    props.onVideoError(videoRef.error ?? undefined);
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
      videoRef.currentTime -= 10;
      resetOverlayTimeout();
    }
    if (event.code == "KeyK") {
      togglePlay();
    }
    if (event.code == "KeyL") {
      videoRef.currentTime += 10;
      resetOverlayTimeout();
    }
    if (event.code == "ArrowLeft") {
      videoRef.currentTime -= 5;
      dispatchAction("seekleft");
      resetOverlayTimeout();
    }
    if (event.code == "ArrowRight") {
      videoRef.currentTime += 5;
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
    if (delta >= 0) dispatchAction("volumeup");
    else dispatchAction("volumedown");

    saveVolume(newVolume);
    setVolume(newVolume);
  }

  function handleMouseUp(e: MouseEvent) {
    isScubbing = false;
    if (videoRef) handleSync(videoRef.currentTime);
    let target = e.target as HTMLElement;
    if (!menuRef?.contains(target) && !menuBtnRef?.contains(target))
      setShowMenu(false);
  }
  function handleMouseMove(e: MouseEvent) {
    if (!isScubbing) return;
    handleScubbing(e);
  }

  let directStreamUrl = () => {
    if (props.streamParams.method == "direct") {
      return props.streamParams.watchUrl;
    }
  };
  onMount(() => {
    tracing.debug("Mounted video player");
    props.hls.attachMedia(videoRef);
    if (props.streamParams.method == "direct") {
      videoRef.src = props.streamParams.watchUrl;
    }
    videoRef.volume = getInitialVolume();
    window.addEventListener("keydown", handleKeyboardPress);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousemove", handleMouseMove);
  });

  onCleanup(() => {
    tracing.debug("Unmounted video player");
    setIsMetadataLoading(true);
    props.hls.destroy();
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    window.removeEventListener("keydown", handleKeyboardPress);
  });

  return (
    <div
      ref={videoContainerRef!}
      onMouseLeave={() => setShowControls(false)}
      class={`relative flex h-screen w-screen items-center justify-center text-white ${showControls() ? "" : "cursor-none"}`}
    >
      <video
        src={directStreamUrl()}
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
          setTime(e.currentTarget.currentTime);
          handleSync(e.currentTarget.currentTime);
        }}
        onPlaying={() => setIsWaiting(false)}
        onLoadedMetadata={(e) => {
          e.currentTarget.currentTime = props.initialTime;
          setDuration(e.currentTarget.duration);
          setIsMetadataLoading(false);
          setIsError(false);
          setIsEnded(false);
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
        class={clsx(
          "h-full w-full",
          (isMetadataLoading() || isEnded()) && "hidden",
        )}
        autoplay
        draggable={false}
      >
        Browser does not support videos
      </video>
      <ActionIcon ref={actionContainer!} action={dispatchedAction()} />
      <Show when={tracks.subtitles !== undefined && showCaptions()}>
        <Subtitles time={Math.floor(time() * 1000)} />
      </Show>
      <div class="absolute bottom-20 right-20">
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
              <Button
                as="a"
                href={next().url}
                onClick={() => setIsMetadataLoading(true)}
                variant={"outline"}
                class="bg-black/80 py-5 text-lg hover:bg-black"
              >
                Next: {next().nextTitle}
              </Button>
            </Show>
          )}
        </Show>
      </div>
      {/* This "overlay" exists to prevent click on video that causes pause after closed menu */}
      <div
        class={`${showMenu() ? "absolute" : "hidden"} bottom-0 left-0 right-0 top-0 h-full min-h-full w-full min-w-full`}
      >
        <div ref={menuRef!} class="absolute bottom-16 right-5">
          <PlayerMenu
            videoRef={videoRef}
            onPlaybackSpeedChange={changePlaybackSpeed}
            currentPlaybackSpeed={playbackSpeed()}
          />
        </div>
      </div>
      <div
        class={`${shouldShowControls() ? "opacity-100" : "opacity-0"
          } transition-opacity duration-200`}
      >
        <div class="h-full w-full bg-red-400">{props.children}</div>
        <div
          onMouseMove={() => {
            clearTimeout(showControlsTimeout);
            setShowControls(true);
          }}
          class={`absolute bottom-0 left-0 right-0 animate-fade-in transition-opacity`}
        >
          <div
            class="group flex h-4 cursor-pointer items-end"
            ref={timelineRef!}
            onMouseDown={handleScubbing}
            onMouseMove={(e) => {
              let bounds = timelineRef.getBoundingClientRect();
              setPreviewPosition(e.pageX - bounds.left);
            }}
            onMouseLeave={() => {
              setPreviewPosition(null);
            }}
          >
            <Show when={previewPosition() !== null && props.previews}>
              <Preview
                src={fullUrl("/api/video/{id}/previews/{number}", {
                  path: {
                    id: props.previews!.videoId,
                    number: Math.max(
                      Math.round(
                        (previewPosition()! / timelineRef!.offsetWidth) *
                        props.previews!.previewsAmount,
                      ),
                      1,
                    ),
                  },
                })}
                X={previewPosition()!}
                timelineWidth={timelineRef!.offsetWidth}
                time={formatDuration(
                  Math.max(
                    Math.round(
                      (duration() * previewPosition()!) /
                      timelineRef!.offsetWidth,
                    ),
                    0,
                  ),
                )}
              />
            </Show>
            <div class="absolute left-0 right-0 flex h-1.5 w-full bg-neutral-900">
              <div
                class="after:content-[' '] flex h-full items-center justify-end rounded-md bg-white after:translate-x-2 after:rounded-full after:bg-white after:p-2 after:opacity-0 after:transition-opacity after:duration-150 after:group-hover:opacity-100"
                style={{
                  width: `${(time() / duration()) * 100}%`,
                }}
              ></div>
            </div>
          </div>
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
                <span>
                  {formatDuration(time()) + " / " + formatDuration(duration())}
                </span>
              </div>
            </div>

            <div class="flex select-none items-center gap-5">
              <button class={"cursor-pointer"} onClick={() => toggleCaptions()}>
                <FaSolidClosedCaptioning
                  class={`${tracks.subtitles && showCaptions() ? "fill-white" : "fill-neutral-700"}`}
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
              <div
                class="cursor-pointer p-2 hover:scale-105"
                onClick={() => toggleFullScreenMode()}
              >
                <FiMaximize size={30} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
