import type { LinkOptions } from "@tanstack/solid-router";
import type { Schemas } from "@/utils/serverApi";
import { extendEpisode, extendMovie, extendShow, posterList } from "@/utils/library";
import { formatSE } from "@/utils/formats";
import { queryApi } from "@/utils/queryApi";
import { useNotifications } from "@/context/NotificationContext";

export type ListContent = Schemas["ListContent"];

/** Static ids of the system lists, mirror `ListKind::SAVED_ID` / `ListKind::WATCH_ID` on the server */
export const SAVED_LIST_ID = 1;
export const WATCH_LIST_ID = 2;

/** Normalized view over the movie/show/episode union stored in lists */
export type ExtendedListContent = {
  content: ListContent;
  title: string;
  /** Extra context line, only present for episodes */
  subtitle?: string;
  typeLabel: "Movie" | "Show" | "Episode";
  /** Episodes have 16:9 stills, movies/shows have 2:3 posters */
  aspect: "poster" | "video";
  url: LinkOptions;
  posters: string[];
  /** Local metadata id, used by the remove endpoints */
  metadataId?: number;
  /** ISO date, present on all content types when known */
  releaseDate?: string;
  /** Milliseconds, only for movies and episodes */
  runtime?: number;
  /** Only for shows */
  seasonsCount?: number;
  /** Only for shows */
  episodesCount?: number;
};

export function extendListContent(item: ListContent): ExtendedListContent {
  switch (item.content_type) {
    case "movie": {
      let movie = extendMovie(item);
      return {
        content: item,
        title: item.title,
        typeLabel: "Movie",
        aspect: "poster",
        url: movie.url(),
        posters: posterList(movie),
        metadataId: item.local?.metadata_id,
        releaseDate: item.release_date ?? undefined,
        runtime: item.runtime ?? undefined,
      };
    }
    case "show": {
      let show = extendShow(item);
      return {
        content: item,
        title: item.title,
        typeLabel: "Show",
        aspect: "poster",
        url: show.url(),
        posters: posterList(show),
        metadataId: item.local?.metadata_id,
        releaseDate: item.release_date ?? undefined,
        seasonsCount: item.seasons?.length,
        episodesCount: item.episodes_amount ?? undefined,
      };
    }
    case "episode": {
      let episode = extendEpisode(item, item.show_id.toString());
      return {
        content: item,
        title: item.title,
        subtitle: `${item.show_title} · S${formatSE(item.season_number)}E${formatSE(item.number)}`,
        typeLabel: "Episode",
        aspect: "video",
        url: episode.url(),
        posters: posterList(episode),
        metadataId: item.local?.metadata_id,
        releaseDate: item.release_date ?? undefined,
        runtime: item.runtime ?? undefined,
      };
    }
  }
}

/**
 * Invalidate everything that reflects list membership. Content queries embed
 * `local.lists`, so list mutations stale them too. Only actively mounted queries
 * refetch right away — the rest refetch on next mount.
 */
export function invalidateListQueries() {
  queryApi.invalidateQueries("get", "/api/lists");
  queryApi.invalidateQueries("get", "/api/lists/{id}");
  queryApi.invalidateQueries("get", "/api/lists/{id}/items");
  queryApi.invalidateQueries("get", "/api/local_movies");
  queryApi.invalidateQueries("get", "/api/local_shows");
  queryApi.invalidateQueries("get", "/api/movie/{id}");
  queryApi.invalidateQueries("get", "/api/show/{id}");
  queryApi.invalidateQueries("get", "/api/show/{id}/{season}");
  queryApi.invalidateQueries("get", "/api/show/{id}/{season}/{episode}");
  queryApi.invalidateQueries("get", "/api/search/content");
  queryApi.invalidateQueries("get", "/api/search/trending_movies");
  queryApi.invalidateQueries("get", "/api/search/trending_shows");
  queryApi.invalidateQueries("get", "/api/history/suggest/movies");
  queryApi.invalidateQueries("get", "/api/history/suggest/shows");
}

type ListActionsOptions = {
  items: () => Schemas["ListItems"];
  /** Lists the item is already in, from its `local.lists` metadata */
  memberships?: () => Schemas["CompactList"][] | undefined | null;
  /** Local metadata id, required to remove the item from a list */
  metadataId?: () => number | undefined;
  onAdded?: (listName: string) => void;
  onRemoved?: (listName: string) => void;
};

