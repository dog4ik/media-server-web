import { BiRegularMagnet } from "solid-icons/bi";
import { capitalize, formatSize, formatTorrentIndex } from "@/utils/formats";
import { Schemas, server } from "@/utils/serverApi";
import { createSignal, ErrorBoundary, For, Show } from "solid-js";
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
import { TextField, TextFieldRoot } from "@/ui/textfield";

type Props = {
  searchResults?: Schemas["Torrent"][];
  onSelect: (magnetLink: string) => void;
  onQueryChange: (query: string) => void;
  onProviderChange: (provider: Schemas["TorrentIndexIdentifier"]) => void;
  provider: Schemas["TorrentIndexIdentifier"];
  query: string;
};

type TorrentResultProps = {
  result: Schemas["Torrent"];
  onClick: (magnetLink: string) => void;
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
      tabindex={0}
      class={`cursor-pointer hover:bg-neutral-800`}
      onClick={handleClick}
    >
      <TableCell>
        <Button variant={"link"} onClick={handleClick}>
          {props.result.name}
        </Button>
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

function SearchError(props: { message: string }) {
  return (
    <div class="flex size-full items-center justify-center">
      <h3 class="text-2xl">Table search error: {props.message}</h3>
    </div>
  );
}

export default function Step1(props: Props) {
  return (
    <div class="h-full overflow-y-auto">
      <div class="flex w-full items-center space-x-2">
        <TextFieldRoot
          value={props.query}
          onChange={props.onQueryChange}
          class="w-full"
        >
          <TextField />
        </TextFieldRoot>
        <Select<Schemas["TorrentIndexIdentifier"]>
          placeholder="Torrent index"
          onChange={(p) => p && props.onProviderChange(p)}
          defaultValue={"tpb"}
          value={props.provider}
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
        <ErrorBoundary fallback={<></>}>
          <TableBody>
            <For each={props.searchResults}>
              {(res) => <TorrentResult onClick={props.onSelect} result={res} />}
            </For>
          </TableBody>
        </ErrorBoundary>
      </Table>
      <ErrorBoundary fallback={(e) => <SearchError message={e.message} />}>
        <Show when={props.searchResults?.length === 0}>
          <div class="flex size-full items-center justify-center">
            <h3 class="text-4xl text-white">No results</h3>
          </div>
        </Show>
      </ErrorBoundary>
    </div>
  );
}
