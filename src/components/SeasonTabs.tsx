import { getRouteApi } from "@tanstack/solid-router";
import { createEffect, createMemo, For, on, ParentProps } from "solid-js";

type Props = {
  tabs: number[];
  onChange: (idx: number) => void;
};

type ItemProps = {
  isSelected: boolean;
  number: number;
};

function Item(props: ItemProps & ParentProps) {
  let route = getRouteApi("/page/shows/$id");
  return (
    <route.Link
      class={`flex h-16 flex-1 items-center justify-center gap-2 rounded-xl whitespace-nowrap @6xl:gap-4 ${
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

export function SeasonTabs(props: Props) {
  let route = getRouteApi("/page/shows/$id");
  let search = route.useSearch();
  let season = createMemo(() => search().season || props.tabs.at(0) || 1);
  let indicatorLeft = createMemo(() => (props.tabs.indexOf(season()) / props.tabs.length) * 100);

  let indicator: HTMLDivElement | undefined;
  createEffect(
    on(indicatorLeft, (to, from) => {
      if (from === undefined || from === to || !indicator) return;
      indicator.animate({ left: [`${from}%`, `${to}%`] }, { duration: 200, easing: "ease" });
    }),
  );

  return (
    <div class="@container relative flex items-center">
      <div
        ref={indicator}
        class="bg-primary absolute bottom-0 h-1 divide-x rounded-xl"
        style={{
          width: `${100 / props.tabs.length}%`,
          left: `${indicatorLeft()}%`,
        }}
      />
      <For each={props.tabs}>
        {(number) => {
          return <Item number={number} isSelected={number == season()} />;
        }}
      </For>
    </div>
  );
}
