import { useServerStatus } from "@/context/ServerStatusContext";
import { queryApi } from "@/utils/queryApi";
import { revalidatePath } from "@/utils/serverApi";
import { Match, onCleanup, Suspense, Switch } from "solid-js";

export default function Version() {
  let [{ serverStatus }] = useServerStatus();
  let wake = () => revalidatePath("/api/version");
  onCleanup(() => serverStatus.removeWaker(wake));
  let version = queryApi.useQuery("get", "/api/version", () => ({
    parseAs: "text",
  }));

  return (
    <Suspense fallback={<p>Fetching server version...</p>}>
      <Switch fallback={<p>Version is not available</p>}>
        <Match when={version?.data}>
          {(data) => <p class="text-secondary text-xs">{data()}</p>}
        </Match>
      </Switch>
    </Suspense>
  );
}
