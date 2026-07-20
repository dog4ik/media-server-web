import type { LinkOptions } from "@tanstack/solid-router";
import type { Schemas } from "@/utils/serverApi";
import { extendEpisode, extendMovie, extendShow, posterList } from "@/utils/library";
import { formatSE } from "@/utils/formats";

export type ListContent = Schemas["ListContent"];

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
