import { createSignal, Show } from "solid-js";
import { Schemas, server } from "../../utils/serverApi";
import AddVersion, { capabilitiesBg } from "../VersionSlider/AddVersion";
import Modal, { ModalProps } from "./Modal";
import { canPlayAfterTranscode } from "../../utils/mediaCapabilities/mediaCapabilities";
import { createStore } from "solid-js/store";
import { FiAlertTriangle } from "solid-icons/fi";
import { useNotifications } from "../../context/NotificationContext";

type Props = {
  video: Schemas["DetailedVideo"];
};

function defaultTrack<T extends { is_default: boolean }>(tracks: T[]) {
  return tracks.find((t) => t.is_default) ?? tracks[0];
}

function stringCodec<T extends string | { other: string }>(codec: T) {
  if (typeof codec == "object") {
    return codec.other;
  } else {
    return codec;
  }
}

export function TranscodeModal(props: Props & ModalProps) {
  let notifiactor = useNotifications();
  let defaultVideo = () => defaultTrack(props.video.video_tracks);
  let defaultAudio = () => defaultTrack(props.video.audio_tracks);
  let [transcodePayload, setTranscodePayload] = createStore({
    resolution: defaultVideo().resolution,
    audio_codec: defaultAudio().codec,
    audio_track: undefined,
    video_codec: defaultVideo().codec,
  });

  function onChange<T extends keyof typeof transcodePayload>(
    key: T,
    value: (typeof transcodePayload)[T],
  ) {
    setTranscodePayload(key, value);
    checkCompatibility().then((r) => setWillPlay(r));
  }

  let [willPlay, setWillPlay] =
    createSignal<Awaited<ReturnType<typeof canPlayAfterTranscode>>>();

  let checkCompatibility = async () => {
    return await canPlayAfterTranscode(
      transcodePayload.resolution,
      defaultVideo().framerate,
      transcodePayload.video_codec,
      transcodePayload.audio_codec,
    );
  };
  checkCompatibility().then((r) => setWillPlay(r));

  let redundancy = () => {
    for (let variant of props.video.variants) {
      let video = defaultTrack(variant.video_tracks);
      let audio = defaultTrack(variant.audio_tracks);
      if (
        stringCodec(video.codec) == stringCodec(transcodePayload.video_codec) &&
        video.resolution == transcodePayload.resolution &&
        stringCodec(audio.codec) == stringCodec(transcodePayload.audio_codec)
      ) {
        return { conflictIn: "variant", variantId: variant.id } as const;
      }
    }

    if (
      stringCodec(defaultVideo().codec) ===
        stringCodec(transcodePayload.video_codec) &&
      stringCodec(defaultAudio().codec) ===
        stringCodec(transcodePayload.audio_codec)
    ) {
      return { conflictIn: "source" } as const;
    }
  };

  function handleSubmit(
    e: Event & {
      submitter: HTMLElement;
    } & {
      currentTarget: HTMLFormElement;
      target: Element;
    },
  ) {
    let filteredPayload: Schemas["TranscodePayload"] = {};
    if (
      defaultVideo().resolution.width !== transcodePayload.resolution.width ||
      defaultVideo().resolution.height !== transcodePayload.resolution.height
    ) {
      filteredPayload.resolution = transcodePayload.resolution;
    }
    if (
      stringCodec(defaultVideo().codec) !==
      stringCodec(transcodePayload.video_codec)
    ) {
      filteredPayload.video_codec = transcodePayload.video_codec;
    }

    if (
      stringCodec(defaultAudio().codec) !==
      stringCodec(transcodePayload.audio_codec)
    ) {
      filteredPayload.audio_codec = transcodePayload.audio_codec;
    }
    server
      .POST("/api/video/{id}/transcode", {
        params: { path: { id: props.video.id } },
        body: filteredPayload,
      })
      .then((r) => {
        if (r.error) {
          notifiactor(`Failed to start transcode job`);
        }
      });
  }

  return (
    <Modal ref={props.ref}>
      <div class="flex h-full flex-col items-center justify-center">
        <AddVersion
          video={willPlay()?.video}
          selectedPayload={transcodePayload}
          audio={willPlay()?.audio}
          originalVideo={props.video}
          onAudioChange={(a) => onChange("audio_codec", a)}
          onVideoChange={(a) => onChange("video_codec", a)}
          onResolutionChange={(a) => onChange("resolution", a)}
        />
        <Show when={willPlay()?.combined.supported}>
          {(r) => (
            <div
              class={`flex w-full items-center rounded-lg ${capabilitiesBg(willPlay()?.combined)}`}
            >
              Selected configuration will play in your browser
            </div>
          )}
        </Show>
        <form class="flex flex-col" onSubmit={handleSubmit} method="dialog">
          <Show when={redundancy()}>
            {(r) => (
              <div role="alert" class="alert alert-warning">
                <FiAlertTriangle class="h-6 w-6 shrink-0 stroke-current" />
                <span>
                  Current configuration duplicates{" "}
                  {r().conflictIn == "source"
                    ? "original video"
                    : `existing variant with id: ${r().variantId}`}
                </span>
              </div>
            )}
          </Show>
          <button class="btn">Transcode</button>
        </form>
      </div>
    </Modal>
  );
}
