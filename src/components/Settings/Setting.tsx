import { For, Match, ParentProps, Switch, createSignal } from "solid-js";
import SectionSubTitle from "./SectionSubTitle";
import { SETTINGS, Settings } from "../../utils/settingsDescriptors";
import { Schemas } from "../../utils/serverApi";
import { FiAlertTriangle, FiPlusCircle, FiX } from "solid-icons/fi";
import { FilePicker } from "../FilePicker";
import FileInput from "../ui/FileInput";
import {
  SwitchControl,
  SwitchThumb,
  Switch as SwitchToggle,
} from "@/ui/switch";
import {
  SettingsValuesObject,
  useSettingsContext,
} from "@/context/SettingsContext";
import clsx from "clsx";
import { TextField, TextFieldRoot } from "@/ui/textfield";
import {
  NumberField,
  NumberFieldDecrementTrigger,
  NumberFieldGroup,
  NumberFieldIncrementTrigger,
  NumberFieldInput,
} from "@/ui/number-field";
import { Alert, AlertDescription, AlertTitle } from "@/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Button } from "@/ui/button";

type Props = {
  data: Settings[keyof Settings];
  remote: Schemas["ConfigSchema"][number];
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
      <TextFieldRoot class="w-full max-w-xs">
        <TextField
          value={props.value}
          disabled={props.disabled}
          placeholder={props.placeholder}
          onInput={(e) => props.onInput(e.currentTarget.value as T)}
        />
      </TextFieldRoot>
    );
  }
  if (typeof props.value == "number") {
    return (
      <NumberField
        onRawValueChange={(val) => props.onInput(val as T)}
        defaultValue={props.value}
        disabled={props.disabled}
        format={false}
      >
        <NumberFieldGroup>
          <NumberFieldDecrementTrigger aria-label="Decrement" />
          <NumberFieldInput />
          <NumberFieldIncrementTrigger aria-label="Increment" />
        </NumberFieldGroup>
      </NumberField>
    );
  }
  if (typeof props.value == "boolean") {
    return (
      <SwitchToggle
        onChange={(e) => props.onInput(e as T)}
        checked={props.value}
      >
        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>
      </SwitchToggle>
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

type SecretInputProps = {
  value: string;
  placeholder?: string;
  onChange: (val: string) => void;
};

export function SecretInput(props: SecretInputProps) {
  return (
    <TextFieldRoot onChange={(s) => props.onChange(s)}>
      <TextField
        value={props.value}
        type="password"
        placeholder={props.placeholder}
      />
    </TextFieldRoot>
  );
}

type FileInputsProps = {
  values: string[];
  onChange: (val: string[]) => void;
};

function FileInputs(props: FileInputsProps) {
  let [modalOpen, setModalOpen] = createSignal(false);
  let clone = () => [...props.values];

  function onChange(idx: number, data: string) {
    let files = clone();
    files[idx] = data;
    props.onChange(files);
  }
  function onRemove(idx: number) {
    let files = clone();
    files = files.filter((_, i) => i !== idx);
    props.onChange(files);
  }
  function onAdd(val: string) {
    let files = clone();
    let last = files.at(-1);
    if (last !== "") {
      files.push(val);
    }
    setModalOpen(false);
    props.onChange(files);
  }
  return (
    <>
      <Dialog onOpenChange={setModalOpen} open={modalOpen()}>
        <DialogContent class="w-5/6">
          <DialogHeader>
            <DialogTitle>Select directory</DialogTitle>
          </DialogHeader>
          <FilePicker disallowFiles onSubmit={onAdd} />
        </DialogContent>
      </Dialog>
      <div class="space-y-3">
        <For each={props.values}>
          {(file, idx) => (
            <div class="flex w-full">
              <FileInput
                title="Select directory"
                value={file}
                onChange={(val) => onChange(idx(), val)}
              />
              <Button variant={"destructive"} onClick={() => onRemove(idx())}>
                <FiX size={20} />
              </Button>
            </div>
          )}
        </For>
        <Button
          onClick={() => {
            setModalOpen(true);
          }}
          class="w-full"
        >
          <FiPlusCircle size={30} />
        </Button>
      </div>
    </>
  );
}

export function Setting(props: Props & ParentProps) {
  let isBool = () =>
    typeof (props.remote.default_value ?? props.remote.config_value) ===
    "boolean";
  return (
    <div class="flex max-w-xl flex-col gap-2 py-10">
      <SectionSubTitle name={props.data.long_name} />
      <div
        class={clsx(
          "flex gap-4",
          isBool() ? "items-center justify-between" : "flex-col justify-center",
        )}
      >
        <p>{props.data.description}</p>
        {props.children}
      </div>
      <Switch>
        <Match when={props.remote.cli_value !== null}>
          <Alert>
            <FiAlertTriangle size={20} />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Setting is being overwritten by CLI argument
            </AlertDescription>
          </Alert>
        </Match>
        <Match when={props.remote.env_value !== null}>
          <Alert>
            <FiAlertTriangle size={20} />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Setting is being overwritten by environment variable
            </AlertDescription>
          </Alert>
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
            title="Select file"
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
