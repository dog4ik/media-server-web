import { Button } from "@/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxTrigger,
} from "@/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { TextField, TextFieldLabel, TextFieldRoot } from "@/ui/textfield";
import { MEDIA_SERVER_URL, Schemas } from "@/utils/serverApi";
import tracing from "@/utils/tracing";
import { createSignal, JSX } from "solid-js";

type Props = {
  videoId: number;
};

const LANGUAGE_OPTIONS: Schemas["Language"][] = [
  "en",
  "es",
  "de",
  "fr",
  "ru",
  "ja",
];

export default function UploadSubtitlesDialog(props: Props) {
  return (
    <Dialog>
      <DialogTrigger>Upload subtitles</DialogTrigger>
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload subtitles</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <UploadSubtitles videoId={props.videoId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function UploadSubtitles(props: Props) {
  let [subtitlesFile, setSubtitlesFile] = createSignal<File>();
  let [path, setPath] = createSignal<string>();
  let [error, setError] = createSignal<string>();
  let [isLoading, setIsLoading] = createSignal(false);
  let [language, setLanguage] = createSignal<string>();
  let [options, setOptions] = createSignal(LANGUAGE_OPTIONS);

  function onLanguageChange(val: string) {
    setOptions(
      LANGUAGE_OPTIONS.filter((option) => option.startsWith(val.toLowerCase())),
    );
  }

  async function uploadSubtitles(file: File) {
    tracing.debug("uploading subtitles file");
    let formData = new FormData();
    if (language()) {
      formData.append("language", language()!);
    }
    formData.append("file", file);

    let response = await fetch(
      `${MEDIA_SERVER_URL}/api/video/${props.videoId}/upload_subtitles`,
      {
        method: "POST",
        body: formData,
      },
    );
  }

  let handleFileSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = async (
    e,
  ) => {
    e.preventDefault();
    let subs = subtitlesFile();
    if (!subs) {
      setError("Please select a .srt file");
      return;
    }
    tracing.debug({ name: subs.name }, "Submitting subtitles file");
    try {
      await uploadSubtitles(subs);
      setSubtitlesFile(undefined);
    } catch (error) {
      setError("Failed to upload subtitles file");
    } finally {
      setIsLoading(false);
    }
  };

  let handleFileChange: JSX.EventHandler<HTMLInputElement, Event> = (e) => {
    let file = e.currentTarget.files?.[0];
    if (file && file.name.endsWith(".srt")) {
      setSubtitlesFile(file);
      setError(undefined);
    } else {
      setSubtitlesFile(undefined);
      setError("Please select a valid .srt file");
    }
  };

  return (
    <div>
      <h4 class="text-lg">Language</h4>
      <Combobox
        options={options()}
        placeholder="Subtitles language"
        onInputChange={onLanguageChange}
        itemComponent={(props) => (
          <ComboboxItem item={props.item}>{props.item.rawValue}</ComboboxItem>
        )}
      >
        <ComboboxTrigger>
          <ComboboxInput />
        </ComboboxTrigger>
        <ComboboxContent />
      </Combobox>
      <Tabs defaultValue="upload" class="w-full">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="link">Reference Subtitles</TabsTrigger>
          <TabsTrigger value="upload">Upload Subtitles</TabsTrigger>
        </TabsList>
        <TabsContent value="link">
          <form onSubmit={handleFileSubmit}>
            <div class="grid w-full items-center gap-4">
              <TextFieldRoot class="flex flex-col space-y-1.5">
                <TextFieldLabel>Referenced Subtitles</TextFieldLabel>
                <TextField
                  id="subtitles"
                  placeholder="Select subtitles file on the server"
                  value={path()}
                  onChange={(e) => setPath(e.target.value)}
                />
              </TextFieldRoot>
            </div>
            <Button type="submit" class="mt-4">
              Select Subtitles
            </Button>
          </form>
        </TabsContent>
        <TabsContent value="upload">
          <form onSubmit={handleFileSubmit}>
            <div class="grid w-full items-center gap-4">
              <TextFieldRoot class="flex flex-col space-y-1.5">
                <TextFieldLabel>Uploaded Subtitles</TextFieldLabel>
                <TextField
                  onInput={handleFileChange}
                  type="file"
                  accept=".srt"
                />
              </TextFieldRoot>
            </div>
            <Button type="submit" class="mt-4">
              Upload Subtitles
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
