type Props = {
  onInput?: (text: string) => void;
  id?: string;
  placeholder?: string;
  password?: boolean;
  value?: string | number;
  min?: number;
  max?: number;
  disabled?: boolean;
  name?: string;
};

export default function TextInput(props: Props) {
  let type = props.password ? "password" : "text";
  return (
    <input
      class="rounded-full max-w-sm h-4 bg-neutral-950 text-white py-4 px-2 placeholder:text-neutral-500"
      id={props.id}
      type={type}
      onInput={(e) => props.onInput && props.onInput(e.currentTarget.value)}
      value={props.value ?? ""}
      placeholder={props.placeholder}
      min={props.min}
      max={props.max}
      disabled={props.disabled}
      name={props.name}
    />
  );
}
