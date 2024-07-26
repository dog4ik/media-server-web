import { useSearchParams } from "@solidjs/router";
import { For, ParentProps, createEffect, createSignal } from "solid-js";

type Props = {
  tabs: number[];
  onChange: (idx: number) => void;
};

type ItemProps = {
  isSelected: boolean;
  number: number;
  onClick: () => void;
};

function Item(props: ItemProps & ParentProps) {
  return (
    <button
      onClick={props.onClick}
      class={`flex h-8 flex-1 items-center justify-center gap-4 whitespace-nowrap rounded-xl py-8 ${
        props.isSelected ? "text-white" : "text-white/70"
      }`}
    >
      {props.children}
      <span class="hidden @6xl:inline">Season</span>
      <span>{props.number}</span>
    </button>
  );
}

export default function SeasonsCarousel(props: Props) {
  const [searchParams, setSearchParams] = useSearchParams();

  let initialSelection = () => {
    let seasonParam = searchParams.season;
    if (
      seasonParam &&
      !isNaN(+seasonParam) &&
      props.tabs.includes(+seasonParam)
    ) {
      return +seasonParam;
    } else {
      return props.tabs[0];
    }
  };

  createEffect(() => {
    if (searchParams.season && +searchParams.season)
      setSelectedNumber(+searchParams.season);
    else setSelectedNumber(initialSelection());
    props.onChange(selectedNumber());
  });

  let [selectedNumber, setSelectedNumber] = createSignal(initialSelection());
  function handleClick(seasonNumber: number) {
    setSelectedNumber(seasonNumber);
    setSearchParams({ season: seasonNumber });
    props.onChange(seasonNumber);
  }
  return (
    <div class="relative flex items-center @container">
      <div
        class="absolute bottom-0 h-1 divide-x rounded-xl bg-white transition-all duration-200"
        style={{
          width: `${100 / props.tabs.length}%`,
          left: `${
            (props.tabs.indexOf(selectedNumber()) / props.tabs.length) * 100
          }%`,
        }}
      />
      <For each={props.tabs}>
        {(number) => {
          return (
            <Item
              number={number}
              isSelected={number == selectedNumber()}
              onClick={() => handleClick(number)}
            />
          );
        }}
      </For>
    </div>
  );
}
