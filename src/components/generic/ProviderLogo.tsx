import { Match, Switch } from "solid-js";
import { Schemas } from "../../utils/serverApi";

type Props = {
  provider: Schemas["MetadataProvider"];
};

export default function ProviderLogo(props: Props) {
  return (
    <Switch fallback={<img src="/empty_image.svg" />}>
      <Match when={props.provider === "tmdb"}>
        <img src="/tmdb.svg" alt="tmdb logo" title="TMDB" />
      </Match>
      <Match when={props.provider === "tvdb"}>
        <img src="/tvdb.png" alt="tvdb logo" title="TVDB" />
      </Match>
      <Match when={props.provider === "local"}>
        <img src="/local.svg" alt="local logo" title="local" />
      </Match>
    </Switch>
  );
}
