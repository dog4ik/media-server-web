import { FiAlertTriangle, FiRotateCcw } from "solid-icons/fi";
import { useServerStatus } from "../context/ServerStatusContext";
import { onCleanup } from "solid-js";

type Props = {
  error: Error;
  reset: () => void;
};

export default function ServerNotAvailable(props: Props) {
  let [, { addWakeSubscriber, removeWakeSubscriber }] = useServerStatus();
  let id = addWakeSubscriber(props.reset);
  onCleanup(() => removeWakeSubscriber(id));
  return (
    <div class="h-full w-full flex flex-col gap-2 justify-center items-center">
      <FiAlertTriangle size={60} />
      <div>Server is not available: {props.error.message}</div>
      <button
        class="p-3 mt-4 bg-neutral-200 rounded-xl text-black"
        onClick={props.reset}
      >
        <FiRotateCcw size={30} />
      </button>
    </div>
  );
}
