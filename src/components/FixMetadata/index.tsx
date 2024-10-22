import { For, Show, onMount } from "solid-js";
import { Schemas, revalidatePath, server } from "../../utils/serverApi";
import useDebounce from "../../utils/useDebounce";
import Modal from "../modals/Modal";
import { createAsync } from "@solidjs/router";
import { useNotifications } from "../../context/NotificationContext";

type SearchResultProps = {
  metadata: Schemas["MetadataSearchResult"];
  onClick: () => void;
};

function SearchResult(props: SearchResultProps) {
  return (
    <button
      onClick={props.onClick}
      class="bg-card hover:bg-card/80 group relative overflow-hidden rounded-lg transition-colors"
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
        </div>
      </div>
    </button>
  );
}

type Props = {
  initialSearch?: string;
  targetId: string;
  contentType: Schemas["ContentType"];
  onClose?: () => void;
};

export default function FixMetadata(props: Props) {
  let notificator = useNotifications();
  let dialog: HTMLDialogElement;
  let [search, deferredSearch, setSearch] = useDebounce(
    500,
    props.initialSearch ?? "",
  );

  let searchResult = createAsync(async () => {
    return server.GET("/api/search/content", {
      params: { query: { search: deferredSearch() } },
    });
  });

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
    dialog.close();
    props.onClose && props.onClose();
  }

  onMount(() => dialog.showModal());

  return (
    <Modal size="xl" onClose={props.onClose} ref={dialog!}>
      <div>
        <div>
          <input
            class="input input-md text-black"
            onInput={(e) => setSearch(e.currentTarget.value)}
            value={search()}
            placeholder={props.initialSearch}
          />
        </div>
        <div>
          <Show when={searchResult()?.data}>
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
        </div>
      </div>
    </Modal>
  );
}
