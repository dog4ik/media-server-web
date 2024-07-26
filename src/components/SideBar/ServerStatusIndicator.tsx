import { FiActivity } from "solid-icons/fi";
import { useServerStatus } from "../../context/ServerStatusContext";

export function StatusIndicator() {
  let [{ tasksProgress }] = useServerStatus();

  return (
    <div class="relative z-10 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white/20">
      <FiActivity size={20} stroke="white" />
    </div>
  );
}
