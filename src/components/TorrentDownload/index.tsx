import { Match, Show, Switch, createMemo, createSignal } from "solid-js";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";
import { Schemas, server } from "../../utils/serverApi";
import { formatSize } from "../../utils/formats";
import { Button } from "@/ui/button";
import { useNotifications } from "@/context/NotificationContext";
import { queryApi } from "@/utils/queryApi";

type StepLoadingProps = {
  currentStep: number;
};

function StepLoading(props: StepLoadingProps) {
  return (
    <div class="flex h-full w-full flex-col items-center justify-center gap-4">
      <span class="text-2xl">
        <Switch>
          <Match when={props.currentStep == 0}>
            Searching available torrents
          </Match>
          <Match when={props.currentStep == 1}>
            Resolving selected torrent
          </Match>
        </Switch>
      </span>
      <span class="loading loading-dots loading-lg"></span>
    </div>
  );
}

type Props = {
  onClose: () => void;
  downloadQuery: (provider: Schemas["TorrentIndexIdentifier"]) => string;
  content_hint?: Schemas["DownloadContentHint"];
};

export function TorrentDownloadSteps(props: Props) {
  let [currentStep, setCurrentStep] = createSignal(0);
  let [selectedMagnetLink, setSelectedMagnetLink] = createSignal<string>();
  let [selectedFiles, setSelectedFiles] = createSignal<boolean[]>([]);
  let [outputLocation, setOutputLocation] = createSignal<string>();
  let notificator = useNotifications();

  let resolvedMagnetLink = queryApi.useQuery(
    "get",
    "/api/torrent/resolve_magnet_link",
    () => ({
      params: {
        query: {
          magnet_link: selectedMagnetLink()!,
          metadata_id: props.content_hint?.metadata_id,
          content_type: props.content_hint?.content_type,
          metadata_provider: props.content_hint?.metadata_provider,
        },
      },
    }),
    () => ({ enabled: selectedMagnetLink() !== undefined }),
  );

  server.GET("/api/torrent/output_location", {}).then((res) => {
    let outputForContent = () => {
      if (props.content_hint?.content_type == "show") {
        return res.data?.show_location ?? undefined;
      }
      if (props.content_hint?.content_type == "movie") {
        return res.data?.movie_location ?? undefined;
      }
      return undefined;
    };
    outputLocation() || setOutputLocation(outputForContent());
  });

  function changeStep(newStep: number) {
    if (newStep <= 0) {
      setSelectedMagnetLink(undefined);
    }
    if (newStep <= 1) {
      setSelectedFiles([]);
    }
    setCurrentStep(newStep);
  }

  let enabledFiles = createMemo(() =>
    selectedFiles().reduce<number[]>((acc, enabled, idx) => {
      if (enabled) acc.push(idx);
      return acc;
    }, []),
  );

  async function handleFinish() {
    let r = await server.POST("/api/torrent/open", {
      body: {
        magnet_link: selectedMagnetLink()!,
        enabled_files: enabledFiles(),
        save_location: outputLocation(),
        content_hint: props.content_hint,
      },
    });
    if (r.error) {
      notificator(`Failed to open torrent: ${r.error.message}`);
    } else {
      notificator("Created torrent download");
    }
    props.onClose();
  }

  return (
    <div class="flex h-full w-full flex-col items-center">
      <div class="size-full overflow-y-auto">
        <Switch fallback={<StepLoading currentStep={currentStep()} />}>
          <Match when={currentStep() === 0}>
            <Step1
              downloadQuery={props.downloadQuery}
              contentHint={props.content_hint}
              onSelect={(magnet) => {
                setSelectedMagnetLink(magnet);
                setCurrentStep(1);
              }}
            />
          </Match>
          <Match when={currentStep() === 1 && resolvedMagnetLink.latest()}>
            <Step2
              onFileSelect={setSelectedFiles}
              content={resolvedMagnetLink.latest()!}
            />
          </Match>
          <Match when={currentStep() === 2 && resolvedMagnetLink.latest()}>
            <Step3
              content={resolvedMagnetLink.latest()!}
              output={outputLocation()}
              onOutputSelect={setOutputLocation}
              selectedFiles={enabledFiles()}
            />
          </Match>
        </Switch>
      </div>
      <div class="absolute right-5 bottom-5 space-x-4">
        <Show when={currentStep() !== 0}>
          <Button onClick={() => changeStep(currentStep() - 1)} class="btn">
            Back
          </Button>
        </Show>
        <Show when={currentStep() === 0 && selectedMagnetLink()}>
          <Button onClick={() => changeStep(currentStep() + 1)} class="btn">
            Next
          </Button>
        </Show>
        <Show when={currentStep() === 1}>
          <Show
            when={selectedFiles().length}
            fallback={
              <Button disabled class="opacity-100">
                Select at least 1 file to continue
              </Button>
            }
          >
            <Button onClick={() => changeStep(currentStep() + 1)} class="btn">
              Selected{" "}
              {formatSize(
                enabledFiles().reduce(
                  (acc, n) =>
                    acc + resolvedMagnetLink.latest()!.contents.files[n].size,
                  0,
                ),
              )}{" "}
              ({enabledFiles().length}{" "}
              {enabledFiles().length == 1 ? "File" : "Files"})
            </Button>
          </Show>
        </Show>
        <Show when={currentStep() === 2}>
          <Button onClick={handleFinish}>Finish</Button>
        </Show>
      </div>
    </div>
  );
}
