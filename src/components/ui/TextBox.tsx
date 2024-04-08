type Props = {
  onInput?: (text: string) => void;
  placeholder?: string;
  value?: string | number;
  rows?: number;
  cols?: number;
  id?: string;
  maxLength?: number;
  disabled?: boolean;
  name?: string;
};
export default function TextBox(props: Props) {
  return (
    <textarea
      class="textarea resize-none bg-neutral-950 text-white"
      id={props.id}
      name={props.name}
      maxLength={props.maxLength}
      disabled={props.disabled}
      rows={props.rows}
      cols={props.cols}
      onInput={(e) => props.onInput && props.onInput(e.currentTarget.value)}
      value={props.value ?? ""}
    />
  );
}
