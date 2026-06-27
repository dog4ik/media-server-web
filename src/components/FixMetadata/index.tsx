import { For, Match, Switch } from "solid-js";
import { Schemas } from "../../utils/serverApi";
import useDebounce from "../../utils/useDebounce";
import ProviderLogo from "../ProviderLogo";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/ui/dialog";
import { TextField, TextFieldInput } from "@/ui/textfield";
import { Skeleton } from "@/ui/skeleton";
import { queryApi } from "@/utils/queryApi";

type SearchResultProps = {
  metadata: Schemas["MetadataSearchResult"];
  onClick: () => void;
};

function SearchResult(props: SearchResultProps) {
  return (
    <button
      onClick={props.onClick}
      class="bg-card hover:bg-card/80 w-full overflow-hidden rounded-lg transition-colors"
    >
      <div class="grid grid-cols-[120px_1fr] gap-4 p-4 md:p-6">
        <img
          src={props.metadata.poster ?? "/no-photo.png"}
          alt="Search content poster"
          width={120}
          height={180}
          class="aspect-poster rounded-md object-cover"
        />
        <div class="grid gap-2">
          <div class="flex items-center gap-2">
            <h3 class="line-clamp-1 text-lg font-medium">{props.metadata.title}</h3>
          </div>
          <p class="text-muted-foreground line-clamp-2 text-left text-sm">{props.metadata.plot}</p>
          <div class="h-10 w-10">
            <ProviderLogo provider={props.metadata.metadata_provider} />
          </div>
        </div>
      </div>
    </button>
  );
}

function SearchResultSkeleton() {
  return (
    <div class="bg-card w-full overflow-hidden rounded-lg p-4 md:p-6">
      <div class="grid grid-cols-[120px_1fr] gap-4">
        <Skeleton class="aspect-poster w-30 rounded-md" />
        <div class="grid gap-2">
          <Skeleton class="h-7 w-3/4 rounded" />
          <Skeleton class="h-10 w-full rounded" />
          <Skeleton class="h-10 w-10 rounded" />
        </div>
      </div>
    </div>
  );
}

type Props = {
  initialSearch?: string;
  open: boolean;
  targetId: string;
  contentType: Schemas["ContentType"];
  onClose: () => void;
};

export default function FixMetadata(props: Props) {
  let [search, deferredSearch, setSearch] = useDebounce(500, props.initialSearch ?? "");

  let searchResult = queryApi.useQuery(
    "get",
    "/api/search/content",
    () => ({
      params: { query: { search: deferredSearch() } },
    }),
    () => ({ enabled: props.open }),
  );

  let filteredResults = () =>
    searchResult.data?.filter(
      (s) => s.metadata_provider !== "local" && s.content_type == props.contentType,
    ) ?? [];

  return (
    <Dialog onOpenChange={(isClosed) => isClosed || props.onClose()} open={props.open}>
      <DialogContent class="grid-rows-[auto_auto_1fr] sm:h-3/4 sm:w-2/3">
        <DialogHeader>
          <DialogTitle>Edit metadata</DialogTitle>
          <DialogDescription>Select correct metadata from the list below</DialogDescription>
        </DialogHeader>

        <TextField>
          <TextFieldInput
            onInput={(e) => setSearch(e.currentTarget.value)}
            value={search()}
            placeholder={props.initialSearch}
          />
        </TextField>

        <div class="overflow-auto">
          <Switch
            fallback={
              <div class="flex flex-col gap-2">
                <For each={[1, 2, 3]}>{() => <SearchResultSkeleton />}</For>
              </div>
            }
          >
            <Match when={searchResult.isError}>
              <div class="grid size-full place-items-center">
                <span class="text-muted-foreground text-2xl">Search failed</span>
              </div>
            </Match>
            <Match
              when={
                searchResult.isSuccess && !searchResult.isFetching && filteredResults().length === 0
              }
            >
              <div class="grid size-full place-items-center">
                <span class="text-muted-foreground text-2xl">Nothing found</span>
              </div>
            </Match>
            <Match when={searchResult.isSuccess}>
              <div class="flex flex-col gap-2">
                <For each={filteredResults()}>
                  {(result) => (
                    <SearchResult
                      metadata={result}
                      onClick={() => console.log("todo: fix metadata")}
                    />
                  )}
                </For>
              </div>
            </Match>
          </Switch>
        </div>
      </DialogContent>
    </Dialog>
  );
}
