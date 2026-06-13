import {
  type DataTag,
  type InfiniteData,
  type InvalidateOptions,
  type InvalidateQueryFilters,
  type QueryClient,
  type QueryFunctionContext,
  type SkipToken,
  type UseInfiniteQueryOptions,
  type UseInfiniteQueryResult,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
  useInfiniteQuery,
  useMutation,
  useQuery,
} from "@tanstack/solid-query";
import type {
  ClientMethod,
  DefaultParamsOption,
  Client as FetchClient,
  FetchResponse,
  MaybeOptionalInit,
} from "openapi-fetch";
import type { Accessor } from "solid-js";

// `openapi-typescript-helpers` is a transitive dependency of `openapi-fetch` and is
// not reliably resolvable from the project root (it is not hoisted under the Deno
// node_modules layout), so the few helper types we need are inlined here. They match
// the upstream definitions exactly.
type HttpMethod = "get" | "put" | "post" | "delete" | "options" | "head" | "patch" | "trace";
type MediaType = `${string}/${string}`;
type PathsWithMethod<Paths extends {}, PathnameMethod extends HttpMethod> = {
  [Pathname in keyof Paths]: Paths[Pathname] extends {
    [K in PathnameMethod]: any;
  }
    ? Pathname
    : never;
}[keyof Paths];
type RequiredKeysOfHelper<T> = {
  [K in keyof T]: {} extends Pick<T, K> ? never : K;
}[keyof T];
type RequiredKeysOf<T> =
  RequiredKeysOfHelper<T> extends undefined ? never : RequiredKeysOfHelper<T>;

// Helper type to dynamically infer the type from the `select` property
type InferSelectReturnType<TData, TSelect> = TSelect extends (data: TData) => infer R ? R : TData;

type InitWithUnknowns<Init> = Init & { [key: string]: unknown };

export type QueryKey<
  Paths extends Record<string, Record<HttpMethod, {}>>,
  Method extends HttpMethod,
  Path extends PathsWithMethod<Paths, Method>,
  Init = MaybeOptionalInit<Paths[Path], Method>,
> = Init extends undefined ? readonly [Method, Path] : readonly [Method, Path, Init];

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
      "queryFn" | "queryKey"
    > & {
      queryKey: DataTag<QueryKey<Paths, Method, Path>, Response["data"], Response["error"]>;
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
  url: Path,
  ...[init, options, queryClient]: RequiredKeysOf<Init> extends never
    ? [Accessor<InitWithUnknowns<Init>>?, Accessor<Options>?, QueryClient?]
    : [Accessor<InitWithUnknowns<Init>>, Accessor<Options>?, QueryClient?]
) => UseQueryResult<
  InferSelectReturnType<Response["data"], Options["select"]>,
  Response["error"]
> & {
  /** Access data without triggering suspense */
  latest: () => InferSelectReturnType<Response["data"], Options["select"]> | undefined;
};

export type UseInfiniteQueryMethod<
  Paths extends Record<string, Record<HttpMethod, {}>>,
  Media extends MediaType,
> = <
  Method extends HttpMethod,
  Path extends PathsWithMethod<Paths, Method>,
  Init extends MaybeOptionalInit<Paths[Path], Method>,
  Response extends Required<FetchResponse<Paths[Path][Method], Init, Media>>,
  Options extends Omit<
    ReturnType<
      UseInfiniteQueryOptions<
        Response["data"],
        Response["error"],
        InferSelectReturnType<InfiniteData<Response["data"]>, Options["select"]>,
        QueryKey<Paths, Method, Path>,
        unknown
      >
    >,
    "queryKey" | "queryFn"
  > & {
    pageParamName?: string;
  },
>(
  method: Method,
  url: Path,
  init: Accessor<InitWithUnknowns<Init>>,
  options: Accessor<Options>,
  queryClient?: QueryClient,
) => UseInfiniteQueryResult<
  InferSelectReturnType<InfiniteData<Response["data"]>, Options["select"]>,
  Response["error"]
>;

export type UseMutationMethod<
  Paths extends Record<string, Record<HttpMethod, {}>>,
  Media extends MediaType,
> = <
  Method extends HttpMethod,
  Path extends PathsWithMethod<Paths, Method>,
  Init extends MaybeOptionalInit<Paths[Path], Method>,
  Response extends Required<FetchResponse<Paths[Path][Method], Init, Media>>, // note: Required is used to avoid repeating NonNullable in UseQuery types
  TOnMutateResult = unknown,
>(
  method: Method,
  url: Path,
  options?: Accessor<
    Omit<
      ReturnType<UseMutationOptions<Response["data"], Response["error"], Init, TOnMutateResult>>,
      "mutationKey" | "mutationFn"
    >
  >,
  queryClient?: Accessor<QueryClient>,
) => UseMutationResult<Response["data"], Response["error"], Init, TOnMutateResult>;

export type InvalidateQueriesMethod<
  Paths extends Record<string, Record<HttpMethod, {}>>,
  Media extends MediaType,
> = <
  Method extends HttpMethod,
  Path extends PathsWithMethod<Paths, Method>,
  Init extends MaybeOptionalInit<Paths[Path], Method>,
