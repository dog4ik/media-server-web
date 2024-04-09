import { cache } from "@solidjs/router";
import {
  BaseError,
  NotFoundError,
  ServerError,
  UnavailableError,
} from "./errors";

async function handleResponse(response: Response) {
  if (!response.ok) {
    if (response.status == 404) {
      console.log("404");
      throw new NotFoundError();
    }
    throw new ServerError();
  }
  return await response.json().catch(() => {
    throw new ServerError();
  });
}

function fetchCatch(e: Error) {
  if (e instanceof BaseError) {
    throw e;
  }
  throw new UnavailableError("Server is not available");
}

const MEDIA_SERVER_URL = import.meta.env.VITE_MEDIA_SERVER_URL!;

export function getVideoUrl(
  videoId: number | string,
  variantId?: number | string,
) {
  let url = new MediaUrl(`/watch`);
  url.searchParams.append("id", videoId.toString());
  if (variantId !== undefined)
    url.searchParams.append("variant", variantId.toString());
  return url;
}

class MediaUrl extends URL {
  constructor(appendix: string) {
    let url = new URL(`/api${appendix}`, MEDIA_SERVER_URL);
    super(url);
  }

  async fetch<T>(): Promise<T> {
    return await fetch(super.toString()).then(handleResponse).catch(fetchCatch);
  }
}

class AdminMediaUrl extends URL {
  constructor(appendix: string) {
    let url = new URL(`/admin${appendix}`, MEDIA_SERVER_URL);
    super(url);
  }

  async fetch<T>(): Promise<T> {
    return await fetch(super.toString()).then(handleResponse).catch(fetchCatch);
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
    return await fetch(this.url, options).then(async (res) => {
      let text = await res.text();
      if (text.length > 0) return JSON.parse(text);
    });
  }
}

async function sleep(time: number) {
  await new Promise((res) => setTimeout(res, time));
}

export const getAllShows = cache(async (page?: number) => {
  let url = new MediaUrl("/local_shows");
  if (page !== undefined) url.searchParams.append("page", page.toString());
  return await url.fetch<ShowMetadata[]>();
}, "allshows");

export const getShow = cache(
  async (showId: string, provider: MetadataProvider) => {
    let url = new MediaUrl(`/show/${showId}`);
    url.searchParams.append("provider", provider);
    return await url.fetch<ShowMetadata>();
  },
  "show",
);

export const getSeason = cache(
  async (showId: string, season: number, provider: MetadataProvider) => {
    let url = new MediaUrl(`/show/${showId}/${season}`);
    url.searchParams.append("provider", provider);
    return await url.fetch<SeasonMetadata>();
  },
  "season",
);

export const getEpisode = cache(
  async (
    showId: string,
    season: number,
    episode: number,
    provider: MetadataProvider,
  ) => {
    let url = new MediaUrl(`/show/${showId}/${season}/${episode}`);
    url.searchParams.append("provider", provider);
    return await url.fetch<EpisodeMetadata>();
  },
  "episode",
);

export const getVideoById = cache(async (videoId: number) => {
  let url = new MediaUrl(`/video/${videoId}`);
  return await url.fetch<Video>();
}, "video");

export const getLocalByExternalId = cache(
  async (externalId: string, provider: MetadataProvider) => {
    let url = new MediaUrl(
      `/external_to_local/${externalId}?provider=${provider}`,
    );
    return await url.fetch<ExternalToLocalId>();
  },
  "localbyexternalid",
);

export const getExternalIds = cache(
  async (
    externalId: string,
    content_type: ContentType,
    provider: MetadataProvider,
  ) => {
    let url = new MediaUrl(
      `/external_ids/${externalId}?provider=${provider}&content_type=${content_type}`,
    );
    return await url.fetch<ExternalId[]>();
  },
  "externalids",
);

export const getContentsVideo = cache(
  async (id: string, contentType: ContentType) => {
    let url = new MediaUrl(`/contents_video/${id}?content_type=${contentType}`);
    return await url.fetch<Video>();
  },
  "contents_video",
);

export const getAllVariants = cache(async () => {
  let url = new MediaUrl("/variants");
  return await url.fetch<AllVariantsSummary[]>();
}, "variants");

export const getActiveTasks = cache(async () => {
  // await sleep(2000);
  let url = new AdminMediaUrl("/tasks");
  return await url.fetch<Task[]>();
}, "tasks");

export const getLatestLog = cache(async () => {
  let url = new AdminMediaUrl("/latest_log");
  return await url.fetch<LogMessage[]>();
}, "latest_log");

