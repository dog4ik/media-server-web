import ProviderLogo from "@/components/generic/ProviderLogo";
import PageTitle from "@/components/PageTitle";
import { BaseError } from "@/utils/errors";
import { capitalize } from "@/utils/formats";
import { queryApi } from "@/utils/queryApi";
import { Schemas } from "@/utils/serverApi";
import { getRouteApi, Link, linkOptions } from "@tanstack/solid-router";
import { For, Match, Show, Suspense, Switch } from "solid-js";

type SearchResultProps = {
  item: Schemas["MetadataSearchResult"];
};

function SearchResultRow(props: SearchResultProps) {
  let url = () => {
    if (props.item.content_type == "movie") {
      return linkOptions({
        to: "/movies/$id",
        params: { id: props.item.metadata_id },
        search: { provider: props.item.metadata_provider },
      });
    }
    if (props.item.content_type == "show") {
      return linkOptions({
        to: "/shows/$id",
        params: { id: props.item.metadata_id },
        search: { provider: props.item.metadata_provider },
      });
    }
    throw Error(`Uhnandled content type: ${props.item.content_type}`);
  };
  return (
    <Link
      class="flex w-full items-center gap-6 p-2 transition-colors hover:bg-white/10"
      {...url()}
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
    </Link>
  );
}

function SearchLoading() {
  return (
    <div class="flex size-full items-center justify-center">
      <span class="text-2xl">Loading</span>
    </div>
  );
}

function SearchNoResults() {
  return (
    <div class="flex size-full items-center justify-center">
      <span class="text-2xl">No results</span>
    </div>
  );
}

function SearchError(props: { e: any }) {
  return (
    <div class="flex size-full items-center justify-center">
      <Switch fallback={<span class="text-2xl">Search request failed</span>}>
        <Match when={props.e instanceof BaseError}>
          <span class="text-2xl">
            Search request failed: {(props.e as BaseError).message}
          </span>
        </Match>
      </Switch>
    </div>
  );
}

export default function SearchPage() {
  let route = getRouteApi("/page/search");
  let search = route.useSearch();
  let searchResults = queryApi.useQuery("get", "/api/search/content", () => ({
    params: { query: { search: search().search } },
  }));

  return (
    <div>
      <PageTitle>Search results for: {search().search}</PageTitle>
      <div>
        <Suspense fallback={<SearchLoading />}>
          <For fallback={<SearchNoResults />} each={searchResults.latest()}>
            {(res) => <SearchResultRow item={res} />}
          </For>
        </Suspense>
      </div>
    </div>
  );
}
