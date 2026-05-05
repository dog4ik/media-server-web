import createFetchClient, { ParamsOption, Middleware } from "openapi-fetch";
import type { components, paths } from "server-types";
import tracing from "./tracing";
import { BadRequestError, InternalServerError, NotFoundError, UnavailableError } from "./errors";

export function formatCodec<T extends string | { other: string }>(codec: T): string {
  return typeof codec == "object" ? codec.other : codec;
}

export const MEDIA_SERVER_URL: string = import.meta.env.PROD
  ? `${window.location.protocol}//${window.location.host}`
  : import.meta.env.VITE_MEDIA_SERVER_URL;

export const server = createFetchClient<paths>({
  baseUrl: MEDIA_SERVER_URL,
});

const serverErrorMiddleware: Middleware = {
  async onResponse({ response }) {
    async function errorMessage() {
      try {
        let json = await response.clone().json();
        let message = json["message"];
        if (typeof message !== "string") {
          throw Error("Message is empty");
        }
        return message;
      } catch {
        return "";
      }
    }
    let message = await errorMessage();
    if (response.status === 404) {
      throw new NotFoundError(message);
    }
    if (response.status === 400) {
      throw new BadRequestError(message);
    }
    if (response.status === 500) {
      throw new InternalServerError(message);
    }
  },

  async onError() {
    return new UnavailableError("Network error");
  },
};

server.use(serverErrorMiddleware);

export type LogLevel = "INFO" | "ERROR" | "DEBUG" | "TRACE";

export type Schemas = components["schemas"];

export type GetPaths = {
  [Pathname in keyof paths]: paths[Pathname] extends {
    [K in "get"]: any;
  }
    ? Pathname
    : never;
}[keyof paths];

export async function revalidatePath(path: GetPaths) {
  tracing.error({ path }, "NOT Revalidating path");
  // await revalidate(path);
}

export function fullUrl<T extends GetPaths>(
  path: T,
  args: ParamsOption<paths[T]["get"]>["params"],
) {
  let parts = path.split("/").filter(Boolean);
  let url = new URL(MEDIA_SERVER_URL);
  for (let part of parts) {
    if (!url.pathname.endsWith("/")) {
      url.pathname += "/";
    }
    if (args && "path" in args && part.startsWith("{") && part.endsWith("}")) {
      let param = part.substring(1, part.length - 1) as keyof typeof args.path;
      url.pathname += args.path![param];
    } else {
      url.pathname += part;
    }
  }
  if (args && "query" in args && args.query) {
    for (let [key, val] of Object.entries(args.query)) {
      url.searchParams.append(key, val as string);
    }
  }
  return url.toString();
}
