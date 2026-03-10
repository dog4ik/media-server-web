import { Link, LinkOptions } from "@tanstack/solid-router";
import BookCheck from "lucide-solid/icons/book-check";

type Props = {
  link: LinkOptions;
};

export function InLibaryIcon(props: Props) {
  return (
    <Link
      {...props.link}
      title="In library"
      class="bg-primary hover:bg-accent absolute top-1 right-1 flex size-9 items-center justify-center rounded-xl transition-colors"
    >
      <BookCheck />
    </Link>
  );
}
