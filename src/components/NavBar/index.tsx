import { useNotifications } from "../../context/NotificationContext";
import { FiArrowLeftCircle, FiRefreshCcw } from "solid-icons/fi";
import SearchBar from "../SearchBar";
import { revalidatePath, server } from "../../utils/serverApi";
import { Button } from "@/ui/button";

export default function NavBar() {
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
    revalidatePath("/api/local_shows");
    revalidatePath("/api/local_movies");
  }
  return (
    <header class="fixed top-0 z-10 flex h-12 w-full shrink-0 items-center bg-black/30 px-4 py-8 text-white">
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
