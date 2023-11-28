import { For, createSignal } from "solid-js";

type Props = {
  tabs: number[];
  onClick: (idx: number) => void;
};

type ItemProps = {
  isSelected: boolean;
  text: string;
  onClick: () => void;
};

function Item(props: ItemProps) {
  return (
    <button
      onClick={props.onClick}
      class={`flex flex-1 justify-center items-center p-8 rounded-xl h-8 ${props.isSelected ? "text-white" : "text-white/70"
        }`}
    >
      {props.text}
    </button>
  );
}

export default function SeasonsCarousel(props: Props) {
  let [selectedNumber, setSelectedNumber] = createSignal(props.tabs[0]);
  function handleClick(seasonNumber: number) {
    setSelectedNumber(seasonNumber);
    props.onClick(seasonNumber);
  }
  return (
    <div class="relative flex items-center">
      <div
        class="absolute bottom-0 transition-all duration-200 bg-white h-1 rounded-xl divide-x"
        style={{
          width: `${100 / props.tabs.length}%`,
          left: `${(props.tabs.indexOf(selectedNumber()) / props.tabs.length) *
            100
            }%`,
        }}
      />
      <For each={props.tabs}>
        {(number) => {
          return (
            <Item
              text={`Season ${number}`}
              isSelected={number == selectedNumber()}
              onClick={() => handleClick(number)}
            />
          );
        }}
      </For>
    </div>
  );
}
