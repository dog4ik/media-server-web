import { createSignal, onCleanup } from "solid-js";
import LogWindow from "../components/Logs/LogWindow";
import PageTitle from "../components/PageTitle";

export type LogMessage = {
  fields: { message?: string };
  timestamp: string;
  target: string;
  level: string;
};

export default function Logs() {
  let [logs, setLogs] = createSignal<LogMessage[]>([]);
  function handleProgressEvent(event: MessageEvent<string>) {
    console.log(event.data);
    let data: LogMessage = JSON.parse(event.data);
    setLogs([...logs(), data]);
  }

  let sse = new EventSource(
    import.meta.env.VITE_MEDIA_SERVER_URL + "/admin/log",
  );

  sse.addEventListener("message", handleProgressEvent);
  onCleanup(() => {
    sse.removeEventListener("message", handleProgressEvent);
    sse.close();
  });

  return (
    <>
      <PageTitle>Logs</PageTitle>
      <div class="flex h-5/6 overflow-hidden w-full p-20 max-h-fit justify-center items-center">
        <LogWindow logs={logs()} />
      </div>
    </>
  );
}
