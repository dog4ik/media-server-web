import { formatSE } from "@/utils/formats";
import type { Schemas } from "@/utils/serverApi";

type Provider = Schemas["TorrentIndexIdentifier"];

// TPB does not like some characters in the titles
function sanitizeTpbTitle(title: string) {
  for (const char of [":", "-"]) {
    title = title.replaceAll(char, "");
  }
  return title;
}

export const EPISODE_FORMATTER: Record<
  Provider,
  (show: Schemas["Show"], episode: Schemas["Episode"]) => string
> = {
  tpb: (show, episode) =>
    `${sanitizeTpbTitle(show.title)} S${formatSE(episode.season_number)}E${formatSE(episode.number)}`,
  rutracker: (show, episode) =>
    `${show.locale_metadata?.original_title ?? show.title} Сезон: ${episode.season_number}`,
  nyaa: (show, episode) =>
    `${show.title} S${formatSE(episode.season_number)}E${formatSE(episode.number)}`,
};

export const SEASON_FORMATTER: Record<
  Provider,
  (show: Schemas["Show"], season: number) => string
> = {
  tpb: (show, season) => `${sanitizeTpbTitle(show.title)} Season ${season}`,
  rutracker: (show, season) =>
    `${show.locale_metadata?.original_title ?? show.title} Сезон: ${season}`,
  nyaa: (show, season) => `${show.title} S${formatSE(season)}`,
};

export const SHOW_FORMATTER: Record<
  Provider,
  (show: Schemas["Show"]) => string
> = {
  tpb: (show) => `${sanitizeTpbTitle(show.title)}`,
  rutracker: (show) => `${show.locale_metadata?.original_title ?? show.title}`,
  nyaa: (show) => `${show.locale_metadata?.original_title ?? show.title}`,
};

export const MOVIE_FORMATTER: Record<
  Provider,
  (show: Schemas["Movie"]) => string
> = {
  tpb: (movie) => `${sanitizeTpbTitle(movie.title)}`,
  rutracker: (movie) =>
    `${movie.locale_metadata?.original_title ?? movie.title}`,
  nyaa: (movie) => `${movie.locale_metadata?.original_title ?? movie.title}`,
};
