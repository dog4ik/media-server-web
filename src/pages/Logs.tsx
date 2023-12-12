import { Show, createResource, createSignal, onCleanup } from "solid-js";
import LogWindow from "../components/Logs/LogWindow";
import PageTitle from "../components/PageTitle";
import { LogLevel, LogMessage, getLatestLog } from "../utils/serverApi";

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
      <label class="pr-3 cursor-pointer" for={props.value.toLowerCase()}>
        {props.value}:
      </label>
      <input
        checked={props.checked}
        class="cursor-pointer"
        onInput={onInput}
        value={props.value}
        id={props.value.toLowerCase()}
        type="checkbox"
      />
    </div>
  );
}

type FilterBarProps = {
  onChange: (value: LogLevel, isChecked: boolean) => void;
};

function FilterBar(props: FilterBarProps) {
  return (
    <div class="flex gap-5 items-center justify-center">
      <CheckBox checked onInput={props.onChange} value="INFO" />
      <CheckBox checked onInput={props.onChange} value="TRACE" />
      <CheckBox checked onInput={props.onChange} value="DEBUG" />
      <CheckBox checked onInput={props.onChange} value="ERROR" />
    </div>
  );
}

export default function Logs() {
  let [logs, { mutate: mutateLogs }] = createResource(getLatestLog);
  function handleProgressEvent(event: MessageEvent<string>) {
    let data: LogMessage = JSON.parse(event.data);
    mutateLogs([...logs()!, data]);
  }
  let [filterState, setFilterState] = createSignal<LogLevel[]>([
    "INFO",
    "ERROR",
    "DEBUG",
    "TRACE",
  ]);

  let sse = new EventSource(
    import.meta.env.VITE_MEDIA_SERVER_URL + "/admin/log",
  );

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
      <div class="flex overflow-hidden w-full p-10 max-h-fit h-full justify-center items-center">
        <Show when={!logs.loading}>
          <LogWindow
            logs={logs()!.filter((l) => filterState().includes(l.level))}
          />
        </Show>
      </div>
    </>
  );
}
