import { TextField, TextFieldInput } from "@/ui/textfield";
import { onCleanup } from "solid-js";
import { ActorsCombobox } from "./ActorsCombobox";

type WatchStatus = "watched" | "inprogress" | "unwatched" | "any";

type FilterState = {
  titleFilter: undefined | string;
  watchState: WatchStatus;
  actorFilter: undefined | number[];
};

type Props = {
  onChange: (state: FilterState) => void;
  state: FilterState;
};

const DEBOUNCE_DURATION = 0;
export const DEFAULT_FILTER_STATE: FilterState = {
  titleFilter: undefined,
  actorFilter: undefined,
  watchState: "any",
};

export function ContentFilterBar(props: Props) {
  let timeout: ReturnType<typeof setTimeout>;

  function updateState<T extends keyof FilterState>(key: T, value: FilterState[T]) {
    props.onChange({ ...props.state, [key]: value });
  }

  function onInput(text: string) {
    clearTimeout(timeout);
    timeout = setTimeout(() => updateState("titleFilter", text), DEBOUNCE_DURATION);
  }
  onCleanup(() => clearTimeout(timeout));

  return (
    <div class="flex gap-4 items-center justify-end">
      <TextField class="max-w-3xs bg-secondary text-secondary-foreground">
        <TextFieldInput onInput={(e) => onInput(e.currentTarget.value)} placeholder="Filter" />
      </TextField>

      <ActorsCombobox onFilter={(actors) => updateState("actorFilter", actors)} />
    </div>
  );
}
