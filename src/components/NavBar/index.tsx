import { useNotifications } from "../../context/NotificationContext";
import { FiArrowLeftCircle, FiRefreshCcw } from "solid-icons/fi";
import SearchBar from "../SearchBar";
import { Button } from "@/ui/button";
import tracing from "@/utils/tracing";
import { queryApi } from "@/utils/queryApi";

export default function NavBar() {
  function back() {
    window.navigation.back();
    //let back = pathBack();
    //if (back) {
    //  navigator(back);
    //}
  }
  let mutation = queryApi.useMutation("post", "/api/scan", () => ({
    onError(err) {
      tracing.error("Failed to initiate library scan");
      notificator(`Scan failed: ${err.message}`);
    },
  }));
  let notificator = useNotifications();
  return (
    <header class="hover-hide h-navbar flex w-full items-center bg-black/30 px-4 py-8 text-white">
      <nav class="flex flex-1 items-center justify-between text-sm font-semibold">
        <div class="flex w-2/3 items-center gap-3">
          <button onClick={back}>
            <FiArrowLeftCircle size={40} />
          </button>
          <SearchBar />
        </div>
        <ul class="mr-10 flex items-center space-x-4 self-end">
          <Button
            onClick={() => mutation.mutate({})}
            data-tip="Refresh Library"
          >
            <FiRefreshCcw size={20} />
          </Button>
        </ul>
      </nav>
    </header>
  );
}
