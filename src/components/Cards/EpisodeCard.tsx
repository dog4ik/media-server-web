import { A } from "@solidjs/router";
import { EpisodeWithDetails } from "../../utils/serverApi";
import BlurImage from "../BlurImage";
import MoreButton from "../ContextMenu/MoreButton";
import { MenuRow } from "../ContextMenu/Menu";

type Props = {
  episode: EpisodeWithDetails;
  url: string;
  onEditDetails: () => void;
  onFixMetadata: () => void;
  onOptimize: () => void;
  onDelete: () => void;
};
export default function EpisodeCard(props: Props) {
  return (
    <div class="w-80 flex flex-col cursor-pointer">
      <A href={props.url} class="w-full">
        <BlurImage
          width={208}
          height={312}
          blurData={props.episode.blur_data}
          src={props.episode.poster}
        />
      </A>
      <div class="flex justify-between items-center">
        <A href={props.url} class="pt-2 flex flex-col">
          <span class="text-base" title={props.episode.title}>
            {props.episode.title}
          </span>
          <span class="text-sm pt-1">Episode {props.episode.number}</span>
        </A>
        <MoreButton>
          <MenuRow title="Edit details" onClick={props.onEditDetails} />
          <MenuRow title="Fix metadata" onClick={props.onFixMetadata} />
          <MenuRow title="Optimize video" onClick={props.onOptimize} />
          <MenuRow title="Delete" onClick={props.onDelete} />
        </MoreButton>
      </div>
    </div>
  );
}
