import {
  createRootRouteWithContext,
  createRoute,
  HeadContent,
  linkOptions,
  Outlet,
} from "@tanstack/solid-router";
import {
  type Crumb,
  EpisodeTitleCrumb,
  MovieTitleCrumb,
  ShowTitleCrumb,
} from "./components/Breadcrumbs";
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
import { queryApi, queryClient } from "./utils/queryApi";
import { QueryClientProvider } from "@tanstack/solid-query";
import { SolidQueryDevtools } from "@tanstack/solid-query-devtools";
import History from "./pages/Settings/History";
import { Suspense } from "solid-js";
import { ColorSettingsPage } from "@/pages/Settings/ClientSettings";
import { ErrorComponent } from "@/components/Error";
import { SettingsLayout } from "./layouts/SettingsLayout";
import { ResourcesPage } from "./pages/Settings/Resources";
import { DEFAULT_FILTER_STATE } from "./components/ContentFilterBar";

type RouterContext = {
  crumbs?: Crumb[];
};

declare module "@tanstack/solid-router" {
  interface StaticDataRouteOption {
    backdrop?: boolean;
  }
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
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
  errorComponent: ({ error, info, reset }) => {
    console.error(error, info);
    return <ErrorComponent err={error} reset={reset} />;
  },
  head: () => metaHead("", "Web interface for your media server."),
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

const PROVIDERS: (Schemas["MetadataProvider"] | {})[] = ["local", "tmdb", "tvdb", "imdb"];

type MediaProviderParm = { provider: Schemas["MetadataProvider"] };

function validateProviderParam(search: Record<string, unknown>): MediaProviderParm {
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
  if (typeof search.provider === "string" && PROVIDERS.includes(search.provider)) {
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

const movieOpts = (id: string, provider: Schemas["MetadataProvider"]) =>
  queryApi.queryOptions("get", "/api/movie/{id}", () => ({
    params: { query: { provider }, path: { id } },
  }));

const showOpts = (id: string, provider: Schemas["MetadataProvider"]) =>
  queryApi.queryOptions("get", "/api/show/{id}", () => ({
    params: { query: { provider }, path: { id } },
  }));

const seasonOpts = (id: string, season: number, provider: Schemas["MetadataProvider"]) =>
  queryApi.queryOptions("get", "/api/show/{id}/{season}", () => ({
    params: { path: { id, season }, query: { provider } },
  }));

const episodeOpts = (
  id: string,
  season: number,
  episode: number,
  provider: Schemas["MetadataProvider"],
) =>
  queryApi.queryOptions("get", "/api/show/{id}/{season}/{episode}", () => ({
    params: { path: { id, season, episode }, query: { provider } },
  }));

const byContentOpts = (content_type: "movie" | "show", id: number) =>
  queryApi.queryOptions("get", "/api/video/by_content", () => ({
    params: { query: { content_type, id } },
  }));

const capabilitiesOpts = () => queryApi.queryOptions("get", "/api/configuration/capabilities");

const searchContentOpts = (search: string) =>
  queryApi.queryOptions("get", "/api/search/content", () => ({
    params: { query: { search } },
  }));

function metaHead(title: string, description: string) {
  const fullTitle = title ? `${title} – Provod` : "Provod";
  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  };
}

const dashboardRoute = createRoute({
  getParentRoute: () => pageRoute,
  path: "dashboard",
  component: Dashboard,
  head: () => metaHead("Dashboard", "Live server activity."),
});

const moviesRoute = createRoute({
  getParentRoute: () => pageRoute,
  path: "movies",
  component: Movies,
  beforeLoad: () => ({
    crumbs: [{ label: "Movies", link: linkOptions({ to: "/movies" }) }],
  }),
  loader: () => {
    queryClient.prefetchQuery(
      queryApi.queryOptions("get", "/api/local_movies", () => ({
        params: {
          query: {
            search: DEFAULT_FILTER_STATE.titleFilter,
            actors: DEFAULT_FILTER_STATE.actorFilter,
          },
        },
      }))(),
    );
  },
  head: () => metaHead("Movies", "Browse your movie library."),
});

const movieRoute = createRoute({
  getParentRoute: () => pageRoute,
  path: "movies/$id",
  component: Movie,
  staticData: { backdrop: true },
  validateSearch: validateProviderParam,
  beforeLoad: ({ params, search }) => ({
    crumbs: [
      { label: "Movies", link: linkOptions({ to: "/movies" }) },
      {
        label: () => <MovieTitleCrumb id={params.id} provider={search.provider} />,
        link: linkOptions({ to: "/movies/$id", params, search }),
      },
    ],
  }),
  loaderDeps: ({ search }) => ({ provider: search.provider }),
  loader: async ({ params, deps }) => {
    // Blocking: head needs the title/plot
    const movie = await queryClient.ensureQueryData(movieOpts(params.id, deps.provider)());

    if (movie.provider === "local") {
      queryClient.prefetchQuery(byContentOpts("movie", +movie.provider_id)());
    }
    return { title: movie.title, description: movie.plot ?? "" };
  },
  head: ({ loaderData }) =>
    metaHead(
      loaderData ? loaderData.title : "Movie",
      loaderData?.description || "Watch this movie.",
    ),
});

const showsRoute = createRoute({
  getParentRoute: () => pageRoute,
  path: "shows",
  component: Shows,
  beforeLoad: () => ({
    crumbs: [{ label: "Shows", link: linkOptions({ to: "/shows" }) }],
  }),
  loader: () => {
    queryClient.prefetchQuery(
      queryApi.queryOptions("get", "/api/local_shows", () => ({
        params: {
          query: {
            search: DEFAULT_FILTER_STATE.titleFilter,
            actors: DEFAULT_FILTER_STATE.actorFilter,
          },
        },
      }))(),
    );
  },
  head: () => metaHead("Shows", "Browse your TV show library."),
});

const showRoute = createRoute({
  getParentRoute: () => pageRoute,
  path: "shows/$id",
  component: ShowPage,
  staticData: { backdrop: true },
  validateSearch: validateSeasonParams,
  beforeLoad: ({ params, search }) => ({
    crumbs: [
      { label: "Shows", link: linkOptions({ to: "/shows" }) },
      {
        label: () => <ShowTitleCrumb id={params.id} provider={search.provider} />,
        link: linkOptions({ to: "/shows/$id", params, search }),
      },
    ],
  }),
  loaderDeps: ({ search }) => ({
    provider: search.provider,
    season: search.season,
  }),
  loader: async ({ params, deps }) => {
    // Blocking: head needs the title/plot. The page reads the same cache entry.
    const show = await queryClient.ensureQueryData(showOpts(params.id, deps.provider)());
    queryClient.prefetchQuery(capabilitiesOpts()());
    if (deps.season !== undefined) {
      queryClient.prefetchQuery(seasonOpts(params.id, deps.season, deps.provider)());
    }
    return { title: show.title, description: show.plot ?? "" };
  },
  head: ({ loaderData }) =>
    metaHead(loaderData ? loaderData.title : "Show", loaderData?.description || "Watch this show."),
});

const episodeRoute = createRoute({
  getParentRoute: () => pageRoute,
  path: "shows/$id/$season/$episode",
  component: Episode,
  staticData: { backdrop: true },
  validateSearch: validateProviderParam,
  beforeLoad: ({ params, search }) => ({
    crumbs: [
      { label: "Shows", link: linkOptions({ to: "/shows" }) },
      {
        label: () => <ShowTitleCrumb id={params.id} provider={search.provider} />,
        link: linkOptions({
          to: "/shows/$id",
          params: { id: params.id },
          search: { provider: search.provider },
        }),
      },
      {
        label: `Season ${params.season}`,
        link: linkOptions({
          to: "/shows/$id",
          params: { id: params.id },
          search: { provider: search.provider, season: +params.season },
        }),
      },
      {
        label: () => (
          <EpisodeTitleCrumb
            id={params.id}
            season={+params.season}
            episode={+params.episode}
            provider={search.provider}
          />
        ),
        link: linkOptions({
          to: "/shows/$id/$season/$episode",
          params,
          search,
        }),
      },
    ],
  }),
  loaderDeps: ({ search }) => ({ provider: search.provider }),
  loader: async ({ params, deps }) => {
    // Blocking: head needs the episode title/number
    const episode = await queryClient.ensureQueryData(
      episodeOpts(params.id, +params.season, +params.episode, deps.provider)(),
    );
    queryClient.prefetchQuery(showOpts(params.id, deps.provider)());
    if (episode.provider === "local") {
      queryClient.prefetchQuery(byContentOpts("show", +episode.provider_id)());
    }
    return {
      title: episode.title,
      season: episode.season_number,
      number: episode.number,
      description: episode.plot ?? "",
    };
  },
  head: ({ loaderData }) =>
    metaHead(
      loaderData ? `${loaderData.title} (S${loaderData.season}E${loaderData.number})` : "Episode",
      loaderData?.description || "Watch this episode.",
    ),
});

const torrentRoute = createRoute({
  getParentRoute: () => pageRoute,
  path: "torrent",
  component: Torrent,
  head: () => metaHead("Torrents", "Active torrent downloads."),
});

const settingsRoute = createRoute({
  getParentRoute: () => pageRoute,
  id: "settings",
  component: () => (
    <SettingsLayout>
      <Outlet />
    </SettingsLayout>
  ),
});

const serverSettingsRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: "/settings",
  component: GeneralSettingsPage,
  loader: () => {
    queryClient.prefetchQuery(queryApi.queryOptions("get", "/api/configuration")());
  },
  head: () => metaHead("Settings", "Configure your media server."),
});

const resourcesSettingsRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: "settings/resources",
  component: ResourcesPage,
  head: () => metaHead("Resources", "Resource usage."),
});

const clientSettingsRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: "settings/client",
  component: ColorSettingsPage,
  head: () => metaHead("Appearance", "Customize the interface."),
});

const searchRoute = createRoute({
  getParentRoute: () => pageRoute,
  path: "search",
  component: SearchPage,
  validateSearch: validateSearchParams,
  loaderDeps: ({ search }) => ({ search: search.search }),
  loader: ({ deps }) => {
    if (deps.search) {
      queryClient.prefetchQuery(searchContentOpts(deps.search)());
    }
    return { search: deps.search };
  },
  head: ({ loaderData }) =>
    metaHead(
      loaderData?.search ? `Search: "${loaderData.search}"` : "Search",
      "Search movies and shows.",
    ),
});

const testRoute = createRoute({
  getParentRoute: () => pageRoute,
  path: "test",
  component: TestPage,
  head: () => metaHead("Test", "Test page."),
});

const historyRoute = createRoute({
  getParentRoute: () => pageRoute,
  path: "history",
  component: History,
  head: () => metaHead("History", "Your watch history."),
});

const logsRoute = createRoute({
  getParentRoute: () => pageRoute,
  path: "logs",
  component: TestPage,
  head: () => metaHead("Logs", "Server logs."),
});

