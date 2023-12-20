import { JSX, createSignal, onMount } from "solid-js";

type Props = {
  src: string;
  onVideoError: () => void;
  onAudioError: () => void;
};

type VideoEventType = Parameters<JSX.EventHandler<HTMLVideoElement, Event>>[0];

export default function VideoPlayer(props: Props) {
  let isAudioFailed = false;
  let isVideoFailed = false;

  function handleCodecsError(e: VideoEventType) {
    if (isAudioFailed || isVideoFailed) {
      return;
    }
    let audioDecodedBytes: number | undefined =
      // @ts-expect-error
      e.currentTarget.webkitAudioDecodedByteCount;
    let videoDecodedBytes: number | undefined =
      // @ts-expect-error
      e.currentTarget.webkitVideoDecodedByteCount;

    if (
      videoDecodedBytes !== undefined &&
      audioDecodedBytes !== undefined &&
      e.currentTarget.duration > 0
    ) {
      if (videoDecodedBytes == 0) {
        isVideoFailed = true;
        props.onVideoError();
      }
      if (audioDecodedBytes == 0) {
        isAudioFailed = true;
        props.onAudioError();
      }
    }
  }

  let videoRef: HTMLVideoElement;

  function handleVideoError(event: VideoEventType) {
    console.error(event.currentTarget.error);
  }

  function handleProgress(event: VideoEventType) {
    handleCodecsError(event);
  }

  return (
    <div class="w-full h-full">
      <video
        onError={handleVideoError}
        onTimeUpdate={handleProgress}
        autoplay
        muted
        ref={videoRef!}
        src={props.src}
      >
        Browser does not support video
      </video>
    </div>
  );
}
