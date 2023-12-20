import { createSignal, onMount } from "solid-js";
import { EpisodeWithDetails, ShowWithDetails } from "../utils/serverApi";
import BlurImage from "./BlurImage";

type Props = {
  item?: ShowWithDetails | EpisodeWithDetails;
  imageDirection?: "horizontal" | "vertical";
};

export default function Description(props: Props) {
  let imageDirection = props.imageDirection ?? "vertical";
  let [imageTransitionName, setImageTransitionName] = createSignal<
    undefined | string
  >("description-img");
  let [titleTransitionName, setTitleTransitionName] = createSignal<
    undefined | string
  >("description-title");

  onMount(() => {
    setTimeout(() => {
      setTitleTransitionName(undefined);
      setImageTransitionName(undefined);
    }, 400);
  });

  return (
    <div class="flex items-center w-full">
      <div class={`${imageDirection == "horizontal" ? "w-80" : "w-52"} `}>
        <BlurImage
          width={imageDirection == "horizontal" ? 312 : 208}
          class="rounded-xl"
          height={imageDirection == "horizontal" ? 208 : 312}
          src={props.item?.poster ?? ""}
          blurData={props.item?.blur_data}
          viewTransitionName={imageTransitionName()}
        />
      </div>
      <div class="h-full p-8">
        <div
          class="text-2xl"
          style={{ "view-transition-name": titleTransitionName() }}
        >
          <span>{props.item?.title}</span>
        </div>
        <div class="pt-8 max-w-2xl animate-fade-in">{props.item?.plot}</div>
      </div>
    </div>
  );
}
