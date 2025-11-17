import createClient, { ClientMethod, ParamsOption } from "openapi-fetch";
import type { components, paths } from "server-types";
import tracing from "./tracing";

export function formatCodec<T extends string | { other: string }>(
  codec: T,
): string {
  return typeof codec == "object" ? codec.other : codec;
}

export const MEDIA_SERVER_URL: string = import.meta.env.PROD
  ? `${window.location.protocol}//${window.location.host}`
  : import.meta.env.VITE_MEDIA_SERVER_URL;

const client = createClient<paths>({
  baseUrl: MEDIA_SERVER_URL,
});

type Media = `${string}/${string}`;

export type LogLevel = "INFO" | "ERROR" | "DEBUG" | "TRACE";

export type Schemas = components["schemas"];

const cacheMap: {
  // @ts-expect-error
  [key in keyof paths]?: ClientMethod<paths, "get", Media>;
} = {};

export const server: typeof client = {
  ...client,
};

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
