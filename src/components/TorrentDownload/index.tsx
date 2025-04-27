import { Match, Show, Switch, createMemo, createSignal } from "solid-js";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";
import { createAsync } from "@solidjs/router";
import { Schemas, server } from "../../utils/serverApi";
import { formatSize } from "../../utils/formats";
import { Button } from "@/ui/button";
import useDebounce from "@/utils/useDebounce";

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
  downloadQuery: string;
  content_hint?: Schemas["DownloadContentHint"];
};

export function TorrentDownloadSteps(props: Props) {
  let [currentStep, setCurrentStep] = createSignal(0);
  let [query, deferredQuery, setQuery] = useDebounce(300, props.downloadQuery);
  let [selectedProvider, setSelectedProvider] =
    createSignal<Schemas["TorrentIndexIdentifier"]>("tpb");
  let [selectedMagnetLink, setSelectedMagnetLink] = createSignal<string>();
  let [selectedFiles, setSelectedFiles] = createSignal<boolean[]>([]);
  let [outputLocation, setOutputLocation] = createSignal<string>();

  let resolvedMagnetLink = createAsync(async () => {
    if (!selectedMagnetLink()) {
      return undefined;
    }
    return await server.GET("/api/torrent/resolve_magnet_link", {
      params: {
        query: {
          magnet_link: selectedMagnetLink()!,
          metadata_id: props.content_hint?.metadata_id,
          content_type: props.content_hint?.content_type,
          metadata_provider: props.content_hint?.metadata_provider,
        },
      },
    });
  });

  let searchAbortController: AbortController | undefined = undefined;

  let torrentSearch = createAsync(async () => {
    let abortController = new AbortController();
    let signal = abortController.signal;
    searchAbortController = abortController;
    let result = await server
      .GET("/api/torrent/search", {
        params: {
          query: {
            search: deferredQuery(),
            content_type: props.content_hint?.content_type,
            provider: selectedProvider(),
          },
        },
        signal,
      })
      .catch((_) => {
        if (searchAbortController?.signal.aborted) {
          console.log("Aborted torrent search request");
        }
      });
    if (!result?.data || result.data.length === 0) {
      return undefined;
    }
    return result;
  });

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
    await server.POST("/api/torrent/open", {
      body: {
        magnet_link: selectedMagnetLink()!,
        enabled_files: enabledFiles(),
        save_location: outputLocation(),
        content_hint: props.content_hint,
      },
    });
    props.onClose();
  }

  return (
    <div class="flex h-full w-full flex-col items-center">
      <div class="w-full overflow-y-auto">
        <Switch fallback={<StepLoading currentStep={currentStep()} />}>
          <Match when={currentStep() === 0}>
            <Step1
              onSelect={(magnet) => {
                setSelectedMagnetLink(magnet);
                setCurrentStep(1);
              }}
              onProviderChange={setSelectedProvider}
              onQueryChange={(q) => {
                if (searchAbortController) {
                  searchAbortController.abort();
                }
                setQuery(q);
              }}
              provider={selectedProvider()}
              query={query()}
              searchResults={torrentSearch()?.data}
            />
          </Match>
          <Match when={currentStep() === 1 && resolvedMagnetLink()?.data}>
            <Step2
              onFileSelect={setSelectedFiles}
              content={resolvedMagnetLink()!.data!}
            />
          </Match>
          <Match when={currentStep() === 2 && resolvedMagnetLink()?.data}>
            <Step3
              content={resolvedMagnetLink()!.data!}
              output={outputLocation()}
              onOutputSelect={setOutputLocation}
              selectedFiles={enabledFiles()}
            />
          </Match>
        </Switch>
      </div>
      <div class="absolute bottom-5 right-5 space-x-4">
        <Show when={currentStep() !== 0}>
          <button onClick={() => changeStep(currentStep() - 1)} class="btn">
            Back
          </button>
        </Show>
        <Show when={currentStep() === 0 && selectedMagnetLink()}>
          <button onClick={() => changeStep(currentStep() + 1)} class="btn">
            Next
          </button>
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
                    acc + resolvedMagnetLink()!.data!.contents.files[n].size,
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
