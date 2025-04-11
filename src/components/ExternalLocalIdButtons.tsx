import { Button } from "@/ui/button";
import { throwResponseErrors } from "@/utils/errors";
import { Schemas, server } from "@/utils/serverApi";
import { createAsync, useLocation } from "@solidjs/router";
import { For, Show } from "solid-js";
import ProviderLogo from "./generic/ProviderLogo";

type Props = {
  id: string;
  provider: Schemas["MetadataProvider"];
  contentType: Schemas["ContentType"];
};

export default function ExternalLocalIdButtons(props: Props) {
  let location = useLocation();
  function navigationUrl(provider: Schemas["MetadataProvider"], id: string) {
    let path = location.pathname.split("/");
    let params = new URLSearchParams(location.search);
    if (path.length < 3) {
      throw Error("movie/show path must have more then 3 components")
    }
    path[2] = id;
    params.set("provider", provider);
    return path.join("/") + "?" + params.toString()
  }
  let ids = createAsync<
    {
      id: string;
      provider: Schemas["MetadataProvider"];
    }[]
  >(async () => {
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
        .then(throwResponseErrors);
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
        .then((d) => d.data)
        .then((r) => {
          if (props.contentType == "show" && r?.show_id) {
            return [{ provider: "local", id: r.show_id.toString() }];
          } else if (props.contentType == "movie" && r?.movie_id) {
            return [{ provider: "local", id: r.movie_id.toString() }];
          }
          return [];
        });
    }
  });

  return (
    <For each={ids()}>
      {(id) => (
        <Show
          when={
            id.provider == "local" ||
            id.provider == "tmdb" ||
            id.provider == "tvdb"
          }
        >
          <Button as="a" href={navigationUrl(id.provider, id.id)} class="p-1 h-10 w-10">
            <ProviderLogo provider={id.provider} />
          </Button>
        </Show>
      )}
    </For>
  );
}
