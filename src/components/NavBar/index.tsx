import { useNotifications } from "../../context/NotificationContext";
import { FiRefreshCcw } from "solid-icons/fi";
import SearchBar from "../SearchBar";
import { Button } from "@/ui/button";
import tracing from "@/utils/tracing";
import { queryApi } from "@/utils/queryApi";
import { AppBreadcrumbs } from "../Breadcrumbs";

// Background opacity at the top of the page and once fully scrolled.
const MIN_BG_OPACITY = 0.3;
const MAX_BG_OPACITY = 0.95;

export default function NavBar(props: { scrollProgress?: number }) {
  let bgOpacity = () =>
    MIN_BG_OPACITY + (props.scrollProgress ?? 0) * (MAX_BG_OPACITY - MIN_BG_OPACITY);
  let mutation = queryApi.useMutation("post", "/api/scan", () => ({
    onError(err) {
      tracing.error("Failed to initiate library scan");
      notificator(`Scan failed: ${err.message}`);
    },
  }));
  let notificator = useNotifications();
  return (
    <header
      class="hover-hide h-navbar flex w-full items-center px-4 py-8 text-white"
      style={{ "background-color": `rgb(0 0 0 / ${bgOpacity()})` }}
    >
      <nav class="flex flex-1 items-center justify-between gap-3 text-sm font-semibold">
        <div class="flex flex-1 items-center">
          <AppBreadcrumbs />
        </div>
        <div class="flex flex-1 justify-center">
          <SearchBar />
        </div>
        <ul class="flex flex-1 items-center justify-end space-x-4">
          <Button onClick={() => mutation.mutate({})} data-tip="Refresh Library">
            <FiRefreshCcw size={20} />
          </Button>
        </ul>
      </nav>
    </header>
  );
}
