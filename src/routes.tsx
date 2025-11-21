import {
  createRootRoute,
  createRoute,
  HeadContent,
  Outlet,
} from "@tanstack/solid-router";
import { TanStackRouterDevtools } from "@tanstack/solid-router-devtools";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Movies from "./pages/Movies";
import Movie from "./pages/Movie";
import Shows from "./pages/Shows";
import ShowPage from "./pages/Show";
import Episode from "./pages/Episode";
import Torrent from "./pages/Torrent";
import GeneralSettingsPage from "./pages/Settings";
import TestPage from "./pages/TestPage";
import SearchPage from "./pages/Search";
import PageLayout from "./layouts/PageLayout";
import Layout from "./Layout";
import { Schemas } from "./utils/serverApi";
import WatchLayout from "./layouts/WatchLayout";
import { WatchMovie, WatchShow } from "./pages/Watch";
import tracing from "./utils/tracing";
import { queryClient } from "./utils/queryApi";
import { QueryClientProvider } from "@tanstack/solid-query";
import { SolidQueryDevtools } from "@tanstack/solid-query-devtools";
import History from "./pages/Settings/History";
import { Suspense } from "solid-js";

const rootRoute = createRootRoute({
  component: () => (
    <>
      <HeadContent />
      <QueryClientProvider client={queryClient}>
        <Layout>
          <Outlet />
        </Layout>
        <TanStackRouterDevtools />
        <SolidQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </>
  ),
  errorComponent: ({ error, info }) => {
    console.error(error, info);
    return <div>{(error.message, info?.componentStack)}</div>;
  },
  head: (_) => {
    return {
      meta: [
        {
          name: "Provod media server",
          content: "Web interface for provod media server",
          title: "Provod",
        },
      ],
    };
  },
});

const pageRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "page",
  component: () => (
    <PageLayout>
      <Suspense>
        <Outlet />
      </Suspense>
    </PageLayout>
  ),
});

const watchRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "watch",
  component: () => (
    <WatchLayout>
      <Outlet />
    </WatchLayout>
  ),
  validateSearch: validateWatchParams,
});

const PROVIDERS: (Schemas["MetadataProvider"] | {})[] = [
  "local",
  "tmdb",
  "tvdb",
  "imdb",
];

type MediaProviderParm = { provider: Schemas["MetadataProvider"] };

function validateProviderParam(
  search: Record<string, unknown>,
): MediaProviderParm {
  let provider = search.provider;
  if (typeof provider == "string" && PROVIDERS.includes(provider)) {
    return { provider: search.provider as Schemas["MetadataProvider"] };
  } else {
    return { provider: "local" };
  }
}

type SeasonParams = { provider: Schemas["MetadataProvider"]; season?: number };

function validateSeasonParams(search: Record<string, unknown>): SeasonParams {
  let { provider } = validateProviderParam(search);
  if (search.season === "string") {
    return { provider, season: +search.season };
  } else {
    return { provider };
  }
}

type SearchParams = { provider?: Schemas["MetadataProvider"]; search: string };

function validateSearchParams(search: Record<string, unknown>): SearchParams {
  let provider: Schemas["MetadataProvider"] | undefined = undefined;
  if (
    typeof search.provider === "string" &&
    PROVIDERS.includes(search.provider)
  ) {
    provider = search.provider as Schemas["MetadataProvider"];
  }
  let searchQuery = "";
  if (typeof search.search === "string") {
    searchQuery = search.search;
  }
  return { provider, search: searchQuery };
}

type WatchParams = { variant_id?: string; video_id: number };

function validateWatchParams(search: Record<string, unknown>): WatchParams {
  let variant_id: string | undefined = undefined;
  let video_id: number | undefined = undefined;
  if (typeof search.variant_id === "string") {
    variant_id = search.provider as Schemas["MetadataProvider"];
  }
  if (typeof search.video_id === "number") {
    video_id = search.video_id;
  }
  if (video_id === undefined) {
    tracing.error({ video_id }, "Failed to parse video id");
    throw Error("failed to parse video id");
  }
  return { variant_id, video_id };
}

const dashboardRoute = createRoute({
  getParentRoute: () => pageRoute,
  path: "dashboard",
  component: Dashboard,
});

const moviesRoute = createRoute({
  getParentRoute: () => pageRoute,
  path: "movies",
  loader: () => {
    // let localMoviesOptions = queryApi.queryOptions("get", "/api/local_movies");
    // queryClient.ensureQueryData(localMoviesOptions());
  },
  component: Movies,
});

