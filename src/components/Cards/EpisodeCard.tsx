import { A } from "@solidjs/router";
import { EpisodeWithDetails } from "../../utils/ServerApi";
import BlurImage from "../BlurImage";

type Props = {
  episode: EpisodeWithDetails;
};
export default function EpisodeCard(props: Props) {
  return (
    <A
      href={props.episode.number.toString()}
      class="w-80 h-60 flex flex-col cursor-pointer"
    >
      <div class="w-full">
        <BlurImage
          blurData={props.episode.blur_data}
          src={props.episode.poster}
        />
      </div>
      <div class="pt-2 flex flex-col">
        <span class="text-base">{props.episode.title}</span>
        <span class="text-sm pt-1">Episode {props.episode.number}</span>
      </div>
    </A>
  );
}
