import { useNotifications } from "../../context/NotificationContext";
import { FiArrowLeftCircle, FiRefreshCcw } from "solid-icons/fi";
import SearchBar from "../SearchBar";
import { server } from "../../utils/serverApi";
import { Button } from "@/ui/button";
import { useBackdropContext } from "@/context/BackdropContext";

export default function NavBar() {
  let [{ hover }] = useBackdropContext();
  function back() {
    window.navigation.back();
    //let back = pathBack();
    //if (back) {
    //  navigator(back);
    //}
  }
  let notificator = useNotifications();
  async function handleRefresh() {
    let scanResult = await server.POST("/api/scan");
    if (scanResult.error) {
      notificator(`Scan failed: ${scanResult.error.message}`);
    }
  }
  return (
    <header class="hover-hide fixed top-0 z-20 flex h-12 w-full shrink-0 items-center bg-black/30 px-4 py-8 text-white">
      <nav class="flex flex-1 items-center justify-between text-sm font-semibold">
        <div class="flex w-2/3 items-center gap-3">
          <button onClick={back}>
            <FiArrowLeftCircle size={40} />
          </button>
          <SearchBar />
        </div>
        <ul class="mr-10 flex items-center space-x-4 self-end">
          <Button onClick={handleRefresh} data-tip="Refresh Library">
            <FiRefreshCcw size={20} />
          </Button>
        </ul>
      </nav>
    </header>
  );
}
