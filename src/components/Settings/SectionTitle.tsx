import { A } from "@solidjs/router";
import nameToHash from "../../utils/nameToHash";
import { FiHash } from "solid-icons/fi";

type Props = {
  name: string;
};
export default function SectionTitle(props: Props) {
  return (
    <A
      class="group flex cursor-pointer items-center gap-5"
      href={`#${nameToHash(props.name)}`}
    >
      <h2 id={nameToHash(props.name)} class="heading text-4xl">
        {props.name}
      </h2>
      <FiHash
        class="opacity-0 transition-opacity group-hover:opacity-50"
        size={30}
      />
    </A>
  );
}
