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
      class="input input-primary text-black"
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
