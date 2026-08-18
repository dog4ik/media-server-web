import Hash from "lucide-solid/icons/hash";
import nameToHash from "../../utils/nameToHash";

type Props = {
  name: string;
};
export default function SectionTitle(props: Props) {
  return (
    <a
      class="group flex cursor-pointer items-center gap-5"
      href={`#${nameToHash(props.name)}`}
    >
      <h2 id={nameToHash(props.name)} class="heading text-4xl">
        {props.name}
      </h2>
      <Hash
        class="opacity-0 transition-opacity group-hover:opacity-50"
        size={30}
      />
    </a>
  );
}
