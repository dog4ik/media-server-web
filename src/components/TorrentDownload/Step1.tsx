import clsx from "clsx";
import ArrowDown from "lucide-solid/icons/arrow-down";
import ArrowUp from "lucide-solid/icons/arrow-up";
import Magnet from "lucide-solid/icons/magnet";
import {
  createMemo,
  createSignal,
  For,
  Match,
  Show,
  Suspense,
  Switch,
} from "solid-js";
import {
  identifierTitle,
  resolutionTier,
  sourceLabel,
  sourceTier,
  tagLabel,
  tierClass,
} from "@/lib/torrentAttributes";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Skeleton } from "@/ui/skeleton";
import { Tabs, TabsIndicator, TabsList, TabsTrigger } from "@/ui/tabs";
import { TextField, TextFieldInput } from "@/ui/textfield";
import { throwResponseErrors } from "@/utils/errors";
import { formatSize } from "@/utils/formats";
import { queryApi } from "@/utils/queryApi";
import { type Schemas, server } from "@/utils/serverApi";
import tracing from "@/utils/tracing";
import useDebounce from "@/utils/useDebounce";

const PROVIDERS: Schemas["TorrentIndexIdentifier"][] = [
  "tpb",
  "nyaa",
  "rutracker",
];

const PROVIDER_TAB_LABEL: Record<Schemas["TorrentIndexIdentifier"], string> = {
  tpb: "TPB",
  nyaa: "Nyaa",
  rutracker: "RuTracker",
};

const UNKNOWN_RESOLUTION = "Unknown";

function torrentResolution(torrent: Schemas["Torrent"]): string {
  return torrent.identifier?.attributes.resolution ?? UNKNOWN_RESOLUTION;
}

type Props = {
  onSelect: (magnetLink: string) => void;
  downloadQuery: (provider: Schemas["TorrentIndexIdentifier"]) => string;
  contentHint?: Schemas["DownloadContentHint"];
};

type TorrentResultProps = {
  result: Schemas["Torrent"];
  onClick: (magnetLink: string) => void;
  grayOut: boolean;
};

function AttributeBadges(props: { attributes: Schemas["Attributes"] }) {
  return (
    <>
      <Show when={props.attributes.resolution}>
        {(resolution) => (
          <Badge
            variant="outline"
            class={tierClass(resolutionTier(resolution()))}
          >
            {resolution()}
          </Badge>
        )}
      </Show>
      <Show when={props.attributes.source}>
        {(source) => (
          <Badge variant="outline" class={tierClass(sourceTier(source()))}>
            {sourceLabel(source())}
          </Badge>
        )}
      </Show>
      <Show when={props.attributes.codec}>
        {(codec) => <Badge variant="outline">{codec().toUpperCase()}</Badge>}
      </Show>
      <For each={props.attributes.tags}>
        {(tag) => <Badge variant="secondary">{tagLabel(tag)}</Badge>}
      </For>
    </>
  );
}

function TorrentResult(props: TorrentResultProps) {
  let [magnet, setMagnet] = createSignal(props.result.magnet);

  async function obtainMagnetLink() {
    let provider = props.result.provider;
    let id = props.result.provider_id;
    let obtainResponse = await server
      .GET("/api/torrent/index_magnet_link", {
        params: { query: { provider, id } },
      })
      .then(throwResponseErrors);
    setMagnet(obtainResponse.magnet_link);
    return obtainResponse.magnet_link;
  }

  async function handleClick() {
    const existingMagnet = magnet();
    if (existingMagnet) {
      props.onClick(existingMagnet);
    } else {
      let magnetLink = await obtainMagnetLink();
      props.onClick(magnetLink);
    }
  }

  let subtitle = () =>
    [
      props.result.identifier ? props.result.name : undefined,
      props.result.author ?? undefined,
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    // biome-ignore lint/a11y/useSemanticElements: the row nests its own interactive elements (Obtain button, magnet link), which a <button> cannot contain
    <div
      class={clsx(
        "flex cursor-pointer items-center gap-4 px-3 py-2 transition-opacity hover:bg-neutral-800 focus-visible:bg-neutral-800 focus-visible:outline-none",
        props.grayOut && "opacity-50",
      )}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span
            class="max-w-full min-w-0 truncate font-medium"
            title={props.result.name}
          >
            {props.result.identifier
              ? identifierTitle(props.result.identifier)
              : props.result.name}
          </span>
          <Show when={props.result.identifier?.attributes}>
            {(attributes) => <AttributeBadges attributes={attributes()} />}
          </Show>
        </div>
        <Show when={subtitle()}>
          <p
            class="truncate text-xs text-neutral-400"
            title={props.result.name}
          >
            {subtitle()}
          </p>
        </Show>
      </div>
      <div class="flex shrink-0 items-center gap-4 text-sm">
        <div class="flex flex-col items-end gap-0.5">
          <span class="flex items-center gap-1 text-green-500">
            <ArrowUp class="size-3.5" />
            {props.result.seeders}
          </span>
          <span class="flex items-center gap-1 text-neutral-400">
            <ArrowDown class="size-3.5" />
            {props.result.leechers}
          </span>
        </div>
        <span class="w-18 text-right">{formatSize(props.result.size)}</span>
        <div class="flex w-20 justify-center">
          <Show
            when={magnet()}
            fallback={
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  obtainMagnetLink();
                }}
              >
                Obtain
              </Button>
            }
          >
            {(magnet) => (
              <a href={magnet()} onClick={(e) => e.stopPropagation()}>
                <Magnet size={20} />
              </a>
            )}
          </Show>
        </div>
      </div>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div class="flex items-center gap-4 px-3 py-2">
      <div class="flex flex-1 flex-col gap-2">
        <Skeleton class="h-4 w-2/3" />
        <Skeleton class="h-3 w-1/2" />
      </div>
      <Skeleton class="h-8 w-40" />
    </div>
  );
}

