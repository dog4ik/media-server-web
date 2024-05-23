import { For, createSignal } from "solid-js";
import { Schemas } from "../../utils/serverApi";
import { FiArrowDown, FiArrowUp } from "solid-icons/fi";

type Props = {
  providers: Schemas["ProviderOrder"];
};

function swap<T>(firstIdx: number, secondIndex: number, a: T[]) {
  let array = [...a];
  let buf = array[firstIdx];
  array[firstIdx] = array[secondIndex];
  array[secondIndex] = buf;
  return array;
}

export default function ProviderList(props: Props) {
  let [order, setOrder] = createSignal(props.providers.order);
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
