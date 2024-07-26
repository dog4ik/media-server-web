import { useLocation, useParams } from "@solidjs/router";
import { Schemas } from "./serverApi";
import { UnknownProviderError } from "./errors";

// Gets provider from url
export function useProvider(): [
  () => string,
  () => Schemas["MetadataProvider"],
] {
  let params = useParams();
  let location = useLocation();
  let id = params.id;
  if (id === undefined) {
    throw new UnknownProviderError("Id is not provided");
  }
  return [
    () => params.id,
    () => {
      if (location.query.provider === undefined) {
        return "local";
      } else {
        return location.query.provider as Schemas["MetadataProvider"];
      }
    },
  ];
}
