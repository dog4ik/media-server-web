import { QueryClient } from "@tanstack/solid-query";
import createClient from "./openapiQuery";
import { server } from "./serverApi";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, throwOnError: true, retry: 1 },
  },
});

export const queryApi = createClient(server);
