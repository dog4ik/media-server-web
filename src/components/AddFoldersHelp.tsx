import { Button } from "@/ui/button";
import { capitalize } from "@/utils/formats";
import { Schemas } from "@/utils/serverApi";

type Props = { contentType: Schemas["ContentType"] };

export default function AddFoldersHelp(props: Props) {
  let url = () => {
    let sh =
      props.contentType == "show" ? "show-directories" : "movie-directories";
    return `/settings#${sh}`;
  };

  return (
    <div class="flex w-full flex-col items-center justify-center gap-4">
      <span class="text-2xl">
        Add
        <Button class="text-2xl underline" variant={"link"} as="a" href={url()}>
          {capitalize(props.contentType)} Directories
        </Button>
      </span>
    </div>
  );
}
