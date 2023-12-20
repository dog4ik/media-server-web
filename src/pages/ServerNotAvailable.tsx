import {
  FiAlertTriangle,
  FiPower,
  FiRotateCcw,
  FiSearch,
} from "solid-icons/fi";
import { useServerStatus } from "../context/ServerStatusContext";
import { onCleanup } from "solid-js";
import { NotFoundError, UnavailableError } from "../utils/errors";

type Props = {
  error: Error;
  reset: () => void;
};

type ErrorIconProps = {
  error: Error;
};

function ErrorIcon(props: ErrorIconProps) {
  let size = 60;
  if (props.error instanceof UnavailableError) {
    return <FiPower size={size} />;
  }
  if (props.error instanceof NotFoundError) {
    return <FiSearch size={size} />;
  }
  return <FiAlertTriangle size={size} />;
}

export default function ServerNotAvailable(props: Props) {
  let [, { addWakeSubscriber, removeWakeSubscriber }] = useServerStatus();
  let id = addWakeSubscriber(props.reset);
  let errorMessage;
  onCleanup(() => removeWakeSubscriber(id));
  if (props.error instanceof UnavailableError) {
    errorMessage = "Make sure server is available";
    console.log(props.error);
  } else {
    errorMessage = "Unknown error: " + props.error.name;
    console.error(props.error);
  }

  return (
    <div class="h-full w-full flex flex-col gap-4 justify-center items-center">
      <ErrorIcon error={props.error} />
      <div>{errorMessage}</div>
      <button
        class="p-3 mt-2 bg-neutral-200 rounded-xl text-black"
        onClick={props.reset}
      >
        <FiRotateCcw size={30} />
      </button>
    </div>
  );
}
