import { getRouteApi, linkOptions, LinkOptions } from "@tanstack/solid-router";
import { createMemo, For, ParentProps } from "solid-js";

type Props = {
  tabs: number[];
  onChange: (idx: number) => void;
};

type ItemProps = {
  isSelected: boolean;
  linkOptions: LinkOptions;
  number: number;
};

function Item(props: ItemProps & ParentProps) {
  let route = getRouteApi("/page/shows/$id");
  return (
    <route.Link
      class={`flex h-8 flex-1 items-center justify-center gap-4 rounded-xl py-8 whitespace-nowrap ${
        props.isSelected ? "text-white" : "text-white/70"
      }`}
      search={(prev) => ({ season: props.number, provider: prev.provider })}
    >
      {props.children}
      <span class="hidden @6xl:inline">Season</span>
      <span>{props.number}</span>
    </route.Link>
  );
}

export default function SeasonsCarousel(props: Props) {
  let route = getRouteApi("/page/shows/$id");
  let search = route.useSearch();
  let params = route.useParams();
  let season = createMemo(() => search().season || props.tabs.at(0) || 1);

  return (
    <div class="@container relative flex items-center">
      <div
        class="absolute bottom-0 h-1 divide-x rounded-xl bg-white transition-all duration-200"
        style={{
          width: `${100 / props.tabs.length}%`,
          left: `${(props.tabs.indexOf(season()) / props.tabs.length) * 100}%`,
        }}
      />
      <For each={props.tabs}>
        {(number) => {
          let link = linkOptions({
            to: "/shows/$id",
            params: { id: params().id },
            search: { season: number, provider: search().provider },
          });
          return (
            <Item
              number={number}
              linkOptions={link}
              isSelected={number == season()}
            />
          );
        }}
      </For>
    </div>
  );
}
