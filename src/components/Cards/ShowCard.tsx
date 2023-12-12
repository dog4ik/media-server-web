import { A } from "@solidjs/router";
import { ShowWithDetails } from "../../utils/serverApi";
import BlurImage from "../BlurImage";
import { MenuRow } from "../ContextMenu/Menu";
import MoreButton from "../ContextMenu/MoreButton";

export default function ShowCard(props: { show: ShowWithDetails }) {
  let url = `/shows/${props.show.id}`;
  function handleDelete() {}
  return (
    <>
      <div class="w-52">
        <A href={url} class="w-full relative">
          <BlurImage
            src={props.show.poster}
            width={208}
            height={312}
            blurData={props.show.blur_data}
          />
          <div class="absolute top-0 right-0 w-8 h-8 flex justify-center items-center bg-white rounded-xl rounded-t-none rounded-r-none">
            <span class="text-sm text-black font-semibold">
              {props.show.episodes_count}
            </span>
          </div>
        </A>
        <div class="flex justify-between items-center">
          <A href={url}>
            <div
              class="text-white text-lg pt-2 truncate"
              title={props.show.title}
            >
              {props.show.title}
            </div>
            <div class="text-white text-sm">
              {props.show.seasons_count}{" "}
              {props.show.seasons_count == 1 ? "season" : "seasons"}
            </div>
          </A>
          <MoreButton>
            <MenuRow title="Delete" onClick={handleDelete} />
          </MoreButton>
        </div>
      </div>
    </>
  );
}
