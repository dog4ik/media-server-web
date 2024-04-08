import BlurImage from "../BlurImage";
import { MenuRow } from "../ContextMenu/Menu";
import MoreButton from "../ContextMenu/MoreButton";
import { Show, createSignal } from "solid-js";
import { ShowMetadata } from "../../utils/serverApi";
import { A } from "@solidjs/router";

function provider(provider: string): string {
  if (provider === "local") {
    return "";
  }
  return `?provider=${provider}`;
}

export default function ShowCard(props: { show: ShowMetadata }) {
  let url = `/shows/${props.show.metadata_id}${provider(props.show.metadata_provider)}`;
  function handleDelete() {}

  return (
    <>
      <div class="w-52">
        <A
          href={url}
          class="relative w-full"
        >
          <BlurImage
            src={props.show.poster}
            class="rounded-xl"
            width={208}
            height={312}
          />
          <Show when={props.show.episodes_amount}>
            <div class="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-xl rounded-r-none rounded-t-none bg-white">
              <span class="text-sm font-semibold text-black">
                {props.show.episodes_amount}
              </span>
            </div>
          </Show>
        </A>
        <div class="flex items-center justify-between">
          <A
            href={url}
          >
            <div
              class="truncate text-lg"
            >
              <span>{props.show.title}</span>
            </div>
            <Show when={props.show.seasons}>
              <div class="text-sm text-white">
                {props.show.seasons!.length}{" "}
                {props.show.seasons!.length == 1 ? "season" : "seasons"}
              </div>
            </Show>
          </A>
          <MoreButton>
            <MenuRow title="Delete" onClick={handleDelete} />
          </MoreButton>
        </div>
      </div>
    </>
  );
}
