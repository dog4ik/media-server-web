import { FiSearch, FiX } from "solid-icons/fi";
import {
  For,
  Match,
  Show,
  Suspense,
  Switch,
  onCleanup,
  onMount,
} from "solid-js";
import { Schemas, server } from "../../utils/serverApi";
import { A, createAsync, useBeforeLeave } from "@solidjs/router";
import ProviderLogo from "../generic/ProviderLogo";
import useDebounce from "../../utils/useDebounce";

function SearchContent(props: {
  result: Schemas["MetadataSearchResult"];
  onClick: () => void;
}) {
  return (
    <A
      onClick={props.onClick}
      href={`/${props.result.content_type}s/${props.result.metadata_id}?provider=${props.result.metadata_provider}`}
      class="flex h-32 items-center gap-2 text-start transition-colors hover:bg-white/10"
    >
      <img
        class="h-full w-24 object-cover"
        src={props.result.poster ?? "/empty_image.svg"}
      />
      <div class="flex w-2/3 flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="truncate text-xl">{props.result.title}</span>
          <div class="h-6 w-10">
            <ProviderLogo provider={props.result.metadata_provider} />
          </div>
        </div>
        <Show when={props.result.plot}>
          {(plot) => (
            <p title={plot()} class="line-clamp-3">
              {plot()}
            </p>
          )}
        </Show>
      </div>
    </A>
  );
}

function SearchLoading() {
  return (
    <div class="flex h-full w-full flex-1 items-center justify-center">
      <span class="loading loading-dots loading-md"></span>
    </div>
  );
}

export default function Search() {
  let [input, deferredInput, setInput] = useDebounce(500, "");

  let searchResult = createAsync(async () => {
    if (!deferredInput()) return undefined;
    return await server.GET("/api/search/content", {
      params: { query: { search: deferredInput() } },
    });
  });

  let windowRef: HTMLDivElement;
  let inputRef: HTMLInputElement;

  function handleClick(e: MouseEvent) {
    let target = e.target as Element;
    if (windowRef?.contains(target) || inputRef.contains(target)) {
      e.preventDefault();
    } else {
      windowRef.hidePopover();
    }
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
    <div class="relative flex h-full w-2/3 flex-col items-center gap-2">
      <form
        class="relative w-full"
        style={`
anchor-name: --search;
`}
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <label class="input input-sm input-bordered flex items-center gap-2 text-black">
          <FiSearch size={16} />
          <input
            ref={inputRef!}
            onInput={(e) => setInput(e.currentTarget.value)}
            onFocus={() => windowRef.showPopover()}
            type="text"
            class="grow"
            placeholder="Search shows and movies"
            value={input()}
          />
        </label>
        <Show when={input().length > 0}>
          <button
            onClick={() => {
              inputRef.focus();
              setInput("");
            }}
            class="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-stone-50 text-black transition-colors hover:bg-stone-300"
          >
            <FiX />
          </button>
        </Show>
      </form>
      <div
        ref={windowRef!}
        class={`ml-0 mt-0 h-2/3 w-1/3 bg-transparent ${input() ? "text-white backdrop-blur-2xl" : "hidden"}`}
        popover="manual"
        style={`
position-anchor: --search;
position-area: bottom;
`}
      >
        <Show when={searchResult()?.data} fallback={<SearchLoading />}>
          {(data) => (
            <Switch>
              <Match when={data().length > 0}>
                <div class="flex-col overflow-y-auto">
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
