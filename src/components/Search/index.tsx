import { FiSearch } from "solid-icons/fi";
import {
  For,
  Show,
  Suspense,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import { Schemas, server } from "../../utils/serverApi";
import { A, createAsync, useBeforeLeave, useNavigate } from "@solidjs/router";
import ProviderLogo from "../generic/ProviderLogo";

const DATA = [
  {
    title: "Halo",
    poster:
      "https://image.tmdb.org/t/p/w342/%2FhmHA5jqxN3ESIAGx0jAwV7TJhTQ.jpg",
    plot: "Depicting an epic 26th-century conflict between humanity and an alien threat known as the Covenant, the series weaves deeply drawn personal stories with action, adventure and a richly imagined vision of the future.",
    tmdb_id: 52814,
  },
  {
    title: "Halo",
    poster:
      "https://image.tmdb.org/t/p/w342/%2F90jgxI5Co5f9lAaSGNcJthouhiS.jpg",
    plot: "A lonely taxi driver takes drastic action to protect a customer from heartbreak.",
    tmdb_id: 770523,
  },
  {
    title: "Halo",
    poster:
      "https://image.tmdb.org/t/p/w342/%2FhPryt4BtO06cjCZWHw3scrVoYtx.jpg",
    plot: "Rinko Kawauchi's exploration of the cadences of the everyday has begun to swing farther afield from her earlier photographs focusing on tender details of day-to-day living.",
    tmdb_id: 978355,
  },
  {
    title: "Halo",
    poster: null,
    plot: "Story of a little girl who is searching for her lost puppy in the streets of Bombay and the variety of people that she meets.",
    tmdb_id: 305649,
  },
];

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

export default function Search() {
  let [input, setInput] = createSignal("");
  let [defferedInput, setDefferedInput] = createSignal("");
  let [isOpen, setIsOpen] = createSignal(false);
  let navigate = useNavigate();

  let timeout: ReturnType<typeof setTimeout> | null = null;

  let searchResult = createAsync(() =>
    server.GET("/api/search/content", {
      params: { query: { search: defferedInput() } },
    }),
  );

  function handleInput(val: string) {
    setInput(val);

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      setDefferedInput(input());
    }, 500);
  }

  let windowRef: HTMLDivElement;
  let inputRef: HTMLInputElement;

  function onSumbit() {
    if (input()) {
      navigate(`/search?q=${encodeURIComponent(input())}`);
    }
  }

  function handleClick(e: MouseEvent) {
    let target = e.target as Element;
    if (windowRef?.contains(target) || inputRef.contains(target)) {
      e.preventDefault();
    } else {
      setIsOpen(false);
    }
  }

  onMount(() => {
    document.addEventListener("click", handleClick);
  });
  onCleanup(() => {
    document.removeEventListener("click", handleClick);
  });

  useBeforeLeave(() => {
    setIsOpen(false);
    inputRef.blur();
  });

  return (
    <div class="full relative flex h-full w-2/3 flex-col items-center gap-2">
      <form
        class="w-full"
        onSubmit={(e) => {
          e.preventDefault();
          onSumbit();
        }}
      >
        <div class="input input-bordered flex w-full items-center gap-2">
          <input
            ref={inputRef!}
            onInput={(e) => handleInput(e.currentTarget.value)}
            onFocus={() => setIsOpen(true)}
            type="text"
            class="w-full grow text-black"
            placeholder="Search"
            value={input()}
          />
          <button>
            <FiSearch size={30} stroke="black" />
          </button>
        </div>
      </form>
      <Show when={isOpen()}>
        <div
          ref={windowRef!}
          class="absolute bottom-0 flex max-h-96 translate-y-full flex-col overflow-hidden overflow-y-auto bg-transparent backdrop-blur-2xl"
        >
          <Suspense fallback={<div>Loading...</div>}>
            <For each={searchResult()?.data}>
              {(item) => (
                <SearchContent result={item} onClick={() => setIsOpen(false)} />
              )}
            </For>
          </Suspense>
        </div>
      </Show>
    </div>
  );
}
