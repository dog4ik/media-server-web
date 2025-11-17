import createFetchClient from "openapi-fetch";
import { QueryClient } from "@tanstack/solid-query";
import { paths } from "server-types";
import createClient from "./openapiQuery";
import { MEDIA_SERVER_URL } from "./serverApi";

export const queryClient = new QueryClient();

const fetchClient = createFetchClient<paths>({
  baseUrl: MEDIA_SERVER_URL,
});

export const queryApi = createClient(fetchClient);
