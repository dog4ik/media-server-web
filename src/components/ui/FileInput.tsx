import { createSignal, Show } from "solid-js";
import { FilePicker } from "../FilePicker";
import { FiEdit2 } from "solid-icons/fi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";
import { Button } from "@/ui/button";

type FileInputProps = {
  value: string;
  title: string;
  description?: string;
  onChange: (val: string) => void;
};

export default function FileInput(props: FileInputProps) {
  let [showModal, setShowModal] = createSignal(false);
  return (
    <>
      <Show when={showModal()}>
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
      </Show>
      <div class="flex h-9 flex-1 items-center justify-between gap-2 rounded-md border bg-background py-1 pl-3 text-sm">
        <span>{props.value}</span>
        <Button
          variant={"ghost"}
          onClick={() => {
            setShowModal(true);
          }}
        >
          <FiEdit2 />
        </Button>
      </div>
    </>
  );
}
