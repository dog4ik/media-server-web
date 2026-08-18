import Pen from "lucide-solid/icons/pen";
import { createSignal, Show } from "solid-js";
import { Button } from "@/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";
import { FilePicker } from "../FilePicker";

type FileInputProps = {
  value?: string;
  title: string;
  description?: string;
  onChange: (val: string) => void;
};

export default function FileInput(props: FileInputProps) {
  let [showModal, setShowModal] = createSignal(false);
  return (
    <>
      <Dialog onOpenChange={setShowModal} open={showModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{props.title}</DialogTitle>
            <Show when={props.description}>
              {(description) => (
                <DialogDescription>{description()}</DialogDescription>
              )}
            </Show>
          </DialogHeader>
          <FilePicker
            onSubmit={(val) => {
              props.onChange(val);
              setShowModal(false);
            }}
            disallowFiles
            initialDir={props.value}
          />
        </DialogContent>
      </Dialog>
      <div class="bg-background flex h-9 w-full items-center justify-between gap-2 rounded-md border py-1 pl-3 text-sm">
        <span class="line-clamp-1" title={props.value}>
          {props.value}
        </span>
        <Button
          variant={"ghost"}
          onClick={() => {
            setShowModal(true);
          }}
        >
          <Pen size="1em" />
        </Button>
      </div>
    </>
  );
}
