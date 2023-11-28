const MEDIA_SERVER_URL = import.meta.env.VITE_MEDIA_SERVER_URL!;
class MediaUrl extends URL {
  constructor(appendix: string) {
    let url = new URL(
      `/api${appendix}`,
      import.meta.env.VITE_MEDIA_SERVER_URL!,
    );
    super(url);
  }

  async fetch<T>(): Promise<T> {
    return await fetch(super.toString()).then(
      async (data) =>
        await data.json().catch((e) => {
          console.log(
            "media server error on route: ",
            super.pathname,
            "with message",
            e.message,
          );
        }),
    );
  }
}

class AdminMediaUrl extends URL {
  constructor(appendix: string) {
    let url = new URL(
      `/admin${appendix}`,
      import.meta.env.VITE_MEDIA_SERVER_URL!,
    );
    super(url);
  }

  async fetch<T>(): Promise<T> {
    return await fetch(super.toString()).then(
      async (data) =>
        await data.json().catch((e) => {
          console.log(
            "media server error on route: ",
            super.pathname,
            "with message",
            e.message,
          );
        }),
    );
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
  console.log("req url", url.search);
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
  let url = new AdminMediaUrl("/log");
  // TODO: create log type
  return await url.fetch<ServerTask[]>();
}

// mutations

export async function cancelTaskMutation(task_id: string) {
  let headers = new Headers();
  headers.append("Content-type", "application/json");
  return await fetch(MEDIA_SERVER_URL + "/admin/cancel_task", {
    method: "POST",
    headers,
    body: JSON.stringify({ task_id }),
  }).then((res) => res.ok);
}

//types

type EventKind = "transcode" | "scan" | "previews";

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
};
