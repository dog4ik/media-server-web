import { FiActivity } from "solid-icons/fi";
import { Show, Suspense } from "solid-js";
import { useServerStatus } from "../../context/ServerStatusContext";

export function StatusIndicator() {
  let [{ tasksProgress }] = useServerStatus();

  return (
    <Suspense fallback={<div>Loading</div>}>
      <div class="relative z-10 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white/20">
        <FiActivity size={20} stroke="white" />
        <div class="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
          <Show when={tasksProgress.size > 0}>
            <svg class="h-12 w-12 animate-spin text-white">
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
