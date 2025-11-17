import { Schemas, server } from "@/utils/serverApi";
import { For, Show, Suspense } from "solid-js";
import ProviderLogo from "./generic/ProviderLogo";
import { useQuery } from "@tanstack/solid-query";
import { Link, linkOptions } from "@tanstack/solid-router";
import { Skeleton } from "@/ui/skeleton";

type Props = {
  id: string;
  provider: Schemas["MetadataProvider"];
  contentType: Schemas["ContentType"];
};

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
        search: { provider },
      });
    }
  }

  let ids = useQuery(() => ({
    queryFn: async () => {
      if (props.provider == "local") {
        return server
          .GET("/api/external_ids/{id}", {
            params: {
              query: {
                provider: "local",
                content_type: props.contentType,
              },
              path: {
                id: props.id,
              },
            },
          })
          .then((d) => d.data);
      } else {
        return server
          .GET("/api/external_to_local/{id}", {
            params: {
              query: {
                provider: props.provider,
              },
              path: {
                id: props.id,
              },
            },
          })
          .then((r) => r.data)
          .then((r) => {
            if (props.contentType == "show" && r?.show_id) {
              return [
                { provider: "local", id: r.show_id.toString() },
              ] as Schemas["ExternalIdMetadata"][];
            } else if (props.contentType == "movie" && r?.movie_id) {
              return [
                { provider: "local", id: r.movie_id.toString() },
              ] as Schemas["ExternalIdMetadata"][];
            }
            return [] as Schemas["ExternalIdMetadata"][];
          });
      }
    },
    queryKey: [
      "external_to_local",
      props.contentType,
      props.provider,
      props.id,
    ],
  }));

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
