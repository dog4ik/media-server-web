import { useNotifications } from "../context/NotificationContext";
import { refreshLibrary } from "../utils/serverApi";

export default function Home() {
  let notificator = useNotifications();
  async function handleRefresh() {
    await refreshLibrary();
    notificator("success", "Refreshing library");
  }
  return (
    <div class="p-2">
      <button onClick={handleRefresh} class="p-2 rounded-xl bg-green-500">Refresh library</button>
    </div>
  );
}
