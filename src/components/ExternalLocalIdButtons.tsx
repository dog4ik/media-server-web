import { Schemas } from "@/utils/serverApi";
import { For, Show } from "solid-js";
import ProviderLogo from "./ProviderLogo";
import { Link, linkOptions } from "@tanstack/solid-router";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/ui/tooltip";
import { buttonVariants } from "@/ui/button";

type Props = {
  id: string;
  current_provider: Schemas["MetadataProvider"];
  ids: Schemas["ExternalIdMetadata"][];
} & ({ contentType: "movie" } | { contentType: "show"; season?: number });

const PROVIDER_LABELS: Partial<Record<Schemas["MetadataProvider"], string>> = {
  local: "Local library",
  tmdb: "TMDB",
  tvdb: "TVDB",
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
        search: { provider, season: props.season },
      });
    }
  }

  return (
    <For each={props.ids}>
      {(id) => (
        <Show when={id.provider == "local" || id.provider == "tmdb" || id.provider == "tvdb"}>
          <Tooltip>
            <TooltipTrigger
              as={Link}
              class={buttonVariants({ variant: "secondary", size: "icon-lg" }) + " p-1"}
              {...(navigationUrl(id.provider, id.id) as object)}
            >
              <ProviderLogo provider={id.provider} />
            </TooltipTrigger>
            <TooltipContent>
              <p>{PROVIDER_LABELS[id.provider] ?? id.provider}</p>
            </TooltipContent>
          </Tooltip>
        </Show>
      )}
    </For>
  );
}
