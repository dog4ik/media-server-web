import { For, Match, ParentProps, Show, Switch, createSignal } from "solid-js";
import Selection, { Option } from "../ui/Selection";
import SectionSubTitle from "./SectionSubTitle";
import { SETTINGS, Settings } from "../../utils/settingsDescriptors";
import { Schemas } from "../../utils/serverApi";
import { FiAlertTriangle, FiPlusCircle, FiX } from "solid-icons/fi";
import { FilePicker } from "../FilePicker";
import Modal from "../modals/Modal";
import FileInput from "../ui/FileInput";
import {
  SettingsValuesObject,
  useSettingsContext,
} from "@/context/SettingsContext";
import clsx from "clsx";

type Props = {
  data: Settings[keyof Settings];
  remote: Schemas["UtoipaConfigSchema"][number];
};

export type InputPropType = number | string | boolean | string[];

type InputProps<T extends InputPropType> = {
  onInput: (val: T) => void;
  onChange?: (val: T) => void;
  placeholder?: string;
  value: T;
  disabled?: boolean;
};

export function InferredInput<T extends InputPropType>(props: InputProps<T>) {
  if (typeof props.value === "string") {
    return (
      <input
        type="text"
        value={props.value}
        disabled={props.disabled}
        placeholder={props.placeholder}
        onInput={(e) => props.onInput(e.currentTarget.value as T)}
        class="input input-bordered w-full max-w-xs text-black"
      />
    );
  }
  if (typeof props.value == "number") {
    return (
      <input
        type="number"
        value={props.value}
        disabled={props.disabled}
        placeholder={props.placeholder}
        onInput={(e) => props.onInput(e.currentTarget.valueAsNumber as T)}
        class="input input-bordered w-full max-w-xs text-black"
      />
    );
  }
  if (typeof props.value == "boolean") {
    return (
      <input
        type="checkbox"
        class="toggle"
        onChange={(e) => props.onInput(e.currentTarget.checked as T)}
        checked={props.value}
      />
    );
  }
  if (Array.isArray(props.value)) {
    let [fieldsAmount, setFieldsAmount] = createSignal(props.value.length);
    let fields = [...props.value] as string[];
    function onChange(idx: number, data: string) {
      fields[idx] = data;
      props.onInput([...fields] as T);
    }
    function onRemove(idx: number) {
      fields = fields.filter((_, i) => i !== idx);
      setFieldsAmount(fieldsAmount() - 1);
      props.onInput(fields as T);
    }
    function onAdd() {
      let last = fields.at(-1);
      if (last !== "") {
        fields.push("");
        setFieldsAmount(fieldsAmount() + 1);
      }
    }
    return (
      <div class="flex flex-col">
        <For each={[...Array(fieldsAmount())]}>
          {(_, idx) => (
            <div class="flex items-center justify-between">
              <InferredInput
                value={fields[idx()]}
                onInput={(input) => onChange(idx(), input)}
                placeholder={props.placeholder}
              />
              <button class="btn" onClick={() => onRemove(idx())}>
                Remove
              </button>
            </div>
          )}
        </For>
        <button
          onClick={onAdd}
          class="flex h-12 w-full items-center justify-center rounded-xl bg-white/80"
        >
          <FiPlusCircle size={30} />
        </button>
      </div>
    );
  }
}

type SelectProps<T extends string | number> = {
  options: T[];
  value: string;
  onChange: (val: T) => void;
};

export function Select<T extends string | number>(props: SelectProps<T>) {
  return (
    <Selection value={props.value}>
      <For each={props.options}>
        {(o) => <Option onClick={() => props.onChange(o)}>{o}</Option>}
      </For>
    </Selection>
  );
}

type ToggleProps = {
  value: boolean;
  onChange: (val: boolean) => void;
};

export function Toggle(props: ToggleProps) {
  return (
    <input
      type="checkbox"
      onChange={(e) => props.onChange(e.currentTarget.checked)}
      class="toggle"
      checked={props.value}
    />
  );
}

type SecretInputProps = {
  value: string;
  onChange: (val: string) => void;
};

export function SecretInput(props: SecretInputProps) {
  return (
    <input
      class="input input-bordered w-full max-w-xs text-black"
      type="text"
      value={props.value}
      onChange={(e) => props.onChange(e.currentTarget.value)}
    />
  );
}

type FileInputsProps = {
  values: string[];
  onChange: (val: string[]) => void;
};

