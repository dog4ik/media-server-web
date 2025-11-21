import { BiRegularMagnet } from "solid-icons/bi";
import { formatSize, formatTorrentIndex } from "@/utils/formats";
import { Schemas, server } from "@/utils/serverApi";
import { createSignal, For, Show, Suspense } from "solid-js";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { throwResponseErrors } from "@/utils/errors";
import { Button } from "@/ui/button";
import { TextField, TextFieldInput } from "@/ui/textfield";
import Loader from "../Loader";
import useDebounce from "@/utils/useDebounce";
import tracing from "@/utils/tracing";
import clsx from "clsx";
import { queryApi } from "@/utils/queryApi";
import { Skeleton } from "@/ui/skeleton";

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
    if (magnet()) {
      props.onClick(magnet()!);
    } else {
      let magnetLink = await obtainMagnetLink();
      props.onClick(magnetLink);
    }
  }
  return (
    <TableRow
      class={clsx(
        "cursor-pointer transition-opacity hover:bg-neutral-800",
        props.grayOut && "opacity-50",
      )}
      onClick={handleClick}
    >
      <TableCell>
        <p class="line-clamp-2 h-full" title={props.result.name}>
          {props.result.name}
        </p>
      </TableCell>
      <TableCell>{props.result.author ?? ""}</TableCell>
      <TableCell>{props.result.seeders}</TableCell>
      <TableCell>{props.result.leechers}</TableCell>
      <TableCell>{formatSize(props.result.size)}</TableCell>
      <TableCell class="flex justify-center space-y-2">
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
              <BiRegularMagnet size={20} />
            </a>
          )}
        </Show>
      </TableCell>
    </TableRow>
  );
}

function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell colSpan={6}>
        <Skeleton class="h-14 w-full" />
      </TableCell>
    </TableRow>
  );
}

function SearchError(props: { message: string }) {
  return (
    <div class="flex size-full items-center justify-center">
      <h3 class="text-2xl">Table search error: {props.message}</h3>
    </div>
  );
}

export default function Step1(props: Props) {
  let [selectedProvider, setSelectedProvider] =
    createSignal<Schemas["TorrentIndexIdentifier"]>("tpb");

  let [query, deferredQuery, setQuery] = useDebounce(
    300,
    props.downloadQuery(selectedProvider()),
  );

  let searchAbortController: AbortController | undefined = undefined;

  function handleProviderChange(provider: Schemas["TorrentIndexIdentifier"]) {
    if (selectedProvider() != provider) {
      tracing.trace(`Changing selected provider to: ${provider}`);
      setSelectedProvider(provider);
      setQuery(props.downloadQuery(provider));
    }
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
    }),
  );

  return (
    <div class="h-full overflow-y-auto">
      <div class="flex items-center space-x-2">
        <TextField value={query()} onChange={setQuery} class="w-full">
          <TextFieldInput />
        </TextField>
        <Select<Schemas["TorrentIndexIdentifier"]>
          placeholder="Torrent index"
          class="w-60"
          onChange={(p) => p && handleProviderChange(p)}
          value={selectedProvider()}
          options={["rutracker", "tpb"]}
          itemComponent={(props) => (
            <SelectItem item={props.item}>
              {formatTorrentIndex(props.item.rawValue)}
            </SelectItem>
          )}
        >
          <SelectTrigger>
            <SelectValue<string>>
              {(state) =>
                formatTorrentIndex(
                  state.selectedOption() as Schemas["TorrentIndexIdentifier"],
                )
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>
      </div>
      <Table class="table">
        <TableHeader>
          <TableRow class="text-white">
            <TableHead>Name</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Seeders</TableHead>
            <TableHead>Leechers</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Magnet</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <Show
            when={torrentSearch.isPlaceholderData || torrentSearch.isSuccess}
            fallback={[...Array(10)].map(() => (
              <TableRowSkeleton />
            ))}
          >
            <For each={torrentSearch.data}>
              {(res) => (
                <TorrentResult
                  grayOut={
                    torrentSearch.isFetching && torrentSearch.isPlaceholderData
                  }
                  onClick={props.onSelect}
                  result={res}
                />
              )}
            </For>
          </Show>
        </TableBody>
      </Table>
      <Show
        when={!torrentSearch.isFetching && torrentSearch.latest()?.length === 0}
      >
        <div class="flex size-full items-center justify-center">
          <h3 class="text-4xl text-white">No results</h3>
        </div>
      </Show>
    </div>
  );
}
