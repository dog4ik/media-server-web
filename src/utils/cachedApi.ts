import { cache } from "@solidjs/router";
import {
  getSeason,
  getEpisode,
  getSeasons,
  getAllShows,
  getEpisodes,
  getShowById,
  getLatestLog,
  getSeasonById,
  getActiveTasks,
  getEpisodeById,
} from "./serverApi";

export const getCachedSeason = cache((showId: number, season: number) => {
  return getSeason(showId, season);
}, "season");

export const getCachedEpisode = cache(
  (showId: number, season: number, episode: number) => {
    return getEpisode(showId, season, episode);
  },
  "episode",
);

export const getCachedSeasons = cache((showId: number) => {
  return getSeasons(showId);
}, "seasons");

export const getCachedAllShows = cache(() => {
  return getAllShows();
}, "shows");

export const getCachedEpisodes = cache((showId: number, season: number) => {
  return getEpisodes(showId, season);
}, "episodes");

export const getCachedShowById = cache((showId: number) => {
  return getShowById(showId);
}, "showWithId");

export const getCachedSeasonById = cache((seasonId: number) => {
  return getSeasonById(seasonId);
}, "season");

export const getCachedEpisodeById = cache((episodeId: number) => {
  return getEpisodeById(episodeId);
}, "episode");

export const getCachedActiveTasks = cache(() => {
  return getActiveTasks()
}, "activeTasks")
