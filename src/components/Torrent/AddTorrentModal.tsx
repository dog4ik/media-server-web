import { Tabs, TabsContent, TabsList, TabsTrigger, TabsIndicator } from "@/ui/tabs";
import {
  Dialog,
  DialogContent,
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
import { MEDIA_SERVER_URL, server } from "@/utils/serverApi";
import { FilePicker } from "@/components/FilePicker";
import Plus from "lucide-solid/icons/plus";
import tracing from "@/utils/tracing";

const ICON_SIZE = 15;

export function AddTorrentModal() {
  let [open, setOpen] = createSignal(false);
  let [magnetLink, setMagnetLink] = createSignal("");
  let [saveLocation, setSaveLocation] = createSignal("");
  let [torrentFile, setTorrentFile] = createSignal<File>();
  let [error, setError] = createSignal<string>();
  let [isLoading, setIsLoading] = createSignal(false);

  function reset() {
    setMagnetLink("");
    setTorrentFile(undefined);
    setError(undefined);
  }

  function handleOpenChange(val: boolean) {
    if (!val) reset();
    setOpen(val);
  }

  let handleMagnetSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = async (e) => {
    e.preventDefault();
    let link = magnetLink().trim();
    if (!link) {
      setError("Please enter a magnet link");
      return;
    }
    try {
      setError(undefined);
      setIsLoading(true);
      await server.POST("/api/torrent/open", {
        body: {
          magnet_link: link,
          save_location: saveLocation() || null,
        },
      });
      handleOpenChange(false);
    } catch (err) {
      tracing.error({ err }, "Failed to add magnet link");
      setError(
        err instanceof Error ? err.message : "Failed to add torrent. Check the magnet link and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  let handleFileSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = async (e) => {
    e.preventDefault();
    let file = torrentFile();
    if (!file) {
      setError("Please select a .torrent file");
      return;
    }
    try {
      setError(undefined);
      setIsLoading(true);
      let formData = new FormData();
      formData.append("torrent_file", file);
      if (saveLocation()) {
        formData.append("save_location", saveLocation());
      }
      let response = await fetch(`${MEDIA_SERVER_URL}/api/torrent/open_torrent_file`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        let json = await response.json().catch(() => ({}));
        throw new Error(json.message || "Failed to upload torrent file");
      }
      handleOpenChange(false);
    } catch (err) {
      tracing.error({ err }, "Failed to upload torrent file");
      setError(
        err instanceof Error ? err.message : "Failed to upload torrent file. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  let handleFileChange: JSX.EventHandler<HTMLInputElement, Event> = (e) => {
    let file = e.currentTarget.files?.[0];
    if (file && file.name.endsWith(".torrent")) {
      setTorrentFile(file);
      setError(undefined);
    } else {
      setTorrentFile(undefined);
      if (file) setError("Please select a valid .torrent file");
    }
  };

  return (
    <Dialog open={open()} onOpenChange={handleOpenChange}>
      <DialogTrigger>
        <Button variant="outline" class="flex h-8 gap-1.5">
          <Plus size={ICON_SIZE} />
          Add Torrent
        </Button>
      </DialogTrigger>
      <DialogContent class="flex max-h-[90vh] max-w-2xl flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Torrent</DialogTitle>
        </DialogHeader>
        <div class="space-y-4">
          <div class="space-y-1.5">
            <p class="text-sm font-medium">Save location</p>
            <FilePicker
              onChange={setSaveLocation}
              disallowFiles
            />
          </div>
          <Tabs defaultValue="magnet" class="w-full">
            <TabsList class="grid w-full grid-cols-2">
              <TabsIndicator />
              <TabsTrigger value="magnet">Magnet Link</TabsTrigger>
              <TabsTrigger value="file">Torrent File</TabsTrigger>
            </TabsList>
            <TabsContent value="magnet" class="mt-4">
              <form onSubmit={handleMagnetSubmit} class="space-y-4">
                <TextField class="flex flex-col space-y-1.5">
                  <TextFieldLabel>Magnet Link</TextFieldLabel>
                  <TextFieldInput
                    placeholder="magnet:?xt=urn:btih:..."
                    value={magnetLink()}
                    onInput={(e) => setMagnetLink(e.currentTarget.value)}
                  />
                </TextField>
                <Button type="submit" class="w-full" disabled={isLoading()}>
                  {isLoading() ? "Adding..." : "Add Torrent"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="file" class="mt-4">
              <form onSubmit={handleFileSubmit} class="space-y-4">
                <TextField class="flex flex-col space-y-1.5">
                  <TextFieldLabel>Torrent File</TextFieldLabel>
                  <TextFieldInput
                    onInput={handleFileChange}
                    value={""}
                    type="file"
                    accept=".torrent"
                  />
                </TextField>
                <Button type="submit" class="w-full" disabled={isLoading() || !torrentFile()}>
                  {isLoading() ? "Uploading..." : "Upload Torrent"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          <Show when={error()}>
            {(err) => (
              <Alert variant="destructive">
                <CircleAlert class="h-4 w-4" />
                <AlertDescription>{err()}</AlertDescription>
              </Alert>
            )}
          </Show>
        </div>
      </DialogContent>
    </Dialog>
  );
}
