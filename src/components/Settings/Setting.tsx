import { For, Match, ParentProps, Show, Switch, createSignal } from "solid-js";
import Selection, { Option } from "../ui/Selection";
import SectionSubTitle from "./SectionSubTitle";
import { SETTINGS, Settings } from "../../utils/settingsDescriptors";
import { Schemas } from "../../utils/serverApi";
import { FiPlusCircle, FiX } from "solid-icons/fi";
import { FilePicker } from "../FilePicker";
import Modal from "../modals/Modal";
import FileInput from "../ui/FileInput";

type Props = {
  data: NonNullable<Settings[keyof Settings]>;
};

type InputPropType = number | string | boolean | string[];

type InputProps<T extends InputPropType> = {
  onInput: (val: T) => void;
  onChange?: (val: T) => void;
  placeholder?: string;
  value: T;
  disabled?: boolean;
};

export function InferedInput<T extends InputPropType>(props: InputProps<T>) {
  if (typeof props.value == "string") {
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
              <InferedInput
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

type FileInputsProps = {
  values: string[];
  onChange: (val: string[]) => void;
};

function FileInputs(props: FileInputsProps) {
  let [files, setFiles] = createSignal(props.values);
  let [modalOpen, setModalOpen] = createSignal(false);
  let modal: HTMLDialogElement;
  function onChange(idx: number, data: string) {
    let fields = [...files()];
    fields[idx] = data;
    setFiles(fields);
    props.onChange(files());
  }
  function onRemove(idx: number) {
    setFiles(files().filter((_, i) => i !== idx));
    props.onChange(files());
  }
  function onAdd(val: string) {
    let last = files().at(-1);
    if (last !== "") {
      let fields = [...files()];
      fields.push(val);
      setFiles(fields);
    }
    modal.close();
    setModalOpen(false);
    props.onChange(files());
  }
  return (
    <>
      <Show when={modalOpen()}>
        <Modal ref={modal!} onClose={() => setModalOpen(false)}>
          <FilePicker disallowFiles onSubmit={onAdd} />
        </Modal>
      </Show>
      <div>
        <For each={files()}>
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
  return (
    <div class="flex flex-col gap-2">
      <SectionSubTitle name={props.data.long_name} />
      {props.children}
      <p>{props.data.description}</p>
    </div>
  );
}

type SmartSettingProps<T extends keyof typeof SETTINGS> = {
  setting: T;
  remoteSettings: Schemas["FileConfigSchema"];
  set: (key: T, value: Schemas["FileConfigSchema"][T]) => void;
  updatedSettings: Partial<Schemas["FileConfigSchema"]>;
};

export function SmartSetting<T extends keyof typeof SETTINGS>(
  props: SmartSettingProps<T>,
) {
  let setting = SETTINGS[props.setting];
  return (
    <Setting data={setting}>
      <Switch
        fallback={
          <InferedInput
            onInput={(v) => props.set(props.setting, v)}
            value={
              props.updatedSettings[props.setting] ??
              props.remoteSettings[props.setting]!
            }
          />
        }
      >
        <Match when={setting.typeHint == "path"}>
          <FileInput
            onChange={(v) =>
              props.set(props.setting, v as Schemas["FileConfigSchema"][T])
            }
            value={
              (props.updatedSettings[props.setting] ??
                props.remoteSettings[props.setting]!) as string
            }
          />
        </Match>
        <Match when={setting.typeHint == "pathArr"}>
          <FileInputs
            onChange={(v) =>
              props.set(props.setting, v as Schemas["FileConfigSchema"][T])
            }
            values={
              (props.updatedSettings[props.setting] ??
                props.remoteSettings[props.setting]!) as string[]
            }
          />
        </Match>
      </Switch>
    </Setting>
  );
}
