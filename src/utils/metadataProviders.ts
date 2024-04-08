import { useLocation, useParams } from "@solidjs/router";
import { MetadataProvider } from "./serverApi";
import { UnknownProviderError } from "./errors";

// Gets provider from url
export function useProvider(): [() => string, () => MetadataProvider] {
  let params = useParams();
  let location = useLocation();
  let id = params.id;
  let provider = location.query.provider;
  if (id === undefined) {
    throw new UnknownProviderError("Id is not provided");
  }
  if (provider === undefined) {
    return [() => params.id, () => "local" as MetadataProvider];
  }
  if (provider !== "local" && provider !== "tmdb" && provider !== "imdb") {
    throw new UnknownProviderError(`Unknown provider: ${provider}`);
  }
  return [() => params.id, () => location.query.provider as MetadataProvider];
}
