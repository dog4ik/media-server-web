/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */


/** OneOf type helpers */
type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = (T | U) extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;
type OneOf<T extends any[]> = T extends [infer Only] ? Only : T extends [infer A, infer B, ...infer Rest] ? OneOf<[XOR<A, B>, ...Rest]> : never;

export type paths = {
  "/api/clear_db": {
    /** Clear the database. For debug purposes only. */
    delete: operations["clear_db"];
  };
  "/api/configuration": {
    /** Server configuartion */
    get: operations["server_configuration"];
    /** Update server configuartion */
    put: operations["update_server_configuration"];
  };
  "/api/configuration/providers": {
    /** Update providers order */
    get: operations["providers_order"];
    /** Update providers order */
    put: operations["order_providers"];
  };
  "/api/configuration/reset": {
    /** Reset server configuration to its defauts */
    post: operations["reset_server_configuration"];
  };
  "/api/configuration/schema": {
    /** Current server configuartion schema */
    get: operations["server_configuration_schema"];
  };
  "/api/episode/{id}/poster": {
    /** Get episode poster */
    get: operations["episode_poster"];
  };
  "/api/external_ids/{id}": {
    /** List external ids for desired content */
    get: operations["external_ids"];
  };
  "/api/external_to_local/{id}": {
    /** Map external to local id */
    get: operations["external_to_local_id"];
  };
  "/api/history": {
    /** Get all watch history of the default user. Have hard coded limit of 50 rows for now. */
    get: operations["all_history"];
    /** Delete all history for default user */
    delete: operations["clear_history"];
  };
  "/api/history/suggest/movies": {
    /** Suggest to continue watching up to 3 movies based on history */
    get: operations["suggest_movies"];
  };
  "/api/history/suggest/shows": {
    /** Suggest to continue watching up to 3 shows based on history */
    get: operations["suggest_shows"];
  };
  "/api/history/{id}": {
    /** Get history for specific video */
    get: operations["video_history"];
    /** Update/Insert history */
    put: operations["update_history"];
    /** Delete history for specific video */
    delete: operations["remove_history_item"];
  };
  "/api/local_episode/by_video": {
    /** Get local episode metadata by video's id */
    get: operations["local_episode_by_video_id"];
  };
  "/api/local_episode/{id}": {
    /** Local episode metadata by local episode id */
    get: operations["local_episode"];
  };
  "/api/local_movie/by_video": {
    /** Get local movie metadata by video's id */
    get: operations["local_movie_by_video_id"];
  };
  "/api/local_movies": {
    /** All local movies */
    get: operations["all_local_movies"];
  };
  "/api/local_shows": {
    /** All local shows */
    get: operations["all_local_shows"];
  };
  "/api/log/latest": {
    /** Latest log */
    get: operations["latest_log"];
  };
  "/api/mock_progress": {
    /** Create fake task and progress. For debug purposes only */
    post: operations["mock_progress"];
  };
  "/api/movie/{id}": {
    /** Get movie by id and provider */
    get: operations["get_movie"];
    /** Update movie metadata */
    put: operations["alter_movie_metadata"];
  };
  "/api/movie/{id}/backdrop": {
    /** Get movie backdrop image */
    get: operations["movie_backdrop"];
  };
  "/api/movie/{id}/poster": {
    /** Get movie poster */
    get: operations["movie_poster"];
  };
  "/api/scan": {
    /** Perform full library refresh */
    post: operations["reconciliate_lib"];
  };
  "/api/search/content": {
    /** Search for content. Allows to search for all types of content at once */
    get: operations["search_content"];
  };
  "/api/season/{id}/poster": {
    /** Get season poster */
    get: operations["season_poster"];
  };
  "/api/show/{id}": {
    /** Get show by id and provider */
    get: operations["get_show"];
    /** Update show metadata */
    put: operations["alter_show_metadata"];
  };
  "/api/show/{id}/backdrop": {
    /** Get show backdrop image */
    get: operations["show_backdrop"];
  };
  "/api/show/{id}/poster": {
    /** Get show poster */
    get: operations["show_poster"];
  };
  "/api/show/{id}/{season}": {
    /** Get season metadata */
    get: operations["get_season"];
    /** Update season metadata */
    put: operations["alter_season_metadata"];
  };
  "/api/show/{id}/{season}/{episode}": {
    /** Get episode metadata */
    get: operations["get_episode"];
    /** Update episode metadata */
    put: operations["alter_episode_metadata"];
  };
  "/api/tasks": {
    /** Get all running tasks */
    get: operations["get_tasks"];
  };
  "/api/tasks/progress": {
    /** SSE stream of current tasks progress */
    get: operations["progress"];
  };
  "/api/tasks/{id}": {
    /** Cancel task with provided id */
    delete: operations["cancel_task"];
  };
  "/api/torrent/download": {
    /** Download torrent */
    post: operations["download_torrent"];
  };
  "/api/torrent/parse_torrent_file": {
    /** Parse .torrent file */
    post: operations["parse_torrent_file"];
  };
  "/api/torrent/resolve_magnet_link": {
    /** Resolve magnet link */
    get: operations["resolve_magnet_link"];
  };
  "/api/torrent/search": {
    /** Search for torrent */
    get: operations["search_torrent"];
  };
  "/api/variants": {
    /** Get all variants in the library */
    get: operations["get_all_variants"];
  };
  "/api/video/by_content": {
    /** Get video by content local id */
    get: operations["contents_video"];
  };
  "/api/video/{id}": {
    /** Get video by id */
    get: operations["get_video_by_id"];
    /** Remove video from library. WARN: It will actually delete video file */
    delete: operations["remove_video"];
  };
  "/api/video/{id}/preview": {
    /** Get preview by video id */
    get: operations["previews"];
  };
  "/api/video/{id}/previews": {
    /** Start previews generation job on video */
    post: operations["generate_previews"];
    /** Delete previews on video */
    delete: operations["delete_previews"];
  };
  "/api/video/{id}/pull_subtitle": {
    /** Pull subtitle from video file */
    get: operations["pull_video_subtitle"];
  };
  "/api/video/{id}/transcode": {
    /** Start transcode video job */
    post: operations["transcode_video"];
  };
  "/api/video/{id}/variant/{variant_id}": {
    /** Remove variant from the library. WARN: It will actually delete video file */
    delete: operations["remove_variant"];
  };
  "/api/video/{id}/watch": {
    /** Video stream */
    get: operations["watch"];
  };
};

