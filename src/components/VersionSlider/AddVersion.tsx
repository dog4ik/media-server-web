import { For, Match, ParentProps, Show, Switch } from "solid-js";
import { createStore } from "solid-js/store";
import Selection, { Option } from "../../components/ui/Selection";
import { Schemas } from "../../utils/serverApi";
import { FiFeather, FiZap, FiZapOff } from "solid-icons/fi";

type Resolution = Schemas["Resolution"];
type ResolutionString = `${number}x${number}`;
type AudioCodec = Schemas["AudioCodec"];
type VideoCodec = Schemas["VideoCodec"];

type Props = {
  onAudioChange: (payload: AudioCodec) => void;
  onVideoChange: (payload: VideoCodec) => void;
  onResolutionChange: (payload: Resolution) => void;
  selectedPayload: Schemas["TranscodePayload"];
  originalVideo: Schemas["DetailedVideo"];
  video?: MediaCapabilitiesDecodingInfo;
  audio?: MediaCapabilitiesDecodingInfo;
};

function serializeResolution(res: Resolution): ResolutionString {
  return `${res.width}x${res.height}`;
}

function deserializeResolution(res: ResolutionString): Resolution {
  let [width, height] = res.split("x");
  return { width: +width, height: +height };
}

type ExcludeOther<T> = T extends { other: string } ? never : T;

const resolutionOptions: Resolution[] = [
  { width: 1920, height: 1080 },
  { width: 1280, height: 720 },
  { width: 640, height: 480 },
];
const videoCodecOptions: ExcludeOther<VideoCodec>[] = ["hevc", "h264"];
const audioCodecOptions: ExcludeOther<AudioCodec>[] = ["aac", "ac3"];

type SelectionProps<T> = {
  onChange: (value: T) => void;
};

type ResolutionSelectionProps = {
  maxResolution: Resolution;
  currentValue: Resolution;
};

function ResolutionSelection(
  props: SelectionProps<Schemas["Resolution"]> & ResolutionSelectionProps,
) {
  let maxResolutionString = serializeResolution(props.maxResolution);
  return (
    <div>
      <label for="resolution-selection">Choose a resolution:</label>
      <Selection value={serializeResolution(props.currentValue)}>
        <Option
          onClick={() =>
            props.onChange(deserializeResolution(maxResolutionString))
          }
        >
          Unchanged: {maxResolutionString}
        </Option>
        <For
          each={resolutionOptions.filter(
            (o) =>
              o.width <= props.maxResolution.width &&
              o.height <= props.maxResolution.height,
          )}
        >
          {(r) => {
            let str = serializeResolution(r);
            return <Option onClick={() => props.onChange(r)}>{str}</Option>;
          }}
        </For>
      </Selection>
    </div>
  );
}

type AudioSelectionProps = {
  defaultAudio: AudioCodec;
  currentValue: AudioCodec;
};

function AudioSelection(
  props: SelectionProps<AudioCodec> & AudioSelectionProps,
) {
  let defaultAudioCodec = () => {
    let defaultAudio: string;
    if (typeof props.defaultAudio == "object") {
      defaultAudio = props.defaultAudio.other;
    } else {
      defaultAudio = props.defaultAudio;
    }
    return defaultAudio;
  };

  function onChange(codec: string) {
    if (audioCodecOptions.includes(codec as ExcludeOther<AudioCodec>)) {
      props.onChange(codec as AudioCodec);
    } else {
      props.onChange({ other: codec } as AudioCodec);
    }
  }

  let currentValue = () =>
    typeof props.currentValue === "object"
      ? props.currentValue.other
      : props.currentValue;

  return (
    <div>
      <label for="audio-selection">Choose an audio codec:</label>
      <Selection value={currentValue()}>
        <Option onClick={() => onChange(defaultAudioCodec())}>
          Unchanged: {defaultAudioCodec()}
        </Option>
        <For each={audioCodecOptions}>
          {(c) => <Option onClick={() => onChange(c)}>{c}</Option>}
        </For>
      </Selection>
    </div>
  );
}

type VideoSelectionProps = {
  defaultVideo: VideoCodec;
  currentValue: VideoCodec;
};

