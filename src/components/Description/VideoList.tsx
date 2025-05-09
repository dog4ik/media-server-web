import {
  RadioGroup,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemLabel,
} from "@/ui/radio-group";
import { For } from "solid-js";
import VideoInformationSlider from "./VideoInformationSlider";
import { Video } from "@/utils/library";
import { VideoSelection } from "./VideoInformation";

type Props = {
  videos: Video[];
  onVideoSelect: (selection: VideoSelection) => void;
};

const KEY_SEPARATOR = "-";

function makeVideoKey(videoId: number, variantIdx?: number) {
  if (variantIdx === undefined) {
    return videoId.toString();
  } else {
    return `${videoId}${KEY_SEPARATOR}${variantIdx}`;
  }
}

function resolveVideoKeyTuple(key: string): VideoSelection {
  if (key.indexOf(KEY_SEPARATOR) != -1) {
    let s = key.split(KEY_SEPARATOR);
    return { video_id: +s[0], variant_id: s[1] };
  } else {
    return { video_id: +key };
  }
}

export function VideoList(props: Props) {
  return (
    <div>
      <RadioGroup
        onChange={(k) => props.onVideoSelect(resolveVideoKeyTuple(k))}
        defaultValue={makeVideoKey(props.videos[0].details.id)}
        class="grid gap-2"
      >
        <For each={props.videos}>
          {(video, videoIdx) => (
            <>
              <div class="flex">
                <RadioGroupItem
                  value={makeVideoKey(video.details.id)}
                  class="flex items-center gap-2"
                >
                  <RadioGroupItemControl />
                  <RadioGroupItemLabel class="text-sm">
                    {videoIdx() + 1}-{video.defaultVideo()?.resolution.height}p
                  </RadioGroupItemLabel>
                </RadioGroupItem>
                <VideoInformationSlider video={video} />
              </div>
              <div class="ml-2">
                <For each={video.variants()}>
                  {(variant, variantIdx) => (
                    <RadioGroupItem
                      value={makeVideoKey(video.details.id, variantIdx())}
                    >
                      <RadioGroupItemControl />
                      <RadioGroupItemLabel class="text-sm">
                        {variantIdx() + 1}-
                        {variant.defaultVideo()?.resolution.height}p
                      </RadioGroupItemLabel>
                    </RadioGroupItem>
                  )}
                </For>
              </div>
            </>
          )}
        </For>
      </RadioGroup>
    </div>
  );
}