>(
  queryClient: QueryClient,
  method: Method,
  path: Path,
  // `init` is always optional here: omitting it partial-matches every cached query for the
  // `[method, path]` prefix (i.e. all parameter variations), while passing it narrows the
  // match to that exact `init`. Both follow TanStack Query's default prefix matching.
  init?: InitWithUnknowns<Init>,
  filters?: Omit<InvalidateQueryFilters<QueryKey<Paths, Method, Path>>, "queryKey">,
  options?: InvalidateOptions,
) => Promise<void>;

export interface OpenapiQueryClient<Paths extends {}, Media extends MediaType = MediaType> {
  queryOptions: QueryOptionsFunction<Paths, Media>;
  useQuery: UseQueryMethod<Paths, Media>;
  useInfiniteQuery: UseInfiniteQueryMethod<Paths, Media>;
  useMutation: UseMutationMethod<Paths, Media>;
  invalidateQueries: InvalidateQueriesMethod<Paths, Media>;
}

export type MethodResponse<
  CreatedClient extends OpenapiQueryClient<any, any>,
  Method extends HttpMethod,
  Path extends CreatedClient extends OpenapiQueryClient<infer Paths, infer _Media>
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
export default function createClient<Paths extends {}, Media extends MediaType = MediaType>(
  client: FetchClient<Paths, Media>,
): OpenapiQueryClient<Paths, Media> {
  const queryFn = async <Method extends HttpMethod, Path extends PathsWithMethod<Paths, Method>>({
    queryKey: [method, path, init],
    signal,
  }: QueryFunctionContext<QueryKey<Paths, Method, Path>>) => {
    const mth = method.toUpperCase() as Uppercase<typeof method>;
    const fn = client[mth] as ClientMethod<Paths, typeof method, Media>;
    const { data, error, response } = await fn(path, {
      signal,
      ...(init as any),
    }); // TODO: find a way to avoid as any
    if (error) {
      throw error;
    }
    if (response.status === 204 || response.headers.get("Content-Length") === "0") {
      return data ?? null;
    }

    return data;
  };

  const queryOptions: QueryOptionsFunction<Paths, Media> =
    (method, path, ...[init, options]) =>
    () =>
      ({
        queryKey: (init === undefined
          ? ([method, path] as const)
          : ([method, path, init()] as const)) as DataTag<
          QueryKey<Paths, typeof method, typeof path>,
          any,
          any
        >,
        queryFn,
        ...options?.(),
      }) as any;

  return {
    queryOptions,
    useQuery: (method, path, ...[init, options, queryClient]) => {
      const queryOpts = queryOptions(method, path, init as InitWithUnknowns<typeof init>, options);
      // `useQuery`'s two overloads narrow on `initialData` (must be either `undefined` or
      // always-defined). We never set `initialData`, so widen the options to the
      // undefined-initial-data overload while preserving the inferred data/error generics.
      const query = useQuery(
        queryOpts as () => ReturnType<typeof queryOpts> & {
          initialData?: undefined;
        },
        queryClient === undefined ? undefined : () => queryClient,
      );

      Object.defineProperty(query, "latest", {
        value() {
          return query.isSuccess ? query.data : undefined;
        },
      });

      return query as typeof query & {
        latest: () => typeof query.data;
      };
    },
    useInfiniteQuery: (method, path, init, options, queryClient) =>
      useInfiniteQuery(
        () => {
          const { pageParamName = "cursor", ...restOptions } = options();
          const { queryKey } = queryOptions(method, path, init as InitWithUnknowns<typeof init>)();
          return {
            queryKey,
            queryFn: async ({
              queryKey: [method, path, init],
              pageParam = 0,
              signal,
            }: QueryFunctionContext<
              QueryKey<Paths, HttpMethod, PathsWithMethod<Paths, HttpMethod>>,
              unknown
            >) => {
              const mth = (method as HttpMethod).toUpperCase() as Uppercase<HttpMethod>;
              const fn = client[mth] as ClientMethod<Paths, HttpMethod, Media>;
              const mergedInit = {
                ...(init as any),
                signal,
                params: {
                  ...((init as any)?.params || {}),
                  query: {
                    ...((init as any)?.params as { query?: DefaultParamsOption })?.query,
                    [pageParamName]: pageParam,
                  },
                },
              };

              const { data, error } = await fn(path as any, mergedInit as any);
              if (error) {
                throw error;
              }
              return data;
            },
            ...restOptions,
          } as any;
        },
        queryClient === undefined ? undefined : () => queryClient,
      ),
    useMutation: (method, path, options, queryClient) =>
      useMutation(
        () => ({
          mutationKey: [method, path],
          mutationFn: async (init) => {
            const mth = method.toUpperCase() as Uppercase<typeof method>;
            const fn = client[mth] as ClientMethod<Paths, typeof method, Media>;
            const { data, error } = await fn(path, init as InitWithUnknowns<typeof init>);
            if (error) {
              throw error;
            }

            return data as Exclude<typeof data, undefined>;
          },
          ...options?.(),
        }),
        queryClient,
      ),
    invalidateQueries: (queryClient, method, path, init, filters, options) =>
      queryClient.invalidateQueries(
        {
          ...filters,
          queryKey: (init === undefined
            ? ([method, path] as const)
            : ([method, path, init] as const)) as QueryKey<Paths, typeof method, typeof path>,
        },
        options,
      ),
  };
}
