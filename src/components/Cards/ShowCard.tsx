import { ShowWithDetails } from "../../utils/serverApi";
import BlurImage from "../BlurImage";
import { MenuRow } from "../ContextMenu/Menu";
import MoreButton from "../ContextMenu/MoreButton";
import { createSignal } from "solid-js";
import TransitionLink from "../TransitionLink";
import { getCachedShowById } from "../../utils/cachedApi";

export default function ShowCard(props: { show: ShowWithDetails }) {
  let url = `/shows/${props.show.id}`;
  let [titleTransitionName, setTitleTransitionName] =
    createSignal<"description-title">();
  let [imageTransitionName, setImageTransitionName] =
    createSignal<"description-img">();
  function handleDelete() {}

  function onStartTransition() {
    setTitleTransitionName("description-title");
    setImageTransitionName("description-img");
  }
  async function onEndTransition() {
    void (await getCachedShowById(props.show.id));
    setTitleTransitionName(undefined);
    setImageTransitionName(undefined);
  }
  return (
    <>
      <div class="w-52">
        <TransitionLink
          startCallBack={onStartTransition}
          endCallBack={onEndTransition}
          href={url}
          class="w-full relative"
        >
          <BlurImage
            src={props.show.poster}
            class="rounded-xl duration-500"
            width={208}
            height={312}
            blurData={props.show.blur_data}
            viewTransitionName={imageTransitionName()}
          />
          <div class="absolute top-0 right-0 w-8 h-8 flex justify-center items-center bg-white rounded-xl rounded-t-none rounded-r-none">
            <span class="text-sm text-black font-semibold">
              {props.show.episodes_count}
            </span>
          </div>
        </TransitionLink>
        <div class="flex justify-between items-center">
          <TransitionLink
            startCallBack={onStartTransition}
            endCallBack={onEndTransition}
            href={url}
          >
            <div
              style={{ "view-transition-name": titleTransitionName() }}
              class="text-lg truncate"
            >
              <span>{props.show.title}</span>
            </div>
            <div class="text-white text-sm">
              {props.show.seasons_count}{" "}
              {props.show.seasons_count == 1 ? "season" : "seasons"}
            </div>
          </TransitionLink>
          <MoreButton>
            <MenuRow title="Delete" onClick={handleDelete} />
          </MoreButton>
        </div>
      </div>
    </>
  );
}
