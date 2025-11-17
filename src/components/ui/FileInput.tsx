import { createSignal, Show, Suspense } from "solid-js";
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
          <FiEdit2 />
        </Button>
      </div>
    </>
  );
}
