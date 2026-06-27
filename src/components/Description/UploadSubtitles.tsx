import { Button } from "@/ui/button";
import { TextField, TextFieldLabel, TextFieldInput } from "@/ui/textfield";
import { Schemas, server } from "@/utils/serverApi";
import tracing from "@/utils/tracing";
import { createSignal, JSX, ParentProps, Show } from "solid-js";
import { FilePicker } from "../FilePicker";
import { formatSize } from "@/utils/formats";
import { FiTrash } from "solid-icons/fi";
import { useNotificationsContext } from "@/context/NotificationContext";
import { notifyResponseErrors } from "@/utils/errors";
import { LanguagePicker } from "../Settings/LanguagePicker";
import { queryApi, queryClient } from "@/utils/queryApi";

type Props = {
  videoId: number;
  onClose: () => void;
} & ParentProps;

export function UploadSubtitles(props: Props) {
  let [, { addNotification }] = useNotificationsContext();
  let [subtitlesFile, setSubtitlesFile] = createSignal<File>();
  let [subtitlesServerPath, setSubtitlesServerPath] = createSignal<string>();
  let [language, setLanguage] = createSignal<Schemas["Language"]>();

  let [isPending, setIsPending] = createSignal(false);
  let [isDraggedOver, setIsDraggedOver] = createSignal(false);

  function dragEventFile(e: DragEvent) {
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      let item = e.dataTransfer.items[0];
      // If dropped items aren't files, reject them
      return item.getAsFile();
    } else if (e.dataTransfer?.files) {
      return e.dataTransfer.files.item(0);
    }
  }

  let handleFileSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = async (e) => {
    e.preventDefault();
    setIsPending(true);
    try {
      let subs = subtitlesFile();
      if (subs) {
        tracing.debug({ name: subs.name, language: language() }, "Uploading subtitles file");
        let formData = new FormData();
        if (language()) {
          formData.append("language", language()!);
        }
        formData.append("subtitles", subs);

        let { error } = await server
          .POST("/api/video/{id}/upload_subtitles", {
            // yep
            body: formData as any,
            params: { path: { id: props.videoId } },
          })
          .then(notifyResponseErrors(addNotification, "upload subtitles file"));

        if (!error) {
          await queryApi.invalidateQueries(queryClient, "get", "/api/video/by_content");
          setSubtitlesFile(undefined);
          props.onClose();
        }
        return;
      }
      let path = subtitlesServerPath();
      if (path) {
        let { error } = await server
          .POST("/api/video/{id}/reference_subtitles", {
            params: { path: { id: props.videoId } },
            body: { path, language: language() },
          })
          .then(notifyResponseErrors(addNotification, "add subtitles"));

        if (!error) {
          await queryApi.invalidateQueries(queryClient, "get", "/api/video/by_content");
          props.onClose();
        }
      }
    } finally {
      setIsPending(false);
    }
  };

  let handleFileChange: JSX.EventHandler<HTMLInputElement, Event> = (e) => {
    let file = e.currentTarget.files?.[0];
    if (file?.name.endsWith(".srt")) {
      setSubtitlesFile(file);
    } else {
      setSubtitlesFile(undefined);
    }
  };

  let dragOverHandler: JSX.EventHandler<HTMLDivElement, DragEvent> = (e) => {
    tracing.debug("Drag over handler");
    e.preventDefault();
    setIsDraggedOver(true);
  };

  let dragEnterHandler: JSX.EventHandler<HTMLDivElement, DragEvent> = (e) => {
    tracing.debug("Drag enter handler");
    setIsDraggedOver(true);
    e.preventDefault();
  };

  let dragLeaveHandler: JSX.EventHandler<HTMLDivElement, DragEvent> = (e) => {
    tracing.debug("Drag leave handler");
    setIsDraggedOver(false);
    e.preventDefault();
  };

  let dragEndHandler: JSX.EventHandler<HTMLDivElement, DragEvent> = (e) => {
    tracing.debug("Drag end handler");
    setIsDraggedOver(false);
    e.preventDefault();
  };

  let dropHandler: JSX.EventHandler<HTMLDivElement, DragEvent> = (e) => {
    setIsDraggedOver(false);

    // Prevent file from being opened
    e.preventDefault();

    let file = dragEventFile(e);
    if (file?.name.endsWith(".srt")) {
      tracing.debug({ name: file.name }, "Drag handler received file");
      setSubtitlesFile(file);
    }
  };

  return (
    <div
      class="size-full"
      onDrop={dropHandler}
      onDragOver={dragOverHandler}
      onDragEnter={dragEnterHandler}
      onDragEnd={dragEndHandler}
      onDragLeave={dragLeaveHandler}
    >
      <Show
        fallback={<div class="pointer-events-none size-full border-2 border-dashed p-2"></div>}
        when={!isDraggedOver()}
      >
        <form onSubmit={handleFileSubmit} class="flex flex-col gap-4">
          <h4 class="text-lg">Language</h4>
          <LanguagePicker
            placeholder="Select language (optional)"
            value={language()}
            onChange={setLanguage}
          />
          <Show
            fallback={
              <>
                <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span class="text-lg">Select subtitles on the server</span>
                  <span class="text-sm">or</span>{" "}
                  <TextField class="flex max-w-fit flex-col space-y-1.5">
                    <TextFieldLabel class="max-w-fit cursor-pointer text-lg underline">
                      Click to upload
                    </TextFieldLabel>
                    <TextFieldInput
                      onInput={handleFileChange}
                      class="hidden"
                      type="file"
                      accept=".srt"
                    />
                  </TextField>
                  <span class="text-sm">or</span>{" "}
                  <span class="text-lg">
                    Drag and drop <code>.srt</code> file
                  </span>
                </div>
                <div>
                  <FilePicker onChange={setSubtitlesServerPath} />
                </div>
              </>
            }
            when={subtitlesFile()}
          >
            {(file) => (
              <div class="flex size-full flex-1 items-center justify-center gap-2">
                <div class="flex flex-col gap-2">
                  <span>{file().name}</span>
                  <span>{formatSize(file().size)}</span>
                </div>
                <Button onClick={() => setSubtitlesFile(undefined)} variant="destructive">
                  <FiTrash size={20} />
                </Button>
              </div>
            )}
          </Show>
          <Button
            disabled={(!subtitlesServerPath() && !subtitlesFile()) || isPending()}
            type="submit"
            class="mt-4"
          >
            {isPending() ? "Uploading..." : "Add Subtitles"}
          </Button>
        </form>
      </Show>
    </div>
  );
}
