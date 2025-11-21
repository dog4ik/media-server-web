import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/dialog";
import CircleAlert from "lucide-solid/icons/circle-alert";
import { Alert, AlertDescription } from "@/ui/alert";
import { createSignal, Show } from "solid-js";
import { Button } from "@/ui/button";
import { TextFieldLabel, TextFieldInput, TextField } from "@/ui/textfield";
import { JSX } from "solid-js/h/jsx-runtime";
import { MEDIA_SERVER_URL } from "@/utils/serverApi";
import FileInput from "@/components/ui/FileInput";
import Plus from "lucide-solid/icons/plus";
import tracing from "@/utils/tracing";

export function AddTorrentModal() {
  let [open, setOpen] = createSignal(false);
  let [magnetLink, setMagnetLink] = createSignal("");
  let [saveLocation, setSaveLocation] = createSignal("");
  let [torrentFile, setTorrentFile] = createSignal<File>();
  let [error, setError] = createSignal<string>();
  let [isLoading, setIsLoading] = createSignal(false);

  let uploadTorrentFile = async (file: File) => {
    tracing.debug("uploading torrent file");
    let formData = new FormData();
    if (saveLocation()) {
      formData.append("save_location", saveLocation()!);
    }
    formData.append("file", file);

    try {
      let response = await fetch(
        `${MEDIA_SERVER_URL}/api/torrent/open_torrent_file`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error("Failed to upload torrent file");
      }

      let result = await response.json();
      tracing.info("Upload successful:");
      return result;
    } catch (error) {
      tracing.error(`Failed to upload file`);
      throw error;
    }
  };

  let handleMagnetSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = (
    e,
  ) => {
    e.preventDefault();
    if (!magnetLink) {
      setError("Please enter a magnet link");
      return;
    }
    // TODO: Implement magnet link submission logic
    tracing.debug({ magent: magnetLink() }, "Submitting magnet link");
    setOpen(false);
    setMagnetLink("");
    setError(undefined);
  };

  let handleFileSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = async (
    e,
  ) => {
    e.preventDefault();
    let file = torrentFile();
    if (!file) {
      setError("Please select a .torrent file");
      return;
    }
    tracing.debug({ name: file.name }, "Submitting torrent file:");
    try {
      setError(undefined);
      setIsLoading(true);
      await uploadTorrentFile(file);
      setOpen(false);
      setTorrentFile(undefined);
    } catch (error) {
      setError("Failed to upload torrent file. Please try again.");
    } finally {
      setIsLoading(false);
    }
    setOpen(false);
    setTorrentFile(undefined);
    setError(undefined);
  };

  let handleFileChange: JSX.EventHandler<HTMLInputElement, Event> = (e) => {
    let file = e.currentTarget.files?.[0];
    if (file && file.name.endsWith(".torrent")) {
      setTorrentFile(file);
      setError(undefined);
    } else {
      setTorrentFile(undefined);
      setError("Please select a valid .torrent file");
    }
  };

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline">
          <Plus class="mr-2 h-4 w-4" />
          Add Torrent
        </Button>
      </DialogTrigger>
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Torrent</DialogTitle>
          <DialogDescription>
            Choose a method to add a new torrent to your list.
          </DialogDescription>
        </DialogHeader>
        <h4 class="text-lg">Save location</h4>
        <FileInput
          value={saveLocation()}
          onChange={setSaveLocation}
          title="Select torrent save location"
        />
        <Tabs defaultValue="magnet" class="w-full">
          <TabsList class="grid w-full grid-cols-2">
            <TabsTrigger value="magnet">Magnet Link</TabsTrigger>
            <TabsTrigger value="file">Torrent File</TabsTrigger>
          </TabsList>
          <TabsContent value="magnet">
            <form onSubmit={handleMagnetSubmit}>
              <div class="grid w-full items-center gap-4">
                <TextField class="flex flex-col space-y-1.5">
                  <TextFieldLabel>Magnet Link</TextFieldLabel>
                  <TextFieldInput
                    id="magnetLink"
                    placeholder="Paste your magnet link here"
                    value={magnetLink()}
                    onChange={(e) => setMagnetLink(e.target.value)}
                  />
                </TextField>
              </div>
              <Button type="submit" class="mt-4">
                Add Torrent
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="file">
            <form onSubmit={handleFileSubmit}>
              <div class="grid w-full items-center gap-4">
                <TextFieldRoot class="flex flex-col space-y-1.5">
                  <TextFieldLabel>Torrent File</TextFieldLabel>
                  <TextField
                    onInput={handleFileChange}
                    value={""}
                    type="file"
                    accept=".torrent"
                  />
                </TextFieldRoot>
              </div>
              <Button type="submit" class="mt-4">
                Add Torrent
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        <Show when={error()}>
          {(error) => (
            <Alert variant="destructive">
              <CircleAlert class="h-4 w-4" />
              <AlertDescription>{error()}</AlertDescription>
            </Alert>
          )}
        </Show>
      </DialogContent>
    </Dialog>
  );
}
