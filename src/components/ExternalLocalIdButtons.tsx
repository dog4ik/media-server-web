import { Schemas } from "@/utils/serverApi";
import { For, Show, Suspense } from "solid-js";
import ProviderLogo from "./ProviderLogo";
import { Link, linkOptions } from "@tanstack/solid-router";
import { Skeleton } from "@/ui/skeleton";
import { queryApi } from "@/utils/queryApi";

type Props = {
  id: string;
  provider: Schemas["MetadataProvider"];
} & ({ contentType: "movie" } | { contentType: "show"; season?: number });

export function ExternalLocalIdButtons(props: Props) {
  function navigationUrl(provider: Schemas["MetadataProvider"], id: string) {
    if (props.contentType === "movie") {
      return linkOptions({
        to: "/movies/$id",
        params: { id },
        search: { provider },
      });
    } else {
      return linkOptions({
        to: "/shows/$id",
        params: { id },
        search: { provider, season: props.season },
      });
    }
  }

  let ids = queryApi.useQuery(
    "get",
    "/api/external_ids/{id}",
    () => ({
      params: {
        path: { id: props.id },
        query: { provider: props.provider, content_type: props.contentType },
      },
    }),
    () => ({
      throwOnError: false,
      select: (v) => [...v, { provider: props.provider, id: props.id }],
    }),
  );

  return (
    <Suspense
      fallback={[...Array(2)].map(() => (
        <Skeleton class="h-10 w-10 rounded-md p-1" />
      ))}
    >
      <For each={ids.data}>
        {(id) => (
          <Show
            when={
              id.provider == "local" ||
              id.provider == "tmdb" ||
              id.provider == "tvdb"
            }
          >
            <Link class="h-10 w-10 p-1" {...navigationUrl(id.provider, id.id)}>
              <ProviderLogo provider={id.provider} />
            </Link>
          </Show>
        )}
      </For>
    </Suspense>
  );
}
