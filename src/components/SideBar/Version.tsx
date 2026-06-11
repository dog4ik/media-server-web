import { useServerStatus } from "@/context/ServerStatusContext";
import { queryApi } from "@/utils/queryApi";
import { revalidatePath } from "@/utils/serverApi";
import { ErrorBoundary, onCleanup, Show, Suspense } from "solid-js";

export default function Version() {
  let [{ serverStatus }] = useServerStatus();
  let wake = () => revalidatePath("/api/version");
  onCleanup(() => serverStatus.removeWaker(wake));
  let version = queryApi.useQuery("get", "/api/version", () => ({
    parseAs: "text",
  }));

  return (
    <>
      {/*
       * Global is defined in vite.config.ts
       * @ts-ignore */}
      <span class="text-secondary text-xs">web ui {__CLIENT_VERSION__}</span>
      <span class="text-secondary text-xs">
        <ErrorBoundary fallback={<p>Version is not available</p>}>
          <Suspense fallback={<p>Fetching server version...</p>}>
            <Show when={version.data}>{(data) => data()}</Show>
          </Suspense>
        </ErrorBoundary>
      </span>
    </>
  );
}