const homeRoute = createRoute({
  getParentRoute: () => pageRoute,
  path: "/",
  component: Home,
  loader: () => {
    queryClient.prefetchQuery(queryApi.queryOptions("get", "/api/search/trending_shows")());
    queryClient.prefetchQuery(queryApi.queryOptions("get", "/api/search/trending_movies")());
    queryClient.prefetchQuery(queryApi.queryOptions("get", "/api/history/suggest/shows")());
    queryClient.prefetchQuery(queryApi.queryOptions("get", "/api/history/suggest/movies")());
  },
  head: () => metaHead("", "Continue watching and discover new movies and shows."),
});

const watchShow = createRoute({
  getParentRoute: () => watchRoute,
  path: "shows/$id/$season/$episode/watch",
  component: WatchShow,
  validateSearch: validateWatchParams,
  loader: async ({ params }) => {
    // Watch pages always use the local provider.
    const episode = await queryClient.ensureQueryData(
      episodeOpts(params.id, +params.season, +params.episode, "local")(),
    );
    queryClient.prefetchQuery(showOpts(params.id, "local")());
    if (episode.provider === "local") {
      queryClient.prefetchQuery(byContentOpts("show", +episode.provider_id)());
    }
    // Prefetch the next episode so it is ready when the current one ends.
    queryClient.prefetchQuery(
      episodeOpts(params.id, +params.season, +params.episode + 1, "local")(),
    );
    return {
      title: episode.title,
      season: episode.season_number,
      number: episode.number,
    };
  },
  head: ({ loaderData }) =>
    metaHead(
      loaderData
        ? `Watch ${loaderData.title} (S${loaderData.season}E${loaderData.number})`
        : "Watch",
      loaderData ? `Now playing ${loaderData.title}.` : "Now playing",
    ),
});

const watchMovie = createRoute({
  getParentRoute: () => watchRoute,
  path: "movies/$id/watch",
  component: WatchMovie,
  validateSearch: validateWatchParams,
  loader: async ({ params }) => {
    // Watch pages always use the local provider.
    const movie = await queryClient.ensureQueryData(movieOpts(params.id, "local")());
    queryClient.prefetchQuery(byContentOpts("movie", +params.id)());
    return { title: movie.title };
  },
  head: ({ loaderData }) =>
    metaHead(
      loaderData ? `Watch ${loaderData.title}` : "Watch",
      loaderData ? `Now playing ${loaderData.title}.` : "Now playing",
    ),
});

export const routeTree = rootRoute.addChildren([
  pageRoute.addChildren([
    homeRoute,
    moviesRoute.addChildren([movieRoute]),
    showsRoute.addChildren([showRoute.addChildren([episodeRoute])]),

    torrentRoute,
    searchRoute,
    dashboardRoute,
    historyRoute,
    logsRoute,
    testRoute,

    settingsRoute.addChildren([serverSettingsRoute, clientSettingsRoute, resourcesSettingsRoute]),
  ]),

  watchRoute.addChildren([watchMovie, watchShow]),
]);
