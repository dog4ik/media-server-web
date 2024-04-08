import { For } from "solid-js";
import { createStore } from "solid-js/store";
import Selection, { Option } from "../../components/ui/Selection";
import {
  AudioCodec,
  Resolution,
  VideoCodec,
  VideoConfiguration,
} from "../../utils/serverApi";

type Props = {
  onChange: (payload: VideoConfiguration) => void;
  defaults: VideoConfiguration;
};

type FieldProps<T> = {
  title: string;
  options: readonly T[];
  onSelect: (selection: T) => void;
  value: T;
};

function Field<T extends string | number>(props: FieldProps<T>) {
  return (
    <div class="flex h-full flex-col">
      <div class="text-md mb-2 font-bold">{props.title}:</div>
      <Selection value={props.value}>
        <For each={props.options}>
          {(option) => (
            <Option title={option} onClick={() => props.onSelect(option)} />
          )}
        </For>
      </Selection>
    </div>
  );
}

function formatResolution(res: Resolution): ResolutionString {
  return `${res.width}x${res.height}`;
}

function parseResolution(res: ResolutionString): Resolution {
  let [width, height] = res.split("x").map((x) => +x);
  return { width, height };
}

type ResolutionString = `${number}x${number}`;

const resolutionOptions: ResolutionString[] = [
  "1920x1080",
  "1280x720",
  "640x480",
];

const videoCodecOptions = ["hevc", "h264"] as VideoCodec[];
const audioCodecOptions = ["ac3", "aac"] as AudioCodec[];

export default function AddVersion(props: Props) {
  function onChange<
    K extends keyof VideoConfiguration,
    T extends VideoConfiguration[K],
  >(selection: K, payload: T) {
    setSelectedPayload(selection, payload);
    props.onChange(selectedPayload);
  }
  let [selectedPayload, setSelectedPayload] = createStore(props.defaults);

  return (
    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-3 place-items-center gap-4">
        <Field
          onSelect={(s) => onChange("resolution", parseResolution(s))}
          title="Resolution"
          value={formatResolution(selectedPayload.resolution)}
          options={resolutionOptions}
        />
        <Field
          onSelect={(s) => onChange("video_codec", s)}
          value={selectedPayload.video_codec}
          title="Video Codec"
          options={videoCodecOptions}
        />
        <Field
          onSelect={(s) => onChange("audio_codec", s)}
          value={selectedPayload.audio_codec}
          title="Audio Codec"
          options={audioCodecOptions}
        />
      </div>
    </div>
  );
}