function VideoSelection(
  props: SelectionProps<VideoCodec> & VideoSelectionProps,
) {
  let defaultVideoCodec = () => {
    let defaultVideo: string;
    if (typeof props.defaultVideo == "object") {
      defaultVideo = props.defaultVideo.other;
    } else {
      defaultVideo = props.defaultVideo;
    }
    return defaultVideo;
  };

  function onChange(codec: string) {
    if (videoCodecOptions.includes(codec as ExcludeOther<VideoCodec>)) {
      props.onChange(codec as VideoCodec);
    } else {
      props.onChange({ other: codec } as VideoCodec);
    }
  }

  let currentValue = () =>
    typeof props.currentValue == "object"
      ? props.currentValue.other
      : props.currentValue;

  return (
    <div>
      <label for="video-selection">Choose a video codec:</label>
      <Selection value={currentValue()}>
        <Option onClick={() => onChange(defaultVideoCodec())}>
          Unchanged: {defaultVideoCodec()}
        </Option>
        <For each={videoCodecOptions}>
          {(c) => {
            return <Option onClick={() => onChange(c)}>{c}</Option>;
          }}
        </For>
      </Selection>
    </div>
  );
}

type ColumnProps = {
  capabilities?: MediaCapabilitiesDecodingInfo;
};

export function capabilitiesBg(capabilities?: MediaCapabilitiesDecodingInfo) {
  if (!capabilities) {
    return "bg-white";
  }
  if (capabilities.supported) {
    return "bg-green-500";
  } else {
    return "bg-red-500";
  }
}

export function Column(props: ColumnProps & ParentProps) {
  return (
    <div
      class={`flex flex-col justify-center gap-5 rounded-lg p-6 ${capabilitiesBg(props.capabilities)}`}
    >
      {props.children}
    </div>
  );
}

function SmoothStats(props: { capabilities: MediaCapabilitiesDecodingInfo }) {
  return (
    <>
      <Show
        when={props.capabilities.smooth}
        fallback={
          <div role="alert" class="alert alert-warning">
            <FiFeather class="h-6 w-6 shrink-0 stroke-current" />
            <span>Not smooth</span>
          </div>
        }
      >
        <div role="alert" class="alert alert-info">
          <FiFeather class="h-6 w-6 shrink-0 stroke-current" />
          <span>Smooth and easy</span>
        </div>
      </Show>
      <Show
        when={props.capabilities.powerEfficient}
        fallback={
          <div role="alert" class="alert alert-warning">
            <FiZapOff class="h-6 w-6 shrink-0 stroke-current" />
            <span>Not power efficient</span>
          </div>
        }
      >
        <div role="alert" class="alert alert-info">
          <FiZap class="h-6 w-6 shrink-0 stroke-current" />
          <span>Power efficient</span>
        </div>
      </Show>
    </>
  );
}

export default function AddVersion(props: Props) {
  let originalResolution = () => props.originalVideo.video_tracks[0].resolution;
  let originalAudio = () =>
    props.originalVideo.audio_tracks.find((t) => t.is_default) ??
    props.originalVideo.audio_tracks[0];
  let originalVideo = () =>
    props.originalVideo.video_tracks.find((t) => t.is_default) ??
    props.originalVideo.video_tracks[0];

  return (
    <div class="flex flex-col">
      <div class="grid grid-cols-2 gap-4">
        <Column capabilities={props.video}>
          <ResolutionSelection
            onChange={(s) => props.onResolutionChange(s)}
            maxResolution={originalResolution()}
            currentValue={
              props.selectedPayload.resolution ?? originalResolution()
            }
          />
          <VideoSelection
            onChange={(s) => props.onVideoChange(s)}
            defaultVideo={originalVideo().codec}
            currentValue={
              props.selectedPayload.video_codec ?? originalVideo().codec
            }
          />
          <Show
            when={props.video}
            fallback={
              <span>Can't figure out if configuration can be played</span>
            }
          >
            {(v) => (
              <Show when={v().supported}>
                <span>
                  Selected video configuration is supported and will play in
                  this browser
                </span>
                <SmoothStats capabilities={v()} />
              </Show>
            )}
          </Show>
        </Column>
        <Column capabilities={props.audio}>
          <AudioSelection
            onChange={(s) => props.onAudioChange(s)}
            defaultAudio={originalAudio().codec}
            currentValue={
              props.selectedPayload.audio_codec ?? originalAudio().codec
            }
          />
          <Show
            when={props.audio}
            fallback={<span>Can't figure out if audio can be played</span>}
          >
            {(a) => (
              <>
                <Show
                  fallback={
                    <span>
                      Selected audio configuration is not supported in this
                      browser
                    </span>
                  }
                  when={a().supported}
                >
                  <span>
                    Selected audio configuration is supported and will play in
                    this browser
                  </span>
                  <SmoothStats capabilities={a()} />
                </Show>
              </>
            )}
          </Show>
        </Column>
      </div>
    </div>
  );
}
