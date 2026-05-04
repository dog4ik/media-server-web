import { Schemas } from "@/utils/serverApi";
import { For, Show } from "solid-js";
import ProviderLogo from "./ProviderLogo";
import { Link, linkOptions } from "@tanstack/solid-router";

type Props = {
  id: string;
  current_provider: Schemas["MetadataProvider"];
  ids: Schemas["ExternalIdMetadata"][];
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

  return (
    <For each={props.ids}>
      {(id) => (
        <Show when={id.provider == "local" || id.provider == "tmdb" || id.provider == "tvdb"}>
          <Link class="h-10 w-10 p-1" {...navigationUrl(id.provider, id.id)}>
            <ProviderLogo provider={id.provider} />
          </Link>
        </Show>
      )}
    </For>
  );
}
