import { A } from "@solidjs/router";
import { EpisodeMetadata, History } from "../../utils/serverApi";
import BlurImage from "../BlurImage";
import MoreButton from "../ContextMenu/MoreButton";
import { MenuRow } from "../ContextMenu/Menu";
import { Show } from "solid-js";
import { FiDownload } from "solid-icons/fi";
import { formatDuration, formatTimeBeforeRelease } from "../../utils/formats";
import ProgressBar from "./ProgressBar";

type Props = {
  episode: EpisodeMetadata;
  url: string;
  availableLocally: boolean;
  history?: History;
  onFixMetadata: () => void;
  onOptimize: () => void;
  onDelete: () => void;
};

export default function EpisodeCard(props: Props) {
  let upcomingReleaseTime = formatTimeBeforeRelease(props.episode.release_date);
  console.log(props.history);
  return (
    <div class="flex w-80 cursor-pointer flex-col">
      <A href={props.url} class="relative w-full overflow-hidden rounded-xl">
        <BlurImage
          width={320}
          height={178}
          class="aspect-video rounded-xl"
          src={props.episode.poster ?? "/no-photo.png"}
        />
        <Show when={upcomingReleaseTime}>
          <div class="bg-black-20 absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full">
            <span class="text-xl">{upcomingReleaseTime}</span>
          </div>
        </Show>
        <Show when={props.availableLocally}>
          <div class="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
            <FiDownload />
          </div>
        </Show>
        <Show when={props.episode.runtime}>
          <div class="absolute bottom-2 right-2 flex items-center justify-center bg-black/90 p-1">
            <span class="text-xs font-semibold">
              {formatDuration(props.episode.runtime!)}
            </span>
          </div>
        </Show>
        <Show when={props.history && props.episode.runtime}>
          <ProgressBar
            history={props.history!}
            runtime={props.episode.runtime!.secs}
          />
        </Show>
      </A>
      <div class="flex items-center justify-between">
        <A href={props.url} class="flex flex-col pt-2">
          <span class="text-base" title={props.episode.title}>
            {props.episode.title}
          </span>
          <span class="pt-1 text-sm">Episode {props.episode.number}</span>
        </A>
        <MoreButton>
          <MenuRow title="Fix metadata" onClick={props.onFixMetadata} />
          <MenuRow title="Optimize video" onClick={props.onOptimize} />
          <MenuRow title="Delete" onClick={props.onDelete} />
        </MoreButton>
      </div>
    </div>
  );
}
