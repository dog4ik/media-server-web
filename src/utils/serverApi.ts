import BaseError, {
  NotFoundError,
  ServerError,
  UnavailableError,
} from "./errors";

function availabilityCatch(e: Error) {
  if (!(e instanceof BaseError))
    throw new UnavailableError("Server is not available");
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    if (response.status == 404) {
      throw new NotFoundError();
    }
    throw new ServerError();
  }
  try {
    return await response.json();
  } catch (error) {
    throw new ServerError();
  }
}

const MEDIA_SERVER_URL = import.meta.env.VITE_MEDIA_SERVER_URL!;

export function getVideoUrl(videoId: number | string) {
  let url = new MediaUrl(`/watch`);
  url.searchParams.append("id", videoId.toString());
  return url;
}

class MediaUrl extends URL {
  constructor(appendix: string) {
    let url = new URL(`/api${appendix}`, MEDIA_SERVER_URL);
    super(url);
  }

  async fetch<T>(): Promise<T> {
    return await fetch(super.toString())
      .then(handleResponse)
      .catch(availabilityCatch);
  }
}

class AdminMediaUrl extends URL {
  constructor(appendix: string) {
    let url = new URL(`/admin${appendix}`, MEDIA_SERVER_URL);
    super(url);
  }

  async fetch<T>(): Promise<T> {
    return await fetch(super.toString())
      .then(handleResponse)
      .catch(availabilityCatch);
  }
}

type Method = "GET" | "POST" | "PUT" | "DELETE";

class AdminMutation {
  url: URL;
  method: Method | undefined;
  constructor(appendix: string, method?: Method) {
    this.method = method;
    this.url = new URL(`/admin${appendix}`, MEDIA_SERVER_URL);
  }

  async mutate<T>(body?: {}): Promise<T> {
    let headers = new Headers();
    headers.append("Content-type", "application/json");
    let options = {
      method: this.method ?? "POST",
      headers,
      body: body ? JSON.stringify({ ...body }) : undefined,
    };
    return await fetch(this.url, options)
      .then(async (res) => {
        let text = await res.text();
        if (text.length > 0) return JSON.parse(text);
      })
      .catch(availabilityCatch);
  }
}

async function sleep(time: number) {
  await new Promise((res) => setTimeout(res, time));
}

export async function getAllShows(page?: number) {
  let url = new MediaUrl("/get_all_shows");
  if (page !== undefined) url.searchParams.append("page", page.toString());
  return await url.fetch<ShowWithDetails[]>();
}

export async function getShowById(showId: number) {
  let url = new MediaUrl("/get_show_by_id");
  url.searchParams.append("id", showId.toString());
  return await url.fetch<ShowWithDetails>();
}

export async function getSeasons(showId: number) {
  let url = new MediaUrl("/get_seasons");
  url.searchParams.append("id", showId.toString());
  return await url.fetch<SeasonWithDetails[]>();
}

export async function getSeason(showId: number, season: number) {
  let url = new MediaUrl("/get_season");
  url.searchParams.append("id", showId.toString());
  url.searchParams.append("season", season.toString());
  return await url.fetch<SeasonWithDetails>();
}

export async function getSeasonById(seasonId: number) {
  let url = new MediaUrl("/get_season_by_id");
  url.searchParams.append("id", seasonId.toString());
  return await url.fetch<SeasonWithDetails>();
}

export async function getEpisodes(showId: number, season: number) {
  let url = new MediaUrl("/get_episodes");
  url.searchParams.append("id", showId.toString());
  url.searchParams.append("season", season.toString());
  return await url.fetch<EpisodeWithDetails[]>();
}

export async function getEpisode(
  showId: number,
  season: number,
  episode: number,
) {
  let url = new MediaUrl("/get_episode");
  url.searchParams.append("id", showId.toString());
  url.searchParams.append("season", season.toString());
  url.searchParams.append("episode", episode.toString());
  return await url.fetch<EpisodeWithDetails>();
}

export async function getEpisodeById(episodeId: number) {
  let url = new MediaUrl("/get_episode_by_id");
  url.searchParams.append("id", episodeId.toString());
  return await url.fetch<EpisodeWithDetails>();
}

export async function getActiveTasks() {
  // await sleep(2000);
  let url = new AdminMediaUrl("/get_tasks");
  return await url.fetch<ServerTask[]>();
}

export async function getLatestLog() {
  let url = new AdminMediaUrl("/latest_log");
  return await url.fetch<LogMessage[]>();
}

// mutations

export async function cancelTaskMutation(task_id: string) {
  let mutator = new AdminMutation("/cancel_task");
  return await mutator.mutate({ task_id });
}

export async function refreshLibrary() {
  let mutator = new AdminMutation("/scan");
  return await mutator.mutate();
}

export async function alterEpisode(data: {}) {
  let mutator = new AdminMutation("/alter_episode_metadata");
  return await mutator.mutate(data);
}

export async function clearDatabase() {
  let mutator = new AdminMutation("/clear_db", "DELETE");
  return await mutator.mutate();
}

//types

type EventKind = "transcode" | "scan" | "previews";

type LogLevel = "TRACE" | "DEBUG" | "INFO" | "ERROR";

type LogMessage = {
  fields: { message?: string };
  level: LogLevel;
  name: string;
  target: string;
  timestamp: string;
};

type ServerTask = {
  id: string;
  target: string;
  kind: EventKind;
  cancelable: boolean;
};

type MediaShow = {
  id: number;
  metadata_id: string;
  metadata_provider: string;
  title: string;
  release_date: string;
  poster: string;
  blur_data: string;
  backdrop: string;
  rating: number;
  plot: string;
  original_language: string;
};

type OmitProvider<T> = Omit<T, "metadata_provider" | "metadata_id">;

type ShowWithDetails = OmitProvider<MediaShow> & {
  episodes_count: number;
  seasons_count: number;
};

type MediaSeason = {
  id: number;
  metadata_id: string;
  metadata_provider: string;
  show_id: number;
  number: number;
  release_date: string;
  plot: string;
  rating: number;
  poster: string;
  blur_data: string;
};

type SeasonWithDetails = OmitProvider<MediaSeason> & {
  episodes_count: number;
};

type MediaEpisode = {
  id: number;
  video_id: number;
  metadata_id: string;
  metadata_provider: string;
  season_id: number;
  title: string;
  number: number;
  plot: string;
  release_date: string;
  rating: number;
  poster: string;
  blur_data: string;
};

type EpisodeWithDetails = OmitProvider<MediaEpisode> & {
  duration: number;
  local_title: string;
  previews_amount: number;
  subtitles_amount: number;
};

type MediaVideo = {
  id: number;
  path: string;
  local_title: string;
  size: number;
  duration: number;
  video_codec: string;
  audio_codec: string;
  scan_date: string;
};

type MediaSubtitles = {
  id: number;
  language: string;
  path: string;
  size: number;
  video_id: number;
};

type MediaPreviews = {
  id: number;
  path: string;
  amount: number;
  video_id: number;
};

export type {
  ShowWithDetails,
  SeasonWithDetails,
  EpisodeWithDetails,
  ServerTask,
  EventKind,
  LogLevel,
  LogMessage,
};
