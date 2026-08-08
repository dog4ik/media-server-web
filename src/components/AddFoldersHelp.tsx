import { Link, linkOptions } from "@tanstack/solid-router";
import type { Schemas } from "@/utils/serverApi";

type Props = { contentType: Schemas["ParentMediaType"] };

export default function AddFoldersHelp(props: Props) {
  let url = () => {
    let hash =
      props.contentType === "show" ? "show-directories" : "movie-directories";
    return linkOptions({ to: "/settings", hash });
  };

  return (
    <div class="flex w-full flex-col items-center justify-center gap-4">
      <span class="text-2xl">
        Add{" "}
        <Link class="text-2xl capitalize underline" {...url()}>
          {props.contentType} Directories
        </Link>
      </span>
    </div>
  );
}