const movieRoute = createRoute({
  getParentRoute: () => pageRoute,
  path: "movies/$id",
  // loader: ({ params, deps }) => {
  //   let movieOptions = queryApi.queryOptions("get", "/api/movie/{id}", () => ({
  //     params: {
  //       path: {
  //         id: params.id,
  //       },
  //       query: { provider: deps.provider },
  //     },
  //   }));
  //   queryClient.ensureQueryData(movieOptions());
  // },
  component: Movie,
  validateSearch: validateProviderParam,
});

const showsRoute = createRoute({
  getParentRoute: () => pageRoute,
  path: "shows",
  loader: () => {
    // let localShowsOptions = queryApi.queryOptions("get", "/api/local_shows");
    // queryClient.ensureQueryData(localShowsOptions());
  },
  component: Shows,
});

const showRoute = createRoute({
  getParentRoute: () => pageRoute,
  path: "shows/$id",
  component: ShowPage,
  validateSearch: validateSeasonParams,
  // loader: ({ params, deps }) => {
  //   let showOptions = queryApi.queryOptions("get", "/api/show/{id}", () => ({
  //     params: { path: { id: params.id }, query: { provider: deps.provider } },
  //   }));
  //   queryClient.prefetchQuery(showOptions());
  //
  //   let season = deps.season;
  //   if (season !== undefined) {
  //     let seasonOptions = queryApi.queryOptions(
  //       "get",
  //       "/api/show/{id}/{season}",
  //       () => ({
  //         params: {
  //           path: { id: params.id, season },
  //           query: { provider: deps.provider },
  //         },
  //       }),
  //     );
  //     queryClient.prefetchQueryData(seasonOptions());
  //   }
  // },
});

const episodeRoute = createRoute({
  getParentRoute: () => pageRoute,
  path: "shows/$id/$season/$episode",
  component: Episode,
  validateSearch: validateProviderParam,
  // loader: ({ params, deps }) => {
  //   let showOptions = queryApi.queryOptions("get", "/api/show/{id}", () => ({
  //     params: { path: { id: params.id }, query: { provider: deps.provider } },
  //   }));
  //   queryClient.ensureQueryData(showOptions());
  //   let episodeOptions = queryApi.queryOptions(
  //     "get",
  //     "/api/show/{id}/{season}/{episode}",
  //     () => ({
  //       params: {
  //         path: {
  //           id: params.id,
  //           season: +params.season,
  //           episode: +params.episode,
  //         },
  //         query: { provider: deps.provider },
  //       },
  //     }),
  //   );
  //   queryClient.ensureQueryData(episodeOptions());
  // },
});

const torrentRoute = createRoute({
  getParentRoute: () => pageRoute,
  path: "torrent",
  component: Torrent,
});

const settingsRoute = createRoute({
  getParentRoute: () => pageRoute,
  path: "settings",
  component: GeneralSettingsPage,
});

const searchRoute = createRoute({
  getParentRoute: () => pageRoute,
  path: "search",
  component: SearchPage,
  validateSearch: validateSearchParams,
});

const testRoute = createRoute({
  getParentRoute: () => pageRoute,
  path: "test",
  component: TestPage,
});

const historyRoute = createRoute({
  getParentRoute: () => pageRoute,
  path: "history",
  component: History,
});

const logsRoute = createRoute({
  getParentRoute: () => pageRoute,
  path: "logs",
  component: TestPage,
});

const homeRoute = createRoute({
  getParentRoute: () => pageRoute,
  path: "/",
  component: Home,
});

const watchShow = createRoute({
  getParentRoute: () => watchRoute,
  path: "shows/$id/$season/$episode/watch",
  component: WatchShow,
  validateSearch: validateWatchParams,
});

const watchMovie = createRoute({
  getParentRoute: () => watchRoute,
  path: "movies/$id/watch",
  component: WatchMovie,
  validateSearch: validateWatchParams,
});

export const routeTree = rootRoute.addChildren([
  pageRoute.addChildren([
    homeRoute,
    moviesRoute.addChildren([movieRoute]),
    showsRoute.addChildren([showRoute.addChildren([episodeRoute])]),

    torrentRoute,
    searchRoute,
    settingsRoute,
    dashboardRoute,
    historyRoute,
    logsRoute,
    testRoute,
  ]),

  watchRoute.addChildren([watchMovie, watchShow]),
]);
