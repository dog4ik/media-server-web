import {
  type QueryClient,
  type QueryFunctionContext,
  type SkipToken,
  type UseQueryOptions,
  type UseQueryResult,
  useQuery,
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
} from "@tanstack/solid-query";
import type {
  ClientMethod,
  Client as FetchClient,
  FetchResponse,
  MaybeOptionalInit,
} from "openapi-fetch";
import type {
  HttpMethod,
  MediaType,
  PathsWithMethod,
  RequiredKeysOf,
} from "openapi-typescript-helpers";
import { Accessor } from "solid-js";

function sleep(time: number) {
  return new Promise((res) => setTimeout(res, time));
}

// Helper type to dynamically infer the type from the `select` property
type InferSelectReturnType<TData, TSelect> = TSelect extends (
  data: TData,
) => infer R
  ? R
  : TData;

type InitWithUnknowns<Init> = Init & { [key: string]: unknown };
type Debug<T> = { [K in keyof T]: T[K] } & {};

export type QueryKey<
  Paths extends Record<string, Record<HttpMethod, {}>>,
  Method extends HttpMethod,
  Path extends PathsWithMethod<Paths, Method>,
  Init = MaybeOptionalInit<Paths[Path], Method>,
> = Init extends undefined
  ? readonly [Method, Path]
  : readonly [Method, Path, Init];

export type QueryOptionsFunction<
  Paths extends Record<string, Record<HttpMethod, {}>>,
  Media extends MediaType,
> = <
  Method extends HttpMethod,
  Path extends PathsWithMethod<Paths, Method>,
  Init extends MaybeOptionalInit<Paths[Path], Method>,
  Response extends Required<FetchResponse<Paths[Path][Method], Init, Media>>, // note: Required is used to avoid repeating NonNullable in UseQuery types
  Options extends Omit<
    ReturnType<
      UseQueryOptions<
        Response["data"],
        Response["error"],
        InferSelectReturnType<Response["data"], Options["select"]>,
        QueryKey<Paths, Method, Path>
      >
    >,
    "queryKey" | "queryFn"
  >,
>(
  method: Method,
  path: Path,
  ...[init, options]: RequiredKeysOf<Init> extends never
    ? [Accessor<InitWithUnknowns<Init>>?, Accessor<Options>?]
    : [Accessor<InitWithUnknowns<Init>>, Accessor<Options>?]
) => NoInfer<
  Accessor<
    Omit<
      ReturnType<
        UseQueryOptions<
          Response["data"],
          Response["error"],
          InferSelectReturnType<Response["data"], Options["select"]>,
          QueryKey<Paths, Method, Path>
        >
      >,
      "queryFn"
    > & {
      queryFn: Exclude<
        ReturnType<
          UseQueryOptions<
            Response["data"],
            Response["error"],
            InferSelectReturnType<Response["data"], Options["select"]>,
            QueryKey<Paths, Method, Path>
          >
        >["queryFn"],
        SkipToken | undefined
      >;
    }
  >
>;

export type UseQueryMethod<
  Paths extends Record<string, Record<HttpMethod, {}>>,
  Media extends MediaType,
> = <
  Method extends HttpMethod,
  Path extends PathsWithMethod<Paths, Method>,
  Init extends MaybeOptionalInit<Paths[Path], Method>,
  Response extends Required<FetchResponse<Paths[Path][Method], Init, Media>>, // note: Required is used to avoid repeating NonNullable in UseQuery types
  Options extends Omit<
    | ReturnType<
        DefinedInitialDataOptions<
          Response["data"],
          Response["error"],
          InferSelectReturnType<Response["data"], Options["select"]>,
          QueryKey<Paths, Method, Path>
        >
      >
    | ReturnType<
        UndefinedInitialDataOptions<
          Response["data"],
          Response["error"],
          InferSelectReturnType<Response["data"], Options["select"]>,
          QueryKey<Paths, Method, Path>
        >
      >,
    "queryKey" | "queryFn"
  >,
>(
  method: Method,
  url: Path,
  ...[init, options, queryClient]: RequiredKeysOf<Init> extends never
    ? [Accessor<InitWithUnknowns<Init>>?, Accessor<Options>?, QueryClient?]
    : [Accessor<InitWithUnknowns<Init>>, Accessor<Options>?, QueryClient?]
) => UseQueryResult<
  InferSelectReturnType<Response["data"], Options["select"]>,
  Response["error"]
> & {
  /** Access data without triggering suspense */
  latest: () =>
    | InferSelectReturnType<Response["data"], Options["select"]>
    | undefined;
};

export interface OpenapiQueryClient<
  Paths extends {},
  Media extends MediaType = MediaType,
> {
  queryOptions: QueryOptionsFunction<Paths, Media>;
  useQuery: UseQueryMethod<Paths, Media>;
}

export type MethodResponse<
  CreatedClient extends OpenapiQueryClient<any, any>,
  Method extends HttpMethod,
  Path extends CreatedClient extends OpenapiQueryClient<
    infer Paths,
    infer _Media
  >
    ? PathsWithMethod<Paths, Method>
    : never,
  Options = object,
> =
  CreatedClient extends OpenapiQueryClient<
    infer Paths extends { [key: string]: any },
    infer Media extends MediaType
  >
    ? NonNullable<FetchResponse<Paths[Path][Method], Options, Media>["data"]>
    : never;

// TODO: Add the ability to bring queryClient as argument
export default function createClient<
  Paths extends {},
  Media extends MediaType = MediaType,
>(client: FetchClient<Paths, Media>): OpenapiQueryClient<Paths, Media> {
  const queryFn = async <
    Method extends HttpMethod,
    Path extends PathsWithMethod<Paths, Method>,
  >({
    queryKey: [method, path, init],
    signal,
  }: QueryFunctionContext<QueryKey<Paths, Method, Path>>) => {
    const mth = method.toUpperCase() as Uppercase<typeof method>;
    const fn = client[mth] as ClientMethod<Paths, typeof method, Media>;
    await sleep(300);
    const { data, error, response } = await fn(path, {
      signal,
      ...(init as any),
    }); // TODO: find a way to avoid as any
    if (error) {
      throw error;
    }
    if (
      response.status === 204 ||
      response.headers.get("Content-Length") === "0"
    ) {
      return data ?? null;
    }

    return data;
  };

  const queryOptions: QueryOptionsFunction<Paths, Media> =
    (method, path, ...[init, options]) =>
    () => ({
      queryKey: (init === undefined
        ? ([method, path] as const)
        : ([method, path, init()] as const)) as QueryKey<
        Paths,
        typeof method,
        typeof path
      >,
      queryFn,
      ...options?.(),
    });

  return {
    queryOptions,
    useQuery: (method, path, ...[init, options, queryClient]) => {
      let opt = queryOptions(
        method,
        path,
        init as InitWithUnknowns<typeof init>,
        options,
      );
      // @ts-expect-error
      let query = useQuery(opt, queryClient);
      let latest = () => (query.isSuccess ? query.data : undefined);

      Object.defineProperty(query, "latest", {
        value() {
          return latest();
        },
      });

      return query as typeof query & {
        latest: () => typeof query.data;
      };
    },
  };
}
