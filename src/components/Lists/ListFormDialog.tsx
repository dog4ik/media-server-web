import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { TextField, TextFieldInput, TextFieldLabel, TextFieldTextArea } from "@/ui/textfield";
import { Button } from "@/ui/button";
import { queryApi, queryClient } from "@/utils/queryApi";
import type { Schemas } from "@/utils/serverApi";

type Props = {
  open: boolean;
  onClose: () => void;
  /** When provided the dialog edits this list instead of creating a new one */
  list?: Schemas["List"];
};

export function ListFormDialog(props: Props) {
  function onSaved() {
    queryApi.invalidateQueries(queryClient, "get", "/api/lists");
    if (props.list) {
      queryApi.invalidateQueries(queryClient, "get", "/api/lists/{id}");
    }
    props.onClose();
  }

  let createList = queryApi.useMutation("post", "/api/lists/create", () => ({
    onSuccess: onSaved,
  }));

  let updateList = queryApi.useMutation("put", "/api/lists/{id}", () => ({
    onSuccess: onSaved,
  }));

  let isPending = () => createList.isPending || updateList.isPending;

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    let form = new FormData(e.currentTarget as HTMLFormElement);
    let name = (form.get("name")?.toString() ?? "").trim();
    if (!name || isPending()) return;
    let description = (form.get("description")?.toString() ?? "").trim() || null;
    let body = { name, description };
    if (props.list) {
      updateList.mutate({ params: { path: { id: props.list.id } }, body });
    } else {
      createList.mutate({ body });
    }
  }

  return (
    <Dialog open={props.open} onOpenChange={(open) => !open && props.onClose()}>
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{props.list ? "Edit list" : "New list"}</DialogTitle>
        </DialogHeader>
        <form class="grid gap-4" onSubmit={handleSubmit}>
          <TextField name="name" defaultValue={props.list?.name ?? ""}>
            <TextFieldLabel>Name</TextFieldLabel>
            <TextFieldInput required placeholder="My list" />
          </TextField>
          <TextField name="description" defaultValue={props.list?.description ?? ""}>
            <TextFieldLabel>Description</TextFieldLabel>
            <TextFieldTextArea placeholder="Optional description" />
          </TextField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={props.onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending()}>
              {props.list ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
