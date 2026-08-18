import HardDrive from "lucide-solid/icons/hard-drive";
import { Match, Switch } from "solid-js";
import type { Schemas } from "../utils/serverApi";

type Props = {
  provider: Schemas["MetadataProvider"];
};

export default function ProviderLogo(props: Props) {
  return (
    <Switch fallback={<img src="/empty_image.svg" alt="" />}>
      <Match when={props.provider === "tmdb"}>
        <img src="/tmdb.svg" alt="tmdb logo" title="TMDB" />
      </Match>
      <Match when={props.provider === "tvdb"}>
        <img src="/tvdb.png" alt="tvdb logo" title="TVDB" />
      </Match>
      <Match when={props.provider === "local"}>
        <span title="local">
          <HardDrive size={30} />
        </span>
      </Match>
    </Switch>
  );
}
