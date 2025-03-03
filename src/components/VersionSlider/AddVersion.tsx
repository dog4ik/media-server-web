import { createSignal, For, Match, ParentProps, Show, Switch } from "solid-js";
import { createStore } from "solid-js/store";
import { Schemas } from "../../utils/serverApi";
import { FiCheck, FiFeather, FiZap, FiZapOff } from "solid-icons/fi";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import { Button } from "@/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { Video } from "@/utils/library";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/ui/tooltip";

type Resolution = Schemas["Resolution"];
type ResolutionString = `${number}x${number}`;
type AudioCodec = Schemas["AudioCodec"];
type VideoCodec = Schemas["VideoCodec"];

type Props = {
  onAudioChange: (payload: AudioCodec) => void;
  onVideoChange: (payload: VideoCodec) => void;
  onResolutionChange: (payload: Resolution) => void;
  selectedPayload: Schemas["TranscodePayload"];
  originalVideo: Video;
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
const videoCodecOptions: ExcludeOther<VideoCodec>[] = ["hevc", "h264", "av1", "vp8", "vp9"];
const audioCodecOptions: ExcludeOther<AudioCodec>[] = ["aac", "ac3", "dts", "eac3"];

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
  let [resolution, setResolution] = createSignal(
    serializeResolution(props.maxResolution),
  );
  let opts = resolutionOptions
    .filter(
      (o) =>
        o.width <= props.maxResolution.width &&
        o.height <= props.maxResolution.height,
    )
    .map(serializeResolution);
  function onChange(res: ResolutionString | null) {
    let resolution = res || maxResolutionString;
    props.onChange(deserializeResolution(resolution));
    setResolution(resolution);
  }
  return (
    <div>
      <Select
        options={Array.from(new Set([maxResolutionString, ...opts]))}
        value={resolution()}
        defaultValue={maxResolutionString}
        onChange={onChange}
        itemComponent={(props) => (
          <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
        )}
      >
        <SelectTrigger>
          <SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
        </SelectTrigger>
        <SelectContent />
      </Select>
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

  function onChange(oCodec: string | null) {
    let codec = oCodec || defaultAudioCodec();
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
      <Select
        options={Array.from(
          new Set([defaultAudioCodec(), ...audioCodecOptions]),
        )}
        value={currentValue()}
        defaultValue={defaultAudioCodec()}
        onChange={onChange}
        itemComponent={(props) => (
          <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
        )}
      >
        <SelectTrigger>
          <SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
        </SelectTrigger>
        <SelectContent />
      </Select>
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

  function onChange(oCodec: string | null) {
    let codec = oCodec || defaultVideoCodec();
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
      <Select
        options={Array.from(
          new Set([defaultVideoCodec(), ...videoCodecOptions]),
        )}
        value={currentValue()}
        onChange={onChange}
        itemComponent={(props) => (
          <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
        )}
      >
        <SelectTrigger>
          <SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
        </SelectTrigger>
        <SelectContent />
      </Select>
    </div>
  );
}

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

function SmoothStats(props: { capabilities: MediaCapabilitiesDecodingInfo }) {
  return (
    <div class="flex w-full items-center justify-center gap-8">
      <Show
        when={props.capabilities.supported}
        fallback={
          <Tooltip>
            <TooltipTrigger>
              <FiCheck class="h-6 w-6 shrink-0 stroke-red-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Not supported</p>
            </TooltipContent>
          </Tooltip>
        }
      >
        <Tooltip>
          <TooltipTrigger>
            <FiCheck class="h-6 w-6 shrink-0 stroke-green-500" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Supported</p>
          </TooltipContent>
        </Tooltip>
      </Show>
      <Show
        when={props.capabilities.smooth}
        fallback={
          <Tooltip>
            <TooltipTrigger>
              <FiFeather class="h-6 w-6 shrink-0 stroke-red-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Not smooth</p>
            </TooltipContent>
          </Tooltip>
        }
      >
        <Tooltip>
          <TooltipTrigger>
            <FiFeather class="h-6 w-6 shrink-0 stroke-green-500" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Smooth and easy</p>
          </TooltipContent>
        </Tooltip>
      </Show>
      <Show
        when={props.capabilities.powerEfficient}
        fallback={
          <Tooltip>
            <TooltipTrigger>
              <FiZapOff class="h-6 w-6 shrink-0 stroke-red-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Not power efficient</p>
            </TooltipContent>
          </Tooltip>
        }
      >
        <Tooltip>
          <TooltipTrigger>
            <FiZapOff class="h-6 w-6 shrink-0 stroke-green-500" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Power efficient</p>
          </TooltipContent>
        </Tooltip>
      </Show>
    </div>
  );
}

export default function AddVersion(props: Props) {
  let originalResolution = () => props.originalVideo.defaultVideo().resolution;
  let originalAudio = () => props.originalVideo.defaultAudio();
  let originalVideo = () => props.originalVideo.defaultVideo();

  return (
    <div class="flex flex-wrap justify-center gap-4">
      <CardAddVersion
        title="Video codec"
        description="Select desired video preset"
        capabilities={props.video}
      >
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
      </CardAddVersion>
      <CardAddVersion
        title="Audio codec"
        description="Select desired audio preset"
        capabilities={props.audio}
      >
        <AudioSelection
          onChange={(s) => props.onAudioChange(s)}
          defaultAudio={originalAudio().codec}
          currentValue={
            props.selectedPayload.audio_codec ?? originalAudio().codec
          }
        />
      </CardAddVersion>
    </div>
  );
}

type CardAddVersionProps = {
  title: string;
  description: string;
  capabilities?: MediaCapabilitiesDecodingInfo;
};

export function CardAddVersion(props: CardAddVersionProps & ParentProps) {
  return (
    <Card class="w-[380px]">
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
        <CardDescription>{props.description}</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-4">{props.children}</CardContent>
      <CardFooter>
        <Show when={props.capabilities}>
          {(capabilities) => <SmoothStats capabilities={capabilities()} />}
        </Show>
      </CardFooter>
    </Card>
  );
}
