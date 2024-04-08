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

function errorMessage(e: Error) {
  if (e instanceof UnavailableError) {
    console.log(e);
    return "Make sure server is available";
  }
  if (e instanceof NotFoundError) {
    return "404 Not found";
  }

  console.error(e);
  return "Unknown error: " + e.name;
}

export default function ServerNotAvailable(props: Props) {
  let [, { addWakeSubscriber, removeWakeSubscriber }] = useServerStatus();
  let id = addWakeSubscriber(props.reset);
  onCleanup(() => removeWakeSubscriber(id));
  let message = errorMessage(props.error);

  return (
    <div class="flex h-full w-full flex-col items-center justify-center gap-4">
      <ErrorIcon error={props.error} />
      <div>{message}</div>
      <button
        class="mt-2 rounded-xl bg-neutral-200 p-3 text-black"
        onClick={props.reset}
      >
        <FiRotateCcw size={30} />
      </button>
    </div>
  );
}
