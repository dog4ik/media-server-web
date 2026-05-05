import { formatSE } from "@/utils/formats";
import { Schemas } from "@/utils/serverApi";

type Provider = Schemas["TorrentIndexIdentifier"];

// TPB does not like some characters in the titles
function sanitizeTpbTitle(title: string) {
  for (let char of [":", "-"]) {
    title = title.replaceAll(char, "");
  }
  return title;
}

export const EPISODE_FORMATTER: Record<
  Provider,
  (show: Schemas["ShowMetadata"], episode: Schemas["EpisodeMetadata"]) => string
> = {
  tpb: (show, episode) =>
    `${sanitizeTpbTitle(show.title)} S${formatSE(episode.season_number)}E${formatSE(episode.number)}`,
  rutracker: (show, episode) =>
    `${show.locale_metadata?.original_title ?? show.title} Сезон: ${episode.season_number}`,
};

export const SEASON_FORMATTER: Record<
  Provider,
  (show: Schemas["ShowMetadata"], season: number) => string
> = {
  tpb: (show, season) => `${sanitizeTpbTitle(show.title)} Season ${season}`,
  rutracker: (show, season) =>
    `${show.locale_metadata?.original_title ?? show.title} Сезон: ${season}`,
};

export const SHOW_FORMATTER: Record<Provider, (show: Schemas["ShowMetadata"]) => string> = {
  tpb: (show) => `${sanitizeTpbTitle(show.title)}`,
  rutracker: (show) => `${show.locale_metadata?.original_title ?? show.title}`,
};

export const MOVIE_FORMATTER: Record<Provider, (show: Schemas["MovieMetadata"]) => string> = {
  tpb: (show) => `${sanitizeTpbTitle(show.title)}`,
  rutracker: (show) => `${show.locale_metadata?.original_title ?? show.title}`,
};