export type webhooks = Record<string, never>;

export type components = {
  schemas: {
    AppError: {
      kind: components["schemas"]["AppErrorKind"];
      message: string;
    };
    /** @enum {string} */
    AppErrorKind: "InternalError" | "NotFound" | "Duplicate" | "BadRequest";
    AppResources: {
      base_path: string;
      binary_path?: string | null;
      cache_path: string;
      database_path: string;
      ffmpeg_path?: string | null;
      ffprobe_path?: string | null;
      log_path: string;
      resources_path: string;
      temp_path: string;
    };
    AudioCodec: OneOf<["aac", "ac3", {
      other: string;
    }]>;
    Capabilities: {
      codecs: components["schemas"]["Codec"][];
    };
    Codec: {
      codec_type: components["schemas"]["CodecType"];
      decode_supported: boolean;
      encode_supported: boolean;
      long_name: string;
      name: string;
    };
    /** @enum {string} */
    CodecType: "audio" | "video" | "subtitle" | "data" | "attachment";
    /** @enum {string} */
    ContentType: "movie" | "show";
    DbExternalId: {
      /** Format: int64 */
      episode_id?: number | null;
      /** Format: int64 */
      id?: number | null;
      /** Format: int64 */
      is_prime: number;
      metadata_id: string;
      metadata_provider: string;
      /** Format: int64 */
      movie_id?: number | null;
      /** Format: int64 */
      season_id?: number | null;
      /** Format: int64 */
      show_id?: number | null;
    };
    DbHistory: {
      /** Format: int64 */
      id?: number | null;
      is_finished: boolean;
      /** Format: int64 */
      time: number;
      /** Format: date-time */
      update_time: string;
      /** Format: int64 */
      video_id: number;
    };
    DetailedAudioTrack: {
      /** Format: int32 */
      channels: number;
      codec: components["schemas"]["AudioCodec"];
      is_default: boolean;
      profile?: string | null;
      sample_rate: string;
    };
    DetailedSubtitleTrack: {
      codec: components["schemas"]["SubtitlesCodec"];
      is_default: boolean;
      language?: string | null;
    };
    DetailedVariant: {
      audio_tracks: components["schemas"]["DetailedAudioTrack"][];
      duration: components["schemas"]["SerdeDuration"];
      id: string;
      path: string;
      /** Format: int64 */
      size: number;
      video_tracks: components["schemas"]["DetailedVideoTrack"][];
    };
    DetailedVideo: {
      audio_tracks: components["schemas"]["DetailedAudioTrack"][];
      duration: components["schemas"]["SerdeDuration"];
      history?: components["schemas"]["DbHistory"] | null;
      /** Format: int64 */
      id: number;
      path: string;
      previews_count: number;
      scan_date: string;
      /** Format: int64 */
      size: number;
      subtitle_tracks: components["schemas"]["DetailedSubtitleTrack"][];
      variants: components["schemas"]["DetailedVariant"][];
      video_tracks: components["schemas"]["DetailedVideoTrack"][];
    };
    DetailedVideoTrack: {
      bitrate: number;
      codec: components["schemas"]["VideoCodec"];
      /** Format: double */
      framerate: number;
      is_default: boolean;
      /** Format: int32 */
      level: number;
      profile: string;
      resolution: components["schemas"]["Resolution"];
    };
    DownloadContentHint: {
      content_type: components["schemas"]["ContentType"];
      metadata_id: string;
      metadata_provider: components["schemas"]["MetadataProvider"];
    };
    EpisodeMetadata: {
      metadata_id: string;
      metadata_provider: components["schemas"]["MetadataProvider"];
      number: number;
      plot?: string | null;
      poster?: components["schemas"]["MetadataImage"] | null;
      release_date?: string | null;
      runtime: components["schemas"]["SerdeDuration"];
      season_number: number;
      title: string;
    };
    ExternalIdMetadata: {
      id: string;
      provider: components["schemas"]["MetadataProvider"];
    };
    /** @description Serializable config schema */
    FileConfigSchema: {
      ffmpeg_path: string;
      ffprobe_path: string;
      h264_preset: components["schemas"]["H264Preset"];
      hw_accel: boolean;
      movie_folders: string[];
      /** Format: int32 */
      port: number;
      scan_max_concurrency: number;
      show_folders: string[];
    };
    /** @enum {string} */
    H264Preset: "ultrafast" | "superfast" | "veryfast" | "faster" | "fast" | "medium" | "slow" | "slower" | "veryslow" | "placebo";
    JsonTracingEvent: {
      fields: {
        [key: string]: unknown;
      };
      level: string;
      name: string;
      target: string;
      timestamp: string;
    };
    /** Format: uri */
    MetadataImage: string;
    /** @enum {string} */
    MetadataProvider: "local" | "tmdb" | "tvdb" | "imdb";
    MetadataSearchResult: {
      content_type: components["schemas"]["ContentType"];
      metadata_id: string;
      metadata_provider: components["schemas"]["MetadataProvider"];
      plot?: string | null;
      poster?: components["schemas"]["MetadataImage"] | null;
      title: string;
    };
    MovieHistory: {
      history: components["schemas"]["DbHistory"];
      movie: components["schemas"]["MovieMetadata"];
    };
    MovieMetadata: {
      backdrop?: components["schemas"]["MetadataImage"] | null;
      metadata_id: string;
      metadata_provider: components["schemas"]["MetadataProvider"];
      plot?: string | null;
      poster?: components["schemas"]["MetadataImage"] | null;
      release_date?: string | null;
      title: string;
    };
    ProviderOrder: {
      order: string[];
      provider_type: components["schemas"]["ProviderType"];
    };
    /** @enum {string} */
    ProviderType: "discover" | "movie" | "show" | "torrent";
    Resolution: {
      height: number;
      width: number;
    };
    ResolvedTorrentFile: {
      /** Format: int64 */
      offset: number;
      path: string[];
      /** Format: int64 */
      size: number;
    };
    SeasonMetadata: {
      episodes: components["schemas"]["EpisodeMetadata"][];
      metadata_id: string;
      metadata_provider: components["schemas"]["MetadataProvider"];
      number: number;
      plot?: string | null;
      poster?: components["schemas"]["MetadataImage"] | null;
      release_date?: string | null;
    };
    SerdeDuration: {
      /** Format: int32 */
      nanos: number;
      /** Format: int64 */
      secs: number;
    };
    ServerConfiguration: {
      capabilities: components["schemas"]["Capabilities"];
      ffmpeg_path?: string | null;
      ffprobe_path?: string | null;
      h264_preset: components["schemas"]["H264Preset"];
      hw_accel: boolean;
      movie_folders: string[];
      /** Format: int32 */
      port: number;
      resources: components["schemas"]["AppResources"];
      scan_max_concurrency: number;
      show_folders: string[];
      tmdb_token?: string | null;
    };
    ShowHistory: {
      episode: components["schemas"]["EpisodeMetadata"];
      history: components["schemas"]["DbHistory"];
      /** Format: int64 */
      show_id: number;
    };
    ShowMetadata: {
      backdrop?: components["schemas"]["MetadataImage"] | null;
      episodes_amount?: number | null;
      metadata_id: string;
      metadata_provider: components["schemas"]["MetadataProvider"];
      plot?: string | null;
      poster?: components["schemas"]["MetadataImage"] | null;
      release_date?: string | null;
      /** @description Array of available season numbers */
      seasons?: number[] | null;
      title: string;
    };
    ShowSuggestion: {
      episode: components["schemas"]["EpisodeMetadata"];
      history?: components["schemas"]["DbHistory"] | null;
      /** Format: int64 */
      show_id: number;
    };
    SubtitlesCodec: (Record<string, unknown> | null) | string;
    Task: {
      cancelable: boolean;
      /** Format: date-time */
      created: string;
      /** Format: uuid */
      id: string;
      task: components["schemas"]["TaskKind"];
    };
    TaskKind: {
      target: string;
      /** @enum {string} */
      task_kind: "transcode";
    } | {
      target: string;
      /** @enum {string} */
      task_kind: "scan";
    } | {
      /** @enum {string} */
      task_kind: "fullscan";
    } | {
      target: string;
      /** @enum {string} */
      task_kind: "previews";
    } | {
      target: string;
      /** @enum {string} */
      task_kind: "subtitles";
    } | {
      /** Format: binary */
      info_hash: string;
      /** @enum {string} */
      task_kind: "torrent";
    };
    Torrent: {
      author?: string | null;
      /** Format: date-time */
      created: string;
      imdb_id: string;
      leechers: number;
      /** Format: uri */
      magnet: string;
      name: string;
      seeders: number;
      size: number;
    };
    TorrentContent: OneOf<[{
      show: components["schemas"]["TorrentShow"];
    }, {
      movie: components["schemas"]["TorrentMovie"][];
    }]>;
    TorrentContents: {
      content?: components["schemas"]["TorrentContent"] | null;
      files: components["schemas"]["ResolvedTorrentFile"][];
    };
    TorrentDownloadPayload: {
      content_hint?: components["schemas"]["DownloadContentHint"] | null;
      magnet_link: string;
      save_location?: string | null;
    };
    TorrentEpisode: {
      file_idx: number;
      metadata: components["schemas"]["EpisodeMetadata"];
    };
    TorrentInfo: {
      contents: components["schemas"]["TorrentContents"];
      name: string;
      /** Format: int32 */
      piece_length: number;
      pieces_amount: number;
      /** Format: int64 */
      total_size: number;
    };
    TorrentMovie: {
      file_idx: number;
      metadata: components["schemas"]["MovieMetadata"];
    };
    TorrentShow: {
      seasons: {
        [key: string]: components["schemas"]["TorrentEpisode"][];
      };
      show_metadata: components["schemas"]["ShowMetadata"];
    };
    TranscodePayload: {
      audio_codec?: components["schemas"]["AudioCodec"] | null;
      audio_track?: number | null;
      resolution?: components["schemas"]["Resolution"] | null;
      video_codec?: components["schemas"]["VideoCodec"] | null;
    };
    UpdateHistoryPayload: {
      is_finished: boolean;
      /** Format: int64 */
      time: number;
    };
    VariantSummary: {
      /** Format: int64 */
      content_id: number;
      content_type: components["schemas"]["ContentType"];
      poster?: string | null;
      title: string;
      variants: components["schemas"]["DetailedVariant"][];
      /** Format: int64 */
      video_id: number;
    };
    VideoCodec: OneOf<["hevc", "h264", {
      other: string;
    }]>;
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
};

export type $defs = Record<string, never>;

export type external = Record<string, never>;

export type operations = {

  /** Clear the database. For debug purposes only. */
  clear_db: {
    responses: {
      200: {
        content: {
          "text/plain": string;
        };
      };
    };
  };
  /** Server configuartion */
  server_configuration: {
    responses: {
      200: {
        content: {
          "application/json": components["schemas"]["ServerConfiguration"];
        };
      };
    };
  };
  /** Update server configuartion */
  update_server_configuration: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["FileConfigSchema"];
      };
    };
    responses: {
      /** @description Updated server configuration */
      200: {
        content: {
          "application/json": components["schemas"]["ServerConfiguration"];
        };
      };
    };
  };
  /** Update providers order */
  providers_order: {
    responses: {
      /** @description Ordering of providers */
      200: {
        content: {
          "application/json": components["schemas"]["ProviderOrder"][];
        };
      };
    };
  };
  /** Update providers order */
  order_providers: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["ProviderOrder"];
      };
    };
    responses: {
      /** @description Updated ordering of providers */
      200: {
        content: {
          "application/json": components["schemas"]["ProviderOrder"];
        };
      };
    };
  };
  /** Reset server configuration to its defauts */
  reset_server_configuration: {
    responses: {
      /** @description Updated server configuration */
      200: {
        content: {
          "application/json": components["schemas"]["ServerConfiguration"];
        };
      };
    };
  };
  /** Current server configuartion schema */
  server_configuration_schema: {
    responses: {
      200: {
        content: {
          "application/json": components["schemas"]["FileConfigSchema"];
        };
      };
    };
  };
  /** Get episode poster */
  episode_poster: {
    parameters: {
      path: {
        /** @description Episode id */
        id: number;
      };
    };
    responses: {
      /** @description Poster bytes */
      200: {
        content: {
          "application/octet-stream": string;
        };
      };
      304: {
        content: never;
      };
      404: {
        content: {
          "application/json": components["schemas"]["AppError"];
        };
      };
    };
  };
  /** List external ids for desired content */
  external_ids: {
    parameters: {
      query: {
        provider: "local" | "tmdb" | "tvdb" | "imdb";
        content_type: "movie" | "show";
      };
      path: {
        /** @description External id */
        id: string;
      };
    };
    responses: {
      /** @description External ids */
      200: {
        content: {
          "application/json": components["schemas"]["ExternalIdMetadata"][];
        };
      };
    };
  };
  /** Map external to local id */
  external_to_local_id: {
    parameters: {
      query: {
        provider: "local" | "tmdb" | "tvdb" | "imdb";
      };
      path: {
        /** @description External id */
        id: string;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": components["schemas"]["DbExternalId"];
        };
      };
      404: {
        content: {
          "application/json": components["schemas"]["AppError"];
        };
      };
    };
  };
  /** Get all watch history of the default user. Have hard coded limit of 50 rows for now. */
  all_history: {
    responses: {
      /** @description All history */
      200: {
        content: {
          "application/json": components["schemas"]["DbHistory"][];
        };
      };
    };
  };
  /** Delete all history for default user */
  clear_history: {
    responses: {
      200: {
        content: never;
      };
    };
  };
  /** Suggest to continue watching up to 3 movies based on history */
  suggest_movies: {
    responses: {
      /** @description Suggested movies */
      200: {
        content: {
          "application/json": components["schemas"]["MovieHistory"][];
        };
      };
    };
  };
  /** Suggest to continue watching up to 3 shows based on history */
  suggest_shows: {
    responses: {
      /** @description Suggested shows */
      200: {
        content: {
          "application/json": components["schemas"]["ShowSuggestion"][];
        };
      };
    };
  };
  /** Get history for specific video */
  video_history: {
    parameters: {
      path: {
        /** @description Video id */
        id: number;
      };
    };
    responses: {
      /** @description History of desired video */
      200: {
        content: {
          "application/json": components["schemas"]["DbHistory"][];
        };
      };
      404: {
        content: never;
      };
    };
  };
  /** Update/Insert history */
  update_history: {
    parameters: {
      path: {
        /** @description Video id */
        id: number;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["UpdateHistoryPayload"];
      };
    };
    responses: {
      200: {
        content: never;
      };
      201: {
        content: never;
      };
    };
  };
  /** Delete history for specific video */
  remove_history_item: {
    parameters: {
      path: {
        /** @description Video id */
        id: number;
      };
    };
    responses: {
      200: {
        content: never;
      };
    };
  };
  /** Get local episode metadata by video's id */
  local_episode_by_video_id: {
    parameters: {
      query: {
        id: number;
      };
    };
    responses: {
      /** @description Local episode */
      200: {
        content: {
          "application/json": components["schemas"]["EpisodeMetadata"];
        };
      };
    };
  };
  /** Local episode metadata by local episode id */
  local_episode: {
    parameters: {
      path: {
        /** @description Local id */
        id: number;
      };
    };
    responses: {
      /** @description Local episode */
      200: {
        content: {
          "application/json": components["schemas"]["EpisodeMetadata"];
        };
      };
    };
  };
  /** Get local movie metadata by video's id */
  local_movie_by_video_id: {
    parameters: {
      query: {
        id: number;
      };
    };
    responses: {
      /** @description Local movie */
      200: {
        content: {
          "application/json": components["schemas"]["MovieMetadata"];
        };
      };
    };
  };
  /** All local movies */
  all_local_movies: {
    responses: {
      /** @description All local movies */
      200: {
        content: {
          "application/json": components["schemas"]["MovieMetadata"][];
        };
      };
    };
  };
  /** All local shows */
  all_local_shows: {
    responses: {
      /** @description All local shows */
      200: {
        content: {
          "application/json": components["schemas"]["ShowMetadata"][];
        };
      };
    };
  };
  /** Latest log */
  latest_log: {
    responses: {
      200: {
        content: {
          "application/json": components["schemas"]["JsonTracingEvent"][];
        };
      };
    };
  };
  /** Create fake task and progress. For debug purposes only */
  mock_progress: {
    parameters: {
      query: {
        id: string;
      };
    };
    responses: {
      200: {
        content: never;
      };
    };
  };
  /** Get movie by id and provider */
  get_movie: {
    parameters: {
      query: {
        provider: "local" | "tmdb" | "tvdb" | "imdb";
      };
      path: {
        /** @description Movie id */
        id: string;
      };
    };
    responses: {
      /** @description Requested movie */
      200: {
        content: {
          "application/json": components["schemas"]["MovieMetadata"];
        };
      };
      404: {
        content: {
          "application/json": components["schemas"]["AppError"];
        };
      };
    };
  };
  /** Update movie metadata */
  alter_movie_metadata: {
    parameters: {
      path: {
        /** @description Movie id */
        id: number;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["MovieMetadata"];
      };
    };
    responses: {
      200: {
        content: never;
      };
    };
  };
  /** Get movie backdrop image */
  movie_backdrop: {
    parameters: {
      path: {
        /** @description Movie id */
        id: number;
      };
    };
    responses: {
      /** @description Backdrop bytes */
      200: {
        content: {
          "application/octet-stream": string;
        };
      };
      304: {
        content: never;
      };
      404: {
        content: {
          "application/json": components["schemas"]["AppError"];
        };
      };
    };
  };
  /** Get movie poster */
  movie_poster: {
    parameters: {
      path: {
        /** @description Movie id */
        id: number;
      };
    };
    responses: {
      /** @description Poster bytes */
      200: {
        content: {
          "application/octet-stream": string;
        };
      };
      304: {
        content: never;
      };
      404: {
        content: {
          "application/json": components["schemas"]["AppError"];
        };
      };
    };
  };
  /** Perform full library refresh */
  reconciliate_lib: {
    responses: {
      200: {
        content: never;
      };
    };
  };
  /** Search for content. Allows to search for all types of content at once */
  search_content: {
    parameters: {
      query: {
        search: string;
      };
    };
    responses: {
      /** @description Content search results */
      200: {
        content: {
          "application/json": components["schemas"]["MetadataSearchResult"][];
        };
      };
    };
  };
  /** Get season poster */
  season_poster: {
    parameters: {
      path: {
        /** @description Season id */
        id: number;
      };
    };
    responses: {
      /** @description Poster bytes */
      200: {
        content: {
          "application/octet-stream": string;
        };
      };
      304: {
        content: never;
      };
      404: {
        content: {
          "application/json": components["schemas"]["AppError"];
        };
      };
    };
  };
  /** Get show by id and provider */
  get_show: {
    parameters: {
      query: {
        provider: "local" | "tmdb" | "tvdb" | "imdb";
      };
      path: {
        /** @description Show id */
        id: string;
      };
    };
    responses: {
      /** @description Requested show */
      200: {
        content: {
          "application/json": components["schemas"]["ShowMetadata"];
        };
      };
      404: {
        content: {
          "application/json": components["schemas"]["AppError"];
        };
      };
    };
  };
  /** Update show metadata */
  alter_show_metadata: {
    parameters: {
      path: {
        /** @description Show id */
        id: number;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["ShowMetadata"];
      };
    };
    responses: {
      200: {
        content: never;
      };
    };
  };
  /** Get show backdrop image */
  show_backdrop: {
    parameters: {
      path: {
        /** @description Show id */
        id: number;
      };
    };
    responses: {
      /** @description Response with image */
      200: {
        content: {
          "application/octet-stream": string;
        };
      };
      304: {
        content: never;
      };
      /** @description Image not found */
      404: {
        content: {
          "application/json": components["schemas"]["AppError"];
        };
      };
    };
  };
  /** Get show poster */
  show_poster: {
    parameters: {
      path: {
        /** @description Show id */
        id: number;
      };
    };
    responses: {
      /** @description Poster bytes */
      200: {
        content: {
          "application/octet-stream": string;
        };
      };
      304: {
        content: never;
      };
      404: {
        content: {
          "application/json": components["schemas"]["AppError"];
        };
      };
    };
  };
  /** Get season metadata */
  get_season: {
    parameters: {
      query: {
        provider: "local" | "tmdb" | "tvdb" | "imdb";
      };
      path: {
        /** @description Show id */
        id: string;
        /** @description Season number */
        season: number;
      };
    };
    responses: {
      /** @description Desired season metadata */
      200: {
        content: {
          "application/json": components["schemas"]["SeasonMetadata"];
        };
      };
      404: {
        content: {
          "application/json": components["schemas"]["AppError"];
        };
      };
    };
  };
  /** Update season metadata */
  alter_season_metadata: {
    parameters: {
      path: {
        /** @description Show id */
        id: number;
        /** @description Season number */
        season: number;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["SeasonMetadata"];
      };
    };
    responses: {
      200: {
        content: never;
      };
    };
  };
  /** Get episode metadata */
  get_episode: {
    parameters: {
      query: {
        provider: "local" | "tmdb" | "tvdb" | "imdb";
      };
      path: {
        /** @description Show id */
        id: string;
        /** @description Season number */
        season: number;
        /** @description Episode number */
        episode: number;
      };
    };
    responses: {
      /** @description Desired episode metadata */
      200: {
        content: {
          "application/json": components["schemas"]["EpisodeMetadata"];
        };
      };
      404: {
        content: {
          "application/json": components["schemas"]["AppError"];
        };
      };
    };
  };
  /** Update episode metadata */
  alter_episode_metadata: {
    parameters: {
      path: {
        /** @description Show id */
        id: number;
        /** @description Season number */
        season: number;
        /** @description Episode number */
        episode: number;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["EpisodeMetadata"];
      };
    };
    responses: {
      200: {
        content: never;
      };
    };
  };
  /** Get all running tasks */
  get_tasks: {
    responses: {
      200: {
        content: {
          "application/json": components["schemas"]["Task"][];
        };
      };
      /** @description Task can't be canceled or it is not found */
      400: {
        content: never;
      };
    };
  };
  /** SSE stream of current tasks progress */
  progress: {
    responses: {
      200: {
        content: {
          "application/octet-stream": string;
        };
      };
    };
  };
  /** Cancel task with provided id */
  cancel_task: {
    parameters: {
      path: {
        /** @description Video id */
        id: string;
      };
    };
    responses: {
      200: {
        content: never;
      };
      /** @description Task can't be canceled or it is not found */
      400: {
        content: never;
      };
    };
  };
  /** Download torrent */
  download_torrent: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["TorrentDownloadPayload"];
      };
    };
    responses: {
      200: {
        content: never;
      };
    };
  };
  /** Parse .torrent file */
  parse_torrent_file: {
    parameters: {
      path: {
        content_type: ("movie" | "show") | null;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": components["schemas"]["TorrentInfo"];
        };
      };
      /** @description Failed to parse torrent file */
      400: {
        content: never;
      };
    };
  };
  /** Resolve magnet link */
  resolve_magnet_link: {
    parameters: {
      query: {
        magnet_link: string;
        /** @description Content type */
        content_type?: components["schemas"]["ContentType"] | null;
        /** @description Metadata provider */
        metadata_provider?: components["schemas"]["MetadataProvider"] | null;
        /** @description Metadata id */
        metadata_id?: string | null;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": components["schemas"]["TorrentInfo"];
        };
      };
      /** @description Failed to parse magnet link */
      400: {
        content: never;
      };
    };
  };
  /** Search for torrent */
  search_torrent: {
    parameters: {
      query: {
        search: string;
      };
    };
    responses: {
      /** @description Torrent search results */
      200: {
        content: {
          "application/json": components["schemas"]["Torrent"][];
        };
      };
    };
  };
  /** Get all variants in the library */
  get_all_variants: {
    responses: {
      /** @description All variants */
      200: {
        content: {
          "application/json": components["schemas"]["VariantSummary"][];
        };
      };
    };
  };
  /** Get video by content local id */
  contents_video: {
    parameters: {
      query: {
        content_type: "movie" | "show";
        id: number;
      };
    };
    responses: {
      /** @description Desired video */
      200: {
        content: {
          "application/json": components["schemas"]["DetailedVideo"];
        };
      };
      /** @description Video is not found */
      404: {
        content: never;
      };
    };
  };
  /** Get video by id */
  get_video_by_id: {
    parameters: {
      path: {
        /** @description Video id */
        id: number;
      };
    };
    responses: {
      /** @description Requested video */
      200: {
        content: {
          "application/json": components["schemas"]["DetailedVideo"];
        };
      };
    };
  };
  /** Remove video from library. WARN: It will actually delete video file */
  remove_video: {
    parameters: {
      path: {
        /** @description Video id */
        id: number;
      };
    };
    responses: {
      200: {
        content: never;
      };
    };
  };
  /** Get preview by video id */
  previews: {
    parameters: {
      query: {
        number: number;
      };
      path: {
        /** @description video id */
        id: number;
      };
    };
    responses: {
      /** @description Binary image */
      200: {
        content: {
          "application/octet-stream": string;
        };
      };
      304: {
        content: never;
      };
      /** @description Preiew is not found */
      404: {
        content: {
          "application/json": components["schemas"]["AppError"];
        };
      };
    };
  };
  /** Start previews generation job on video */
  generate_previews: {
    parameters: {
      path: {
        /** @description Video id */
        id: number;
      };
    };
    responses: {
      200: {
        content: never;
      };
    };
  };
  /** Delete previews on video */
  delete_previews: {
    parameters: {
      path: {
        /** @description Video id */
        id: number;
      };
    };
    responses: {
      200: {
        content: never;
      };
    };
  };
  /** Pull subtitle from video file */
  pull_video_subtitle: {
    parameters: {
      query: {
        number: number;
      };
      path: {
        /** @description video id */
        id: number;
      };
    };
    responses: {
      /** @description Subtitle */
      200: {
        content: {
          "text/plain": string;
        };
      };
      /** @description Video is not found */
      404: {
        content: {
          "application/json": components["schemas"]["AppError"];
        };
      };
    };
  };
  /** Start transcode video job */
  transcode_video: {
    parameters: {
      path: {
        /** @description Video id */
        id: number;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["TranscodePayload"];
      };
    };
    responses: {
      200: {
        content: never;
      };
    };
  };
  /** Remove variant from the library. WARN: It will actually delete video file */
  remove_variant: {
    parameters: {
      path: {
        /** @description Video id */
        id: number;
        /** @description Variant id */
        variant_id: string;
      };
    };
    responses: {
      200: {
        content: never;
      };
    };
  };
  /** Video stream */
  watch: {
    parameters: {
      query?: {
        variant?: string | null;
      };
      path: {
        /** @description video id */
        id: number;
      };
    };
    responses: {
      /** @description Video stream */
      200: {
        content: {
          "application/octet-stream": string;
        };
      };
      /** @description Video is not found */
      404: {
        content: {
          "application/json": components["schemas"]["AppError"];
        };
      };
    };
  };
};
