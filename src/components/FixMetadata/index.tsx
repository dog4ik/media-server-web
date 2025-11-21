import { For, Show, Suspense } from "solid-js";
import { Schemas, revalidatePath, server } from "../../utils/serverApi";
import useDebounce from "../../utils/useDebounce";
import { useNotifications } from "../../context/NotificationContext";
import ProviderLogo from "../generic/ProviderLogo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";
import { TextField, TextFieldInput } from "@/ui/textfield";
import Loader, { SuspenseLoader } from "../Loader";
import { throwResponseErrors } from "@/utils/errors";
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
            <h3 class="line-clamp-1 text-lg font-medium">
              {props.metadata.title}
            </h3>
          </div>
          <p class="text-muted-foreground line-clamp-2 text-left text-sm">
            {props.metadata.plot}
          </p>
          <div class="h-10 w-10">
            <ProviderLogo provider={props.metadata.metadata_provider} />
          </div>
        </div>
      </div>
    </button>
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
  let notificator = useNotifications();
  let [search, deferredSearch, setSearch] = useDebounce(
    500,
    props.initialSearch ?? "",
  );

  let searchResult = queryApi.useQuery(
    "get",
    "/api/search/content",
    () => ({
      params: { query: { search: deferredSearch() } },
    }),
    () => ({ enabled: props.open }),
  );

  async function handleFix(provider: Schemas["MetadataProvider"], id: string) {
    await server
      .POST("/api/fix_metadata/{content_id}", {
        params: {
          query: { id, provider, content_type: props.contentType },
          path: { content_id: +props.targetId },
        },
      })
      .then((r) => {
        if (r.error) {
          notificator(`Failed to fix metadata`);
        } else {
          notificator("Fixed metadata");
        }
      })
      .finally(() => {
        if (props.contentType == "show") {
          revalidatePath("/api/local_shows");
        }
        if (props.contentType == "movie") {
          revalidatePath("/api/local_movies");
        }
      });
    props.onClose && props.onClose();
  }

  return (
    <Dialog
      onOpenChange={(isClosed) => isClosed || props.onClose()}
      open={props.open}
    >
      <DialogContent class="flex h-3/4 w-2/3 flex-col">
        <DialogHeader>
          <DialogTitle>Edit metadata</DialogTitle>
          <DialogDescription>
            Select correct metadata from the list below
          </DialogDescription>
        </DialogHeader>

        <TextField>
          <TextFieldInput
            onInput={(e) => setSearch(e.currentTarget.value)}
            value={search()}
            placeholder={props.initialSearch}
          />
        </TextField>
        <div class="flex-1 overflow-auto">
          <SuspenseLoader name="Fix metadata search results">
            <Show
              when={searchResult.data}
              fallback={
                <div class="grid size-full place-items-center">
                  <span class="text-2xl">Nothing found</span>
                </div>
              }
            >
              {(results) => (
                <For
                  each={results().filter(
                    (s) =>
                      s.metadata_provider !== "local" &&
                      s.content_type == props.contentType,
                  )}
                >
                  {(result) => (
                    <SearchResult
                      metadata={result}
                      onClick={() =>
                        handleFix(result.metadata_provider, result.metadata_id)
                      }
                    />
                  )}
                </For>
              )}
            </Show>
          </SuspenseLoader>
        </div>
      </DialogContent>
    </Dialog>
  );
}
