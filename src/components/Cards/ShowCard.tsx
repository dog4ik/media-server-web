import { A } from "@solidjs/router";
import { FiMoreVertical } from "solid-icons/fi";
import { ShowWithDetails } from "../../utils/ServerApi";
import BlurImage from "../BlurImage";

export default function ShowCard(props: { show: ShowWithDetails }) {
  let { poster, title, id, blur_data, episodes_count, seasons_count } =
    props.show;
  function onMenuClick(e: MouseEvent) {
    e.preventDefault();
  }
  return (
    <A href={`/shows/${id}`} >
      <div class="h-72 w-52">
        <div class="w-full relative">
          <BlurImage src={poster} blurData={blur_data} />
          <div class="absolute top-0 right-0 w-8 h-8 flex justify-center items-center bg-white rounded-xl rounded-t-none rounded-r-none">
            <span class="text-sm text-black font-semibold">{episodes_count}</span>
          </div>
        </div>
        <div class="flex justify-between items-center">
          <div>
            <div class="text-white text-lg pt-2">{title}</div>
            <div class="text-white text-sm">
              {seasons_count} {seasons_count == 1 ? "season" : "seasons"}
            </div>
          </div>
          <div onClick={onMenuClick} class="hover:bg-neutral-600 p-1.5 rounded-full transition-colors">
            <FiMoreVertical size={25} stroke="white" />
          </div>
        </div>
      </div>
    </A>
  );
}
