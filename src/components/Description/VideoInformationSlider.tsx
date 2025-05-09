import type { DialogTriggerProps } from "@kobalte/core/dialog";
import { Button } from "@/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/ui/sheet";
import { Video } from "@/utils/library";
import { FiInfo } from "solid-icons/fi";

type Props = {
  video: Video;
};

export default function VideoInformationSlider(props: Props) {
  return (
    <Sheet>
      <SheetTrigger
        as={(props: DialogTriggerProps) => (
          <Button onClick={props.onClick} disabled={props.disabled}>
            <FiInfo size={20} />
          </Button>
        )}
      />
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Video Information</SheetTitle>
          <SheetDescription>
            Here you can find the techincal information about the video
          </SheetDescription>
        </SheetHeader>
        <div class="grid gap-4 py-4">
          <div>Path: {props.video.details.path}</div>
        </div>
        <SheetFooter>
          <Button type="submit">Save changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
