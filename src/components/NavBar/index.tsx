import { useNotifications } from "../../context/NotificationContext";
import { FiArrowLeftCircle, FiRefreshCcw } from "solid-icons/fi";
import Search from "../Search";
import { revalidatePath, server } from "../../utils/serverApi";

export default function NavBar() {
  function back() {
    window.navigation.back();
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
    <header class="dark:border-gray-850 fixed top-0 z-10 flex h-12 w-full shrink-0 items-center bg-black/30 px-4 py-8 text-white">
      <nav class="flex flex-1 items-center justify-between text-sm font-semibold">
        <div class="flex w-2/3 items-center gap-3">
          <button onClick={back}>
            <FiArrowLeftCircle stroke="white" size={40} />
          </button>
          <Search />
        </div>
        <ul class="mr-10 flex items-center space-x-4 self-end">
          <button
            onClick={handleRefresh}
            class="btn tooltip tooltip-bottom"
            data-tip="Refresh Library"
          >
            <FiRefreshCcw size={20} />
          </button>
        </ul>
      </nav>
    </header>
  );
}
