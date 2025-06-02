import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { capitalize } from "@/utils/formats";
import { Schemas } from "@/utils/serverApi";

type Props = {
  onChange: (language: Schemas["Language"] | undefined) => void;
  value?: Schemas["Language"];
  placeholder?: string;
};

export const LANGUAGE_LIST: Schemas["Language"][] = [
  "en",
  "es",
  "de",
  "fr",
  "ru",
  "ja",
  "sr",
];

export function LanguagePicker(props: Props) {
  return (
    <Select
      options={LANGUAGE_LIST}
      value={props.value ?? null}
      placeholder={props.placeholder}
      onChange={(l) => props.onChange(l ?? undefined)}
      itemComponent={(p) => (
        <SelectItem item={p.item}>{capitalize(p.item.rawValue)}</SelectItem>
      )}
    >
      <SelectTrigger class="max-w-sm">
        <SelectValue class="text-white">
          {props.value ? capitalize(props.value!) : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent />
    </Select>
  );
}
