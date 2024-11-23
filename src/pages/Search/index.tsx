import ProviderLogo from "@/components/generic/ProviderLogo";
import PageTitle from "@/components/PageTitle";
import { capitalize } from "@/utils/formats";
import { Schemas, server } from "@/utils/serverApi";
import { A, createAsync, useLocation } from "@solidjs/router";
import { For, Show } from "solid-js";

type SearchResultProps = {
  item: Schemas["MetadataSearchResult"];
};

function SearchResultRow(props: SearchResultProps) {
  let url = () => {
    let appendix = `/${props.item.metadata_id}?provider=${props.item.metadata_provider}`;
    if (props.item.content_type == "movie") {
      return `/movies${appendix}`;
    }
    if (props.item.content_type == "show") {
      return `/shows/${appendix}`;
    }
    throw Error(`Unknown content type: ${props.item.content_type}`);
  };
  return (
    <A
      href={url()}
      class="flex w-full items-center gap-6 p-2 transition-colors hover:bg-white/10"
    >
      <img
        class="aspect-poster h-40"
        src={props.item.poster || "/no-photo.png"}
      />
      <div class="flex flex-1 flex-col gap-1">
        <span class="font-bold">{props.item.title}</span>
        <span class="text-xs">{capitalize(props.item.content_type)}</span>
        <Show when={props.item.plot}>
          {(p) => <p class="line-clamp-3 text-sm">{p()}</p>}
        </Show>
      </div>
      <div class="h-10 w-10">
        <ProviderLogo provider={props.item.metadata_provider} />
      </div>
    </A>
  );
}

function searchQuery() {
  let query = useLocation().query.query;
  if (Array.isArray(query)) {
    return query[0];
  }
  return query;
}

export default function SearchPage() {
  let query = () => searchQuery();
  let searchResults = createAsync(() =>
    server.GET("/api/search/content", {
      params: { query: { search: searchQuery() } },
    }),
  );

  return (
    <div>
      <PageTitle>Search results for: {query()}</PageTitle>
      <For each={searchResults()?.data}>
        {(res) => <SearchResultRow item={res} />}
      </For>
    </div>
  );
}