function FilterChip(props: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      class={clsx(
        "cursor-pointer rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
        props.active
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
      onClick={() => props.onClick()}
    >
      {props.children}
    </button>
  );
}

export default function Step1(props: Props) {
  let [selectedProvider, setSelectedProvider] =
    createSignal<Schemas["TorrentIndexIdentifier"]>("tpb");
  let [resolutionFilter, setResolutionFilter] = createSignal<string>();

  let [query, deferredQuery, setQuery] = useDebounce(
    300,
    props.downloadQuery(selectedProvider()),
  );

  function handleProviderChange(provider: Schemas["TorrentIndexIdentifier"]) {
    if (selectedProvider() !== provider) {
      tracing.trace(`Changing selected provider to: ${provider}`);
      setSelectedProvider(provider);
      setResolutionFilter(undefined);
      setQuery(props.downloadQuery(provider));
    }
  }

  function handleQueryChange(newQuery: string) {
    setResolutionFilter(undefined);
    setQuery(newQuery);
  }

  let torrentSearch = queryApi.useQuery(
    "get",
    "/api/torrent/search",
    () => ({
      params: {
        query: {
          search: deferredQuery(),
          content_type: props.contentHint?.content_type,
          provider: selectedProvider(),
        },
      },
    }),
    () => ({
      placeholderData: (previousData) => previousData,
      // render provider errors (e.g. "movie search is not supported") inline instead of throwing
      throwOnError: false,
    }),
  );

  let resolutionBuckets = createMemo(() => {
    let counts = new Map<string, number>();
    for (let torrent of torrentSearch.latest() ?? []) {
      let label = torrentResolution(torrent);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    let bucketOrder = (label: string) => {
      let height = Number.parseInt(label, 10);
      return Number.isNaN(height) ? -1 : height;
    };
    return [...counts.entries()].sort(
      ([a], [b]) => bucketOrder(b) - bucketOrder(a),
    );
  });

  let visibleTorrents = createMemo(() => {
    let all = torrentSearch.latest() ?? [];
    let filter = resolutionFilter();
    let filtered = filter
      ? all.filter((t) => torrentResolution(t) === filter)
      : all;
    return [...filtered].sort((a, b) => b.seeders - a.seeders);
  });

  return (
    <Suspense>
      <div class="flex h-full min-h-0 flex-col gap-2">
        <div class="flex items-center gap-2">
          <TextField
            value={query()}
            onChange={handleQueryChange}
            class="flex-1"
          >
            <TextFieldInput />
          </TextField>
          <Tabs
            value={selectedProvider()}
            onChange={(provider) =>
              handleProviderChange(
                provider as Schemas["TorrentIndexIdentifier"],
              )
            }
            class="w-fit shrink-0"
          >
            <TabsList>
              <TabsIndicator />
              <For each={PROVIDERS}>
                {(provider) => (
                  <TabsTrigger value={provider}>
                    {PROVIDER_TAB_LABEL[provider]}
                  </TabsTrigger>
                )}
              </For>
            </TabsList>
          </Tabs>
        </div>
        <Show when={resolutionBuckets().length > 1}>
          <div class="flex flex-wrap items-center gap-2">
            <FilterChip
              active={!resolutionFilter()}
              onClick={() => setResolutionFilter(undefined)}
            >
              {`All (${torrentSearch.latest()?.length ?? 0})`}
            </FilterChip>
            <For each={resolutionBuckets()}>
              {([label, count]) => (
                <FilterChip
                  active={resolutionFilter() === label}
                  onClick={() =>
                    setResolutionFilter((current) =>
                      current === label ? undefined : label,
                    )
                  }
                >
                  {`${label} (${count})`}
                </FilterChip>
              )}
            </For>
          </div>
        </Show>
        <div class="min-h-0 flex-1 overflow-y-auto">
          <Switch
            fallback={
              <div class="flex flex-col divide-y divide-neutral-800">
                <For each={[...Array(10)]}>{() => <RowSkeleton />}</For>
              </div>
            }
          >
            <Match when={torrentSearch.isError}>
              <div class="flex size-full flex-col items-center justify-center gap-2">
                <h3 class="text-2xl text-white">Search failed</h3>
                <p class="text-neutral-400">{torrentSearch.error?.message}</p>
              </div>
            </Match>
            <Match
              when={
                !torrentSearch.isFetching &&
                torrentSearch.latest()?.length === 0
              }
            >
              <div class="flex size-full items-center justify-center">
                <h3 class="text-4xl text-white">No results</h3>
              </div>
            </Match>
            <Match
              when={
                (torrentSearch.isPlaceholderData || torrentSearch.isSuccess) &&
                visibleTorrents().length === 0
              }
            >
              <div class="flex size-full flex-col items-center justify-center gap-4">
                <h3 class="text-2xl text-white">No results match the filter</h3>
                <Button onClick={() => setResolutionFilter(undefined)}>
                  Clear filter
                </Button>
              </div>
            </Match>
            <Match
              when={torrentSearch.isPlaceholderData || torrentSearch.isSuccess}
            >
              <div class="flex flex-col divide-y divide-neutral-800">
                <For each={visibleTorrents()}>
                  {(res) => (
                    <TorrentResult
                      grayOut={
                        torrentSearch.isFetching &&
                        torrentSearch.isPlaceholderData
                      }
                      onClick={props.onSelect}
                      result={res}
                    />
                  )}
                </For>
              </div>
            </Match>
          </Switch>
        </div>
      </div>
    </Suspense>
  );
}
