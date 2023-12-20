import { FiActivity } from "solid-icons/fi";
import { Show, Suspense } from "solid-js";
import { useServerStatus } from "../../context/ServerStatusContext";

export function StatusIndicator() {
  let [{ tasksProgress }] = useServerStatus();

  return (
    <Suspense fallback={<div>Loading</div>}>
      <div class="bg-white/20 z-10 w-12 flex justify-center cursor-pointer relative items-center h-12 rounded-full">
        <FiActivity size={20} stroke="white" />
        <div class="flex justify-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center h-12 w-12">
          <Show when={tasksProgress().size > 0}>
            <svg class="animate-spin h-12 w-12 text-white">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </Show>
        </div>
      </div>
    </Suspense>
  );
}
