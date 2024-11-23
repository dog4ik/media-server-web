import { For, createSignal } from "solid-js";
import { Schemas } from "../../utils/serverApi";
import { FiArrowDown, FiArrowUp } from "solid-icons/fi";
import clsx from "clsx";
import { capitalize } from "@/utils/formats";

type Props = {
  providers: {
    provider_type: Schemas["ProviderType"];
    order: string[];
  }[];
};

type ProviderListProps = {
  order: string[];
};

type SelectionHeaderProps = {
  selected: boolean;
  name: Schemas["ProviderType"];
  onSelect: (name: Schemas["ProviderType"]) => void;
};

function swap<T>(firstIdx: number, secondIndex: number, a: T[]) {
  let array = [...a];
  let buf = array[firstIdx];
  array[firstIdx] = array[secondIndex];
  array[secondIndex] = buf;
  return array;
}

function SelectionHeader(props: SelectionHeaderProps) {
  return (
    <button
      class={clsx(
        props.selected ? "bg-white text-black" : "bg-neutral-700",
        "rounded-md p-2",
      )}
      onClick={() => props.onSelect(props.name)}
    >
      {capitalize(props.name)}
    </button>
  );
}

export default function ProviderOrdering(props: Props) {
  let [selection, setSelection] =
    createSignal<Schemas["ProviderType"]>("movie");
  let currentOrder = () => {
    return props.providers.find((p) => p.provider_type == selection())!.order;
  };

  return (
    <div class="flex flex-col gap-2">
      <div class="flex gap-2">
        <For each={props.providers}>
          {(provider) => (
            <SelectionHeader
              onSelect={setSelection}
              selected={selection() == provider.provider_type}
              name={provider.provider_type}
            />
          )}
        </For>
      </div>
      <ProviderList order={currentOrder()} />
    </div>
  );
}

function ProviderList(props: ProviderListProps) {
  let [order, setOrder] = createSignal(props.order);
  function handleUp(idx: number) {
    if (idx > 0) {
      setOrder(swap(idx, idx - 1, order()));
    }
  }
  function handleDown(idx: number) {
    if (idx < order().length - 1) {
      setOrder(swap(idx, idx + 1, order()));
    }
  }
  return (
    <div class="flex flex-col items-center">
      <For each={order()}>
        {(el, idx) => (
          <OrderedElement
            value={el}
            onUp={() => handleUp(idx())}
            onDown={() => handleDown(idx())}
          />
        )}
      </For>
    </div>
  );
}

type OrderedElementProps = {
  value: string;
  onUp: () => void;
  onDown: () => void;
};

function OrderedElement(props: OrderedElementProps) {
  return (
    <div class="flex w-full items-center justify-between">
      <span>{props.value}</span>
      <div class="flex flex-col">
        <button onClick={props.onUp}>
          <FiArrowUp size={20} />
        </button>
        <button onClick={props.onDown}>
          <FiArrowDown size={20} />
        </button>
      </div>
    </div>
  );
}
