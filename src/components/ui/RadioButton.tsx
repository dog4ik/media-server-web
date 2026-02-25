import Check from "lucide-solid/icons/check";

type Props = {
  checked?: boolean;
  onClick?: () => void;
  name?: string;
};

export default function RadioButton(props: Props) {
  return (
    <label class="relative cursor-pointer">
      <input
        type="radio"
        name={props.name}
        checked={props.checked}
        onClick={props.onClick}
        class="sr-only"
      />
      <div class="relative size-6">
        <div
          class={`size-6 rounded-full border-2 transition-all duration-300 ${
            props.checked
              ? "border-blue-500"
              : "border-gray-300 hover:border-gray-400"
          }`}
        />
        <div
          class={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-blue-500 transition-all duration-300 ${
            props.checked ? "size-4 opacity-100" : "h-0 w-0 opacity-0"
          }`}
        />
        <div
          class={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform text-white transition-all duration-300 ${
            props.checked ? "scale-100 opacity-100" : "scale-0 opacity-0"
          }`}
        >
          <Check class="size-3" strokeWidth={3} />
        </div>
      </div>
    </label>
  );
}
