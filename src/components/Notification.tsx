import { FiX } from "solid-icons/fi";
import { createSignal } from "solid-js";

export type NotificationType = {
  type: "success" | "warn" | "error";
  id: string;
  message: string;
};

function useClose(cb: () => void, time: number) {
  let [shouldAnimateOut, setShouldAnimateOut] = createSignal(false);
  let setClose = () => {
    setShouldAnimateOut(true);
    setTimeout(() => {
      cb();
    }, time);
  };
  return [shouldAnimateOut, setClose] as const;
}

function notificationColor(type: NotificationType["type"]) {
  if (type == "success") return "bg-green-500";
  if (type == "warn") return "bg-yellow-500";
  if (type == "error") return "bg-red-500";
  return "bg-green-400";
}

export default function Notification(
  props: NotificationType & { onClose: () => void },
) {
  let [shouldAnimateOut, close] = useClose(props.onClose, 200);
  let closeTimeout = setTimeout(() => close(), 5_000);
  let color = notificationColor(props.type);
  return (
    <div
      onMouseEnter={() => clearTimeout(closeTimeout)}
      onMouseLeave={() => (closeTimeout = setTimeout(() => close(), 5_000))}
      class={`w-fit transition-all duration-200 ${
        shouldAnimateOut() ? "translate-x-full" : "animate-fade-in"
      } flex items-center justify-between rounded-lg ${color}`}
    >
      <p
        title={props.message}
        class="break-all px-2 font-semibold text-white sm:text-lg"
      >
        {props.message}
      </p>
      <div class="cursor-pointer p-2" onClick={() => close()}>
        <FiX size={30} class="stroke-white" />
      </div>
    </div>
  );
}
