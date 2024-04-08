import { A } from "@solidjs/router";
import textToKebab from "../../utils/nameToHash";
import { FiHash } from "solid-icons/fi";

type Props = {
  name: string;
};
export default function SectionSubTitle(props: Props) {
  return (
    <A
      class="group flex cursor-pointer items-center gap-5"
      href={`#${textToKebab(props.name)}`}
    >
      <h3 id={textToKebab(props.name)} class="heading text-2xl">
        {props.name}
      </h3>
      <FiHash
        class="opacity-0 transition-opacity group-hover:opacity-50"
        size={30}
      />
    </A>
  );
}
