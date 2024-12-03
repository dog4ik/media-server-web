import { Schemas } from "./serverApi";

type Config = Schemas["ConfigSchema"];

type SettingTypeHint = "path" | "pathArr" | "secret";

type Variable<T extends Config[number]["key"]> = {
  description: string;
  name: T;
  long_name: string;
  typeHint?: SettingTypeHint;
};

export type Settings = { [K in Config[number]["key"]]: Variable<K> };

export const SETTINGS: Settings = {
  intro_min_duration: {
    description:
      "Minimal intro duration in seconds. With very low values things like netflix logo will be considered as intro",
    name: "intro_min_duration",
    long_name: "Minimal intro duration",
  },
  intro_detection_ffmpeg_build: {
    description: "Path to the FFmpeg build that supports Chromaprint",
    name: "intro_detection_ffmpeg_build",
    long_name: "FFmpeg build for intro detection",
  },
  movie_folders: {
    description: "List of directories that contain movie files",
    name: "movie_folders",
    long_name: "Movie directories",
    typeHint: "pathArr",
  },
  port: {
    description: "Server port",
    name: "port",
    long_name: "Port",
  },
  show_folders: {
    description: "List of directories that contain show files",
    name: "show_folders",
    long_name: "Show directories",
    typeHint: "pathArr",
  },
  hw_accel: {
    description: "Enable ffmpeg hardware acceleration",
    long_name: "Hardware acceleration",
    name: "hw_accel",
  },
  ffmpeg_path: {
    description: "Path to ffmpeg binary",
    long_name: "Ffmpeg path",
    name: "ffmpeg_path",
    typeHint: "path",
  },
  ffprobe_path: {
    description: "Path to ffprobe binary",
    long_name: "Ffprobe path",
    name: "ffprobe_path",
    typeHint: "path",
  },
  tmdb_key: {
    description: "API key for TMDB",
    name: "tmdb_key",
    long_name: "TMDB key",
    typeHint: "secret",
  },
  tvdb_key: {
    description: "API key for TVDB",
    name: "tvdb_key",
    long_name: "TVDB key",
    typeHint: "secret",
  },
  web_ui_path: {
    description:
      "Path to Web Ui files, useful when Web UI located in different directory",
    name: "web_ui_path",
    long_name: "Web UI path",
    typeHint: "path",
  },
  upnp_enabled: {
    description: "Enable ssdp discover and upnp service",
    name: "upnp_enabled",
    long_name: "Enable upnp",
  },
  upnp_ttl: {
    description: "Time to live duration of ssdp packet in the local network",
    name: "upnp_ttl",
    long_name: "SSDP ttl",
  },
  metadata_language: {
    description: "Language to fetch metadata in",
    name: "metadata_language",
    long_name: "Metadata language",
  },
} as const;