export const searchContent = cache(async (query: string) => {
  let url = new MediaUrl("/search_content");
  url.searchParams.append("search", query);
  return await url.fetch<ContentSearchResult[]>();
}, "searchcontent");

export const searchTorrent = cache(async (query: string) => {
  let url = new MediaUrl("/search_torrent");
  url.searchParams.append("id", query);
  return await url.fetch<TorrentSearchResult[]>();
}, "searchtorrent");

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

export async function transcodeVideo(data: TranscodePayload) {
  let mutator = new AdminMutation("/transcode");
  return await mutator.mutate(data);
}

export async function removeVariant(data: RemoveVariantPayload) {
  let mutator = new AdminMutation("/remove_variant", "DELETE");
  return await mutator.mutate(data);
}

//types

export type RemoveVariantPayload = {
  video_id: number;
  variant_id: string;
};

export type VideoConfiguration = {
  video_codec: VideoCodec;
  audio_codec: AudioCodec;
  resolution: Resolution;
};

export type TranscodePayload = {
  payload: VideoConfiguration;
  video_id: number;
};

export type EventKind = "transcode" | "scan" | "previews";

export type LogLevel = "TRACE" | "DEBUG" | "INFO" | "ERROR";

export type Duration = {
  secs: number;
  nanos: number;
};

export type VideoCodec = "hevc" | "h264";
export type AudioCodec = "ac3" | "aac" | "eac3";

export type Resolution = {
  height: number;
  width: number;
};

export type LogMessage = {
  fields: { message?: string };
  level: LogLevel;
  name: string;
  target: string;
  timestamp: string;
};

export type Task = {
  id: string;
  target: string;
  kind: EventKind;
  cancelable: boolean;
};

export type VideoTrack = {
  is_default: boolean;
  resolution: Resolution;
  profile: string;
  level: number;
  bitrate: number;
  framerate: number;
  codec: VideoCodec;
};

export type AudioTrack = {
  is_default: boolean;
  sample_rate: string;
  channels: number;
  profile?: string;
  codec: AudioCodec;
};

export type AllVariantsSummary = {
  title: string;
  poster: string;
  video_id: number;
  variants: Variant[];
};

export type Video = {
  id: string;
  path: string;
  hash: string;
  local_title: string;
  size: number;
  bitrate: number;
  duration: Duration;
  video_tracks: VideoTrack[];
  audio_tracks: AudioTrack[];
  variants: Variant[];
  scan_date: string;
};

export type Variant = {
  id: string;
  path: string;
  size: number;
  video_tracks: VideoTrack[];
  audio_tracks: AudioTrack[];
  duration: Duration;
};

export type Subtitle = {
  id: number;
  language: string;
  path: string;
  size: number;
  video_id: number;
};

export type Previews = {
  id: number;
  path: string;
  amount: number;
  video_id: number;
};

export type TorrentSearchResult = {
  name: string;
  magnet: string;
  author?: string;
  leechers: number;
  seeders: number;
  size: number;
  created: string;
  imdb_id: string;
};

export type MetadataProvider = "local" | "tmdb" | "tvdb" | "imdb";
export type ContentType = "show" | "movie";

export type ContentSearchResult = {
  title: string;
  poster?: string;
  plot?: string;
  metadata_provider: MetadataProvider;
  metadata_id: string;
  content_type: ContentType;
};

export type MovieMetadata = {
  metadata_id: string;
  metadata_provider: string;
  poster: string;
  backdrop: string;
  plot: string;
  release_date: string;
  title: string;
};

export type ShowMetadata = {
  metadata_id: string;
  metadata_provider: string;
  poster: string;
  backdrop: string;
  plot: string;
  release_date: string;
  title: string;
  episodes_amount?: number;
  seasons?: number[];
};

export type SeasonMetadata = {
  metadata_id: String;
  metadata_provider: MetadataProvider;
  release_date: string;
  episodes: EpisodeMetadata[];
  plot: string;
  poster: string;
  number: number;
};

export type EpisodeMetadata = {
  metadata_id: string;
  metadata_provider: MetadataProvider;
  release_date: string;
  number: number;
  title: string;
  plot: string;
  season_number: number;
  runtime?: Duration;
  poster?: string;
};

export type CharacterMetadata = {
  actor: string;
  character: string;
  image: string;
};

export type ExternalId = {
  provider: MetadataProvider;
  id: string;
};

export type ExternalToLocalId = {
  show_id?: number;
  season_id?: number;
  episode_id?: number;
  movie_id?: number;
};
