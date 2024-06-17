import { Show, createResource, createSignal, onCleanup } from "solid-js";
import LogWindow from "../components/Logs/LogWindow";
import PageTitle from "../components/PageTitle";
import {
  LogLevel,
  MEDIA_SERVER_URL,
  Schemas,
  server,
} from "../utils/serverApi";

type CheckBoxProps = {
  value: LogLevel;
  checked?: boolean;
  onInput: (value: LogLevel, isChecked: boolean) => void;
};

function CheckBox(props: CheckBoxProps) {
  function onInput(e: InputEvent) {
    let target = e.target as HTMLInputElement;
    props.onInput(target.value as LogLevel, target.checked);
  }
  return (
    <div class="flex">
      <label
        class="label flex cursor-pointer gap-2"
        for={props.value.toLowerCase()}
      >
        <span class="label-text text-white">{props.value}:</span>
        <input
          checked={props.checked}
          class="checkbox-primary checkbox cursor-pointer"
          onInput={onInput}
          value={props.value}
          id={props.value.toLowerCase()}
          type="checkbox"
        />
      </label>
    </div>
  );
}

type FilterBarProps = {
  onChange: (value: LogLevel, isChecked: boolean) => void;
};

function FilterBar(props: FilterBarProps) {
  return (
    <div class="flex items-center justify-center gap-5">
      <CheckBox checked onInput={props.onChange} value="INFO" />
      <CheckBox checked onInput={props.onChange} value="TRACE" />
      <CheckBox checked onInput={props.onChange} value="DEBUG" />
      <CheckBox checked onInput={props.onChange} value="ERROR" />
    </div>
  );
}

export default function Logs() {
  let [logs, { mutate: mutateLogs }] = createResource(
    async () => await server.GET("/api/log/latest").then((d) => d.data),
  );
  function handleProgressEvent(event: MessageEvent<string>) {
    let data: Schemas["JsonTracingEvent"] = JSON.parse(event.data);
    mutateLogs([...logs()!, data]);
  }
  let [filterState, setFilterState] = createSignal<string[]>([
    "INFO",
    "ERROR",
    "DEBUG",
    "TRACE",
  ]);

  let sse = new EventSource(MEDIA_SERVER_URL + "/api/log");

  sse.addEventListener("message", handleProgressEvent);
  onCleanup(() => {
    sse.removeEventListener("message", handleProgressEvent);
    sse.close();
  });

  function handleFilterChange(level: LogLevel, isChecked: boolean) {
    if (isChecked) {
      setFilterState([...filterState(), level]);
    } else {
      setFilterState(filterState().filter((l) => l != level));
    }
  }

  return (
    <>
      <PageTitle>Logs</PageTitle>
      <FilterBar onChange={handleFilterChange} />
      <div class="flex h-full max-h-fit w-full items-center justify-center overflow-hidden p-10">
        <Show when={!logs.loading}>
          <LogWindow
            logs={logs()!.filter((l) => filterState().includes(l.level))}
          />
        </Show>
      </div>
    </>
  );
}
