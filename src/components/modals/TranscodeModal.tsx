import { createSignal, Show } from "solid-js";
import { Schemas } from "../../utils/serverApi";
import AddVersion from "../VersionSlider/AddVersion";
import { canPlayAfterTranscode } from "../../utils/mediaCapabilities/mediaCapabilities";
import { createStore } from "solid-js/store";
import { FiAlertTriangle } from "solid-icons/fi";
import { Dialog, DialogContent } from "@/ui/dialog";
import { Video } from "@/utils/library";
import { Button } from "@/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/ui/alert";

type Props = {
  video: Video;
  isOpen: boolean;
  onClose?: () => void;
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

export function TranscodeModal(props: Props) {
  let [transcodePayload, setTranscodePayload] = createStore({
    resolution: props.video.defaultVideo().resolution,
    audio_codec: props.video.defaultAudio().codec,
    audio_track: undefined,
    video_codec: props.video.defaultVideo().codec,
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
      props.video.defaultVideo().framerate,
      transcodePayload.video_codec,
      transcodePayload.audio_codec,
    );
  };
  checkCompatibility().then((r) => setWillPlay(r));

  let redundancy = () => {
    for (let variant of props.video.details.variants) {
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
      stringCodec(props.video.defaultVideo().codec) ===
        stringCodec(transcodePayload.video_codec) &&
      stringCodec(props.video.defaultAudio().codec) ===
        stringCodec(transcodePayload.audio_codec)
    ) {
      return { conflictIn: "source" } as const;
    }
  };

  function handleSubmit() {
    let filteredPayload: Schemas["TranscodePayload"] = {};
    if (
      props.video.defaultVideo().resolution.width !==
        transcodePayload.resolution.width ||
      props.video.defaultVideo().resolution.height !==
        transcodePayload.resolution.height
    ) {
      filteredPayload.resolution = transcodePayload.resolution;
    }
    if (
      stringCodec(props.video.defaultVideo().codec) !==
      stringCodec(transcodePayload.video_codec)
    ) {
      filteredPayload.video_codec = transcodePayload.video_codec;
    }

    if (
      stringCodec(props.video.defaultAudio().codec) !==
      stringCodec(transcodePayload.audio_codec)
    ) {
      filteredPayload.audio_codec = transcodePayload.audio_codec;
    }
    props.video.transcode(filteredPayload);
    props.onClose && props.onClose();
  }

  return (
    <Dialog
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          props.onClose && props.onClose();
        }
      }}
      open={props.isOpen}
    >
      <DialogContent class="w-full max-w-4xl text-white">
        <div class="flex flex-col gap-4 items-center justify-center">
          <AddVersion
            video={willPlay()?.video}
            selectedPayload={transcodePayload}
            audio={willPlay()?.audio}
            originalVideo={props.video}
            onAudioChange={(a) => onChange("audio_codec", a)}
            onVideoChange={(a) => onChange("video_codec", a)}
            onResolutionChange={(a) => onChange("resolution", a)}
          />
          <form class="flex flex-col gap-4" onSubmit={handleSubmit} method="dialog">
            <Show when={redundancy()}>
              {(r) => (
                <Alert>
                  <FiAlertTriangle class="h-4 w-4" />
                  <AlertTitle>Warning: </AlertTitle>
                  <AlertDescription>
                    Current configuration duplicates{" "}
                    {r().conflictIn == "source"
                      ? "original video"
                      : `existing variant with id: ${r().variantId}`}
                  </AlertDescription>
                </Alert>
              )}
            </Show>
            <Button type="submit">Transcode</Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