function FileInputs(props: FileInputsProps) {
  let files = props.values;
  let [modalOpen, setModalOpen] = createSignal(false);
  let modal: HTMLDialogElement;
  function onChange(idx: number, data: string) {
    files[idx] = data;
    props.onChange(files);
  }
  function onRemove(idx: number) {
    files = files.filter((_, i) => i !== idx);
    props.onChange(files);
  }
  function onAdd(val: string) {
    let last = files.at(-1);
    if (last !== "") {
      files.push(val);
    }
    modal.close();
    setModalOpen(false);
    props.onChange(files);
  }
  return (
    <>
      <Show when={modalOpen()}>
        <Modal ref={modal!} onClose={() => setModalOpen(false)}>
          <FilePicker disallowFiles onSubmit={onAdd} />
        </Modal>
      </Show>
      <div>
        <For each={props.values}>
          {(file, idx) => (
            <div class="flex items-center gap-2">
              <FileInput
                value={file}
                onChange={(val) => onChange(idx(), val)}
              />
              <button onClick={() => onRemove(idx())}>
                <FiX size={20} />
              </button>
            </div>
          )}
        </For>
        <button
          onClick={() => {
            setModalOpen(true);
            modal.showModal();
          }}
          class="flex h-12 w-full items-center justify-center rounded-xl bg-white/80"
        >
          <FiPlusCircle size={30} />
        </button>
      </div>
    </>
  );
}

export function Setting(props: Props & ParentProps) {
  let isBool = () =>
    typeof (props.remote.default_value ?? props.remote.config_value) ===
    "boolean";
  return (
    <div class="flex max-w-xl flex-col gap-2 rounded-xl bg-black p-2">
      <SectionSubTitle name={props.data.long_name} />
      <div
        class={clsx(
          "flex",
          isBool() ? "items-center justify-between" : "flex-col justify-center",
        )}
      >
        <p>{props.data.description}</p>
        {props.children}
      </div>
      <Switch>
        <Match when={props.remote.cli_value !== null}>
          <div class="alert alert-warning">
            <FiAlertTriangle size={20} />
            <span>Setting is being overwritten by CLI argument</span>
          </div>
        </Match>
        <Match when={props.remote.env_value !== null}>
          <div class="alert alert-warning overflow-hidden">
            <FiAlertTriangle size={20} />
            <span>Setting is being overwritten by environment variable</span>
          </div>
        </Match>
      </Switch>
    </div>
  );
}

type SmartSettingProps<T extends keyof typeof SETTINGS> = {
  setting: T;
};

export function SmartSetting<T extends keyof typeof SETTINGS>(
  props: SmartSettingProps<T>,
) {
  let setting = SETTINGS[props.setting];
  let { remoteSettings, changedSettings, change } = useSettingsContext();
  if (
    setting.typeHint === undefined &&
    remoteSettings()[props.setting].default_value === null
  ) {
    throw Error("No type hint with nullable setting");
  }

  function handleUpdate(value: InputPropType) {
    let defaultValue = remoteSettings()[props.setting];
    change(props.setting, value as SettingsValuesObject[T]);
    return defaultValue;
  }

  return (
    <Setting data={setting} remote={remoteSettings()[props.setting]}>
      <Switch
        fallback={
          <InferredInput
            onInput={handleUpdate}
            value={
              changedSettings[props.setting] ??
              remoteSettings()[props.setting].config_value ??
              remoteSettings()[props.setting].default_value!
            }
          />
        }
      >
        <Match when={setting.typeHint == "path"}>
          <FileInput
            onChange={handleUpdate}
            value={
              (changedSettings[props.setting] ??
                remoteSettings()[props.setting].config_value ??
                remoteSettings()[props.setting].default_value) as string
            }
          />
        </Match>
        <Match when={setting.typeHint == "pathArr"}>
          <FileInputs
            onChange={handleUpdate}
            values={
              (changedSettings[props.setting] ??
                remoteSettings()[props.setting].config_value ??
                remoteSettings()[props.setting].default_value!) as string[]
            }
          />
        </Match>
        <Match when={setting.typeHint == "secret"}>
          <SecretInput
            onChange={handleUpdate}
            value={
              (changedSettings[props.setting] ??
                remoteSettings()[props.setting].config_value ??
                remoteSettings()[props.setting].default_value!) as string
            }
          />
        </Match>
      </Switch>
    </Setting>
  );
}
