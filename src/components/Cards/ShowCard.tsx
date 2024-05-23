import { MenuRow } from "../ContextMenu/Menu";
import MoreButton, { Row } from "../ContextMenu/MoreButton";
import { Show, createSignal } from "solid-js";
import { Schemas, fullUrl } from "../../utils/serverApi";
import { A } from "@solidjs/router";
import FallbackImage from "../FallbackImage";

function provider(provider: string): string {
  if (provider === "local") {
    return "";
  }
  return `?provider=${provider}`;
}

export default function ShowCard(props: { show: Schemas["ShowMetadata"] }) {
  let url = `/shows/${props.show.metadata_id}${provider(props.show.metadata_provider)}`;
  function handleDelete() {}

  let rows: Row[] = [
    { title: "Row1" },
    { title: "Row2" },
    {
      title: "Expanded",
      expanded: [
        { title: "ExpandedRow1" },
        { title: "ExpandedRow2" },
        {
          custom: (
            <div class="text-xl text-red-500">Hello from custom element</div>
          ),
        },
        {
          title: "ExpandedExpanded",
          expanded: [
            {
              title: "ExpandedExpanded1",
            },
            {
              title: "ExpandedExpanded2",
            },
          ],
        },
      ],
    },
  ];

  let imageUrl =
    props.show.metadata_provider == "local"
      ? fullUrl("/api/show/{id}/poster", {
          path: { id: +props.show.metadata_id },
        })
      : undefined;

  return (
    <>
      <div class="w-52">
        <A href={url} class="relative w-full">
          <FallbackImage
            alt="Show poster"
            srcList={[imageUrl, props.show.poster ?? undefined]}
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
          <A href={url}>
            <div class="truncate text-lg">
              <span>{props.show.title}</span>
            </div>
            <Show when={props.show.seasons}>
              <div class="text-sm text-white">
                {props.show.seasons!.length}{" "}
                {props.show.seasons!.length == 1 ? "season" : "seasons"}
              </div>
            </Show>
          </A>
          <MoreButton rows={rows} />
        </div>
      </div>
    </>
  );
}
