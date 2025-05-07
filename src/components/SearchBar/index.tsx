import { FiX } from "solid-icons/fi";
import { For, Match, Show, Switch, onCleanup, onMount } from "solid-js";
import { Schemas, server } from "../../utils/serverApi";
import { A, createAsync, useBeforeLeave, useNavigate } from "@solidjs/router";
import ProviderLogo from "../generic/ProviderLogo";
import useDebounce from "../../utils/useDebounce";
import { TextField, TextFieldRoot } from "@/ui/textfield";
import { capitalize } from "@/utils/formats";

function SearchContent(props: {
  result: Schemas["MetadataSearchResult"];
  onClick: () => void;
}) {
  return (
    <A
      onClick={props.onClick}
      href={`/${props.result.content_type}s/${props.result.metadata_id}?provider=${props.result.metadata_provider}`}
      class="flex h-32 items-center gap-2 bg-background p-2 px-2 text-start"
    >
      <img
        class="aspect-poster h-full basis-20 object-cover"
        src={props.result.poster || "/no-photo.png"}
        width={40}
        height={80}
        alt={`Search ${props.result.content_type} poster`}
      />
      <div class="flex flex-1 flex-col gap-2">
        <span class="truncate text-lg">{props.result.title}</span>
        <span class="truncate text-xs">
          {capitalize(props.result.content_type)}
        </span>
        <Show when={props.result.plot}>
          {(plot) => (
            <p title={plot()} class="line-clamp-3">
              {plot()}
            </p>
          )}
        </Show>
      </div>
      <div class="h-6 w-10">
        <ProviderLogo provider={props.result.metadata_provider} />
      </div>
    </A>
  );
}

function SearchLoading() {
  return (
    <div class="flex h-full w-full flex-1 items-center justify-center">
      <span class="loading loading-dots loading-md">Loading</span>
    </div>
  );
}

export default function SearchBar() {
  let [input, deferredInput, setInput] = useDebounce(500, "");
  let navigator = useNavigate();

  let searchAbortController: AbortController | undefined = undefined;

  let searchResult = createAsync(async () => {
    let abortController = new AbortController();
    let signal = abortController.signal;
    searchAbortController = abortController;
    if (!deferredInput()) return undefined;
    return await server
      .GET("/api/search/content", {
        params: { query: { search: deferredInput() } },
        signal,
      })
      .catch(() => {
        if (searchAbortController?.signal.aborted) {
          console.log("Aborted content search request");
        }
      });
  });

  let windowRef: HTMLDivElement = {} as any;
  let inputRef: HTMLInputElement = {} as any;

  function handleClick(e: MouseEvent) {
    let target = e.target as Element;
    if (windowRef?.contains(target) || inputRef.contains(target)) {
      e.preventDefault();
    } else {
      windowRef.hidePopover();
    }
  }

  function handleSubmit() {
    navigator(`/search?query=${input()}`);
  }

  onMount(() => {
    windowRef.hidePopover();
    document.addEventListener("click", handleClick);
  });
  onCleanup(() => {
    document.removeEventListener("click", handleClick);
  });

  useBeforeLeave(() => {
    windowRef.hidePopover();
    inputRef.blur();
  });

  return (
    <div class="relative w-full items-center gap-2">
      <form
        class="relative w-full"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <label class="input input-sm input-bordered flex items-center gap-2 text-black">
          <TextFieldRoot class="relative w-full">
            <TextField
              ref={inputRef!}
              onInput={(e) => {
                if (searchAbortController) {
                  searchAbortController.abort();
                }
                setInput(e.currentTarget.value);
              }}
              onFocus={() => windowRef.showPopover()}
              onKeyPress={(e: { key: string }) => {
                if (e.key == "Enter") {
                  handleSubmit();
                }
              }}
              type="text"
              class="grow bg-white"
              placeholder="Search shows and movies"
              value={input()}
            />
            <Show when={input().length > 0}>
              <button
                onClick={() => {
                  inputRef.focus();
                  setInput("");
                }}
                class="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-2/3 items-center justify-center rounded-full bg-stone-50 text-black transition-colors hover:bg-stone-300"
              >
                <FiX />
              </button>
            </Show>
          </TextFieldRoot>
        </label>
      </form>
      <div
        ref={windowRef!}
        class={`m-0 h-2/3 w-2/3 translate-y-16 bg-background open:absolute ${input() ? "text-white backdrop-blur-2xl" : "hidden"}`}
        popover="manual"
      >
        <Show when={searchResult()?.data} fallback={<SearchLoading />}>
          {(data) => (
            <Switch>
              <Match when={data().length > 0}>
                <div class="divide-y overflow-y-auto">
                  <For each={data()}>
                    {(item) => (
                      <SearchContent
                        result={item}
                        onClick={() => windowRef.hidePopover()}
                      />
                    )}
                  </For>
                </div>
              </Match>
              <Match when={data().length === 0}>
                <div>No results</div>
              </Match>
            </Switch>
          )}
        </Show>
      </div>
    </div>
  );
}
