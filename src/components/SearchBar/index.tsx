import { FiX } from "solid-icons/fi";
import { For, Match, Show, Switch, createSignal } from "solid-js";
import { Schemas } from "../../utils/serverApi";
import ProviderLogo from "../ProviderLogo";
import useDebounce from "../../utils/useDebounce";
import { TextField, TextFieldInput } from "@/ui/textfield";
import { Button } from "@/ui/button";
import { Skeleton } from "@/ui/skeleton";
import { capitalize } from "@/utils/formats";
import { Link, useNavigate } from "@tanstack/solid-router";
import { queryApi } from "@/utils/queryApi";

function SearchResultItem(props: {
  result: Schemas["MetadataSearchResult"];
  onSelect: () => void;
}) {
  const linkClass =
    "flex h-20 items-center gap-3 rounded-sm px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground";

  return (
    <Switch>
      <Match when={props.result.content_type === "show"}>
        <Link
          to="/shows/$id"
          class={linkClass}
          onClick={props.onSelect}
          search={{ provider: props.result.metadata_provider }}
          params={{ id: props.result.metadata_id }}
        >
          <ResultContent result={props.result} />
        </Link>
      </Match>
      <Match when={props.result.content_type === "movie"}>
        <Link
          to="/movies/$id"
          class={linkClass}
          search={{ provider: props.result.metadata_provider }}
          params={{ id: props.result.metadata_id }}
          onClick={props.onSelect}
        >
          <ResultContent result={props.result} />
        </Link>
      </Match>
    </Switch>
  );
}

function ResultContent(props: { result: Schemas["MetadataSearchResult"] }) {
  return (
    <>
      <img
        class="aspect-poster h-full w-12 flex-none rounded object-cover"
        src={props.result.poster || "/no-photo.png"}
        alt={`${props.result.title} poster`}
      />
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium">{props.result.title}</p>
        <p class="text-muted-foreground text-xs">{capitalize(props.result.content_type)}</p>
        <Show when={props.result.plot}>
          {(plot) => <p class="text-muted-foreground line-clamp-2 text-xs">{plot()}</p>}
        </Show>
      </div>
      <div class="h-5 w-8 flex-none">
        <ProviderLogo provider={props.result.metadata_provider} />
      </div>
    </>
  );
}

function SearchResultsSkeleton() {
  return (
    <div class="space-y-1 p-1">
      <For each={[0, 1, 2]}>
        {() => (
          <div class="flex h-20 items-center gap-3 px-3 py-2">
            <Skeleton class="h-full w-12 rounded" />
            <div class="flex-1 space-y-2">
              <Skeleton class="h-4 w-2/3 rounded" />
              <Skeleton class="h-3 w-1/3 rounded" />
            </div>
          </div>
        )}
      </For>
    </div>
  );
}

export default function SearchBar() {
  let [input, deferredInput, setInput] = useDebounce(500, "");
  let [open, setOpen] = createSignal(false);
  let navigator = useNavigate();
  let containerRef!: HTMLDivElement;
  let inputRef!: HTMLInputElement;

  let searchResult = queryApi.useQuery("get", "/api/search/content", () => ({
    params: { query: { search: deferredInput() } },
  }));

  function handleFocusOut(e: FocusEvent) {
    if (!containerRef.contains(e.relatedTarget as Element)) {
      setOpen(false);
    }
  }

  function handleSubmit() {
    setOpen(false);
    navigator({ to: "/search", search: { provider: "local", search: input() } });
  }

  function handleSelect() {
    setOpen(false);
    setInput("");
  }

  return (
    <div ref={containerRef} class="relative w-full" onFocusOut={handleFocusOut}>
      <form
        class="relative"
        autocomplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <TextField class="w-full">
          <TextFieldInput
            ref={inputRef}
            type="text"
            placeholder="Search shows and movies"
            value={input()}
            class="w-full pr-8"
            onInput={(e) => setInput(e.currentTarget.value)}
            onFocus={() => setOpen(true)}
          />
          <Show when={input().length > 0}>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setInput("");
                inputRef.focus();
              }}
              class="absolute top-1/2 right-1 -translate-y-1/2"
              aria-label="Clear search"
            >
              <FiX />
            </Button>
          </Show>
        </TextField>
      </form>

      <Show when={open() && input().length > 0}>
        <div class="bg-popover text-popover-foreground absolute top-full z-50 mt-1 w-full overflow-hidden rounded-md border shadow-md">
          <Show when={searchResult?.latest()} fallback={<SearchResultsSkeleton />}>
            {(data) => (
              <Switch>
                <Match when={data().length > 0}>
                  <div class="max-h-96 divide-y overflow-y-auto p-1">
                    <For each={data()}>
                      {(item) => <SearchResultItem result={item} onSelect={handleSelect} />}
                    </For>
                  </div>
                </Match>
                <Match when={data().length === 0}>
                  <p class="text-muted-foreground p-6 text-center text-sm">No results found</p>
                </Match>
              </Switch>
            )}
          </Show>
        </div>
      </Show>
    </div>
  );
}