/** Membership state and add/remove/toggle actions over the system and custom lists */
export function useListActions(opts: ListActionsOptions) {
  let lists = queryApi.useQuery("get", "/api/lists");
  let notify = useNotifications();

  let memberships = () => opts.memberships?.() ?? [];
  let inWatchlist = () => memberships().some((list) => list.kind === "watchlist");
  let inSaved = () => memberships().some((list) => list.kind === "saved");
  let inList = (id: number) => memberships().some((list) => list.id === id);

  let watchlistName = () => lists.latest()?.watch.name ?? "Watchlist";
  let savedName = () => lists.latest()?.saved.name ?? "Liked";

  function onError(error: Schemas["AppError"]) {
    if (error.kind === "duplicate") {
      notify("Already in this list");
    } else {
      notify("Failed to update the list");
    }
  }

  let mutationOptions = () => ({ onError, onSettled: invalidateListQueries });

  let addToWatchlist = queryApi.useMutation("post", "/api/lists/watchlist/add", mutationOptions);
  let addToSaved = queryApi.useMutation("post", "/api/lists/saved/add", mutationOptions);
  let addToList = queryApi.useMutation("post", "/api/lists/{id}/add", mutationOptions);
  let removeFromWatchlist = queryApi.useMutation(
    "delete",
    "/api/lists/watchlist/remove/{metadata_id}",
    mutationOptions,
  );
  let removeFromSaved = queryApi.useMutation(
    "delete",
    "/api/lists/saved/remove/{metadata_id}",
    mutationOptions,
  );
  let removeFromList = queryApi.useMutation(
    "delete",
    "/api/lists/{id}/remove/{metadata_id}",
    mutationOptions,
  );

  function toggleWatchlist() {
    let metadataId = opts.metadataId?.();
    if (inWatchlist() && metadataId !== undefined) {
      removeFromWatchlist.mutate(
        { params: { path: { metadata_id: metadataId } } },
        { onSuccess: () => opts.onRemoved?.(watchlistName()) },
      );
    } else {
      addToWatchlist.mutate(
        { body: opts.items() },
        { onSuccess: () => opts.onAdded?.(watchlistName()) },
      );
    }
  }

  function toggleSaved() {
    let metadataId = opts.metadataId?.();
    if (inSaved() && metadataId !== undefined) {
      removeFromSaved.mutate(
        { params: { path: { metadata_id: metadataId } } },
        { onSuccess: () => opts.onRemoved?.(savedName()) },
      );
    } else {
      addToSaved.mutate({ body: opts.items() }, { onSuccess: () => opts.onAdded?.(savedName()) });
    }
  }

  function toggleList(list: Schemas["List"]) {
    let metadataId = opts.metadataId?.();
    if (inList(list.id) && metadataId !== undefined) {
      removeFromList.mutate(
        { params: { path: { id: list.id, metadata_id: metadataId } } },
        { onSuccess: () => opts.onRemoved?.(list.name) },
      );
    } else {
      addToList.mutate(
        { params: { path: { id: list.id } }, body: opts.items() },
        { onSuccess: () => opts.onAdded?.(list.name) },
      );
    }
  }

  return {
    lists,
    inWatchlist,
    inSaved,
    inList,
    watchlistName,
    savedName,
    toggleWatchlist,
    toggleSaved,
    toggleList,
  };
}

type ListMedia = {
  provider_id: string;
  provider: Schemas["MetadataProvider"];
  local?: { metadata_id: number } | null;
};

/** Bodies for the add-to-list endpoints: prefer exact local ids, fall back to external lookup */
export function movieListItems(movie: ListMedia): Schemas["ListItems"] {
  if (movie.local) {
    return { local: { metadata_ids: [movie.local.metadata_id] } };
  }
  return {
    external: {
      content_type: "movie",
      id: movie.provider_id,
      provider: movie.provider,
    },
  };
}

export function showListItems(show: ListMedia): Schemas["ListItems"] {
  if (show.local) {
    return { local: { metadata_ids: [show.local.metadata_id] } };
  }
  return {
    external: {
      content_type: "show",
      id: show.provider_id,
      provider: show.provider,
    },
  };
}

export function episodeListItems(
  episode: ListMedia & { season_number: number; number: number },
  showId: string,
): Schemas["ListItems"] {
  if (episode.local) {
    return { local: { metadata_ids: [episode.local.metadata_id] } };
  }
  return {
    external: {
      content_type: "show",
      id: showId,
      provider: episode.provider,
      episodes: { season: episode.season_number, episodes: [episode.number] },
    },
  };
}
