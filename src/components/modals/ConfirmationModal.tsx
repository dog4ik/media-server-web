import { render } from "solid-js/web";

/**
 * Returns promise with bool that indicates if user wants to continue
 */
export default function promptConfirm(
  prompt = "Are you sure?",
): Promise<boolean> {
  let dialogRef: HTMLDialogElement;
  let { promise, resolve } = Promise.withResolvers<boolean>();

  function handleReset() {
    dialogRef.close();
  }

  function handleConfirm() {
    dialogRef.close("continue");
  }

  function onClose() {
    if (dialogRef.returnValue === "continue") {
      resolve(true);
    } else {
      resolve(false);
    }

    // wait for animation to finish
    setTimeout(() => dialogRef.remove(), 500);
  }

  render(
    () => (
      <dialog
        onClose={onClose}
        class="h-40 w-80 rounded-md bg-black p-3 text-white"
        ref={dialogRef!}
      >
        <form
          class="flex h-full flex-col justify-between"
          method="dialog"
          onReset={handleReset}
          onSubmit={handleConfirm}
        >
          <span class="text-2xl">Confirm action</span>
          <p>{prompt}</p>
          <div class="flex flex-row-reverse items-center justify-between gap-2">
            <button
              class="btn transition-colors hover:border-red-500 hover:bg-red-500 hover:text-white"
              type="submit"
            >
              Yes
            </button>
            <button class="btn" type="reset">
              Cancel
            </button>
          </div>
        </form>
      </dialog>
    ),
    document.body,
  );

  dialogRef!.showModal();

  return promise;
}
