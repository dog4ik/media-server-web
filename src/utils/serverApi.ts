import { cache, revalidate } from "@solidjs/router";

import createClient, { ClientMethod, ParamsOption } from "openapi-fetch";
import type { components, paths } from "./server-types";

const currentProtocol = window.location.protocol;
const currentHost = window.location.host;
const currentBaseUrl = `${currentProtocol}//${currentHost}`;

export const MEDIA_SERVER_URL: string =
  import.meta.env.VITE_MEDIA_SERVER_URL ?? currentBaseUrl;

const client = createClient<paths>({
  baseUrl: MEDIA_SERVER_URL,
});

type Media = `${string}/${string}`;

export type LogLevel = "INFO" | "ERROR" | "DEBUG" | "TRACE";

export type LogMessage = {
  fields: {
    message: string;
  };
  level: LogLevel;
  timestamp: string;
  target: string;
};

export type Schemas = components["schemas"];

const cacheMap: {
  [key in keyof paths]?: ClientMethod<paths, "get", Media>;
} = {};

export const server: typeof client = {
  ...client,
  GET(path, ...rest) {
    let func = cacheMap[path];
    if (func === undefined) {
      func = cache((p, ...args) => {
        return client.GET(p, ...args);
      }, path);
      cacheMap[path] = func;
    }
    return func!(path, ...rest);
  },
};

export type GetPaths = {
  [Pathname in keyof paths]: paths[Pathname] extends {
    [K in "get"]: any;
  }
  ? Pathname
  : never;
}[keyof paths];

export async function revalidatePath(path: GetPaths) {
  await revalidate(path);
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
      url.pathname += args.path[param];
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
