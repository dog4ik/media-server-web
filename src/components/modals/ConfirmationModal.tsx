import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/ui/alert-dialog";
import { Button } from "@/ui/button";
import { createSignal } from "solid-js";
import { render } from "solid-js/web";

/**
 * Returns promise with bool that indicates if user wants to continue
 */
export default function promptConfirm(
  prompt = "Are you sure?",
): Promise<boolean> {
  let { promise, resolve } = Promise.withResolvers<boolean>();
  let [showModal, setShowModal] = createSignal(true);

  function handleReset() {
    resolve(false);
    setShowModal(false);
  }

  function handleConfirm() {
    setShowModal(false);
    resolve(true);
  }

  function onClose() {
    resolve(false);
  }

  render(
    () => (
      <AlertDialog
        open={showModal()}
        onOpenChange={(opened) => !opened && onClose()}
      >
        <AlertDialogContent>
          <AlertDialogHeader class="text-2xl">Confirm action</AlertDialogHeader>
          <AlertDialogDescription>{prompt}</AlertDialogDescription>
          <form
            onReset={(e) => {
              e.preventDefault();
              handleReset();
            }}
            onSubmit={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
          >
            <AlertDialogFooter>
              <Button type="reset" variant={"destructive"}>
                Cancel
              </Button>
              <Button type="submit">Yes</Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    ),
    document.body,
  );

  return promise;
}
