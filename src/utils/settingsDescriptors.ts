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

/** All server side settings are declared in this object*/
export const SETTINGS: Settings = {
  intro_min_duration: {
    description:
      "Minimal intro duration in seconds. With very low values things like netflix logo will be considered as intro",
    name: "intro_min_duration",
    long_name: "Minimal intro duration",
  },
  intro_detection_ffmpeg_build: {
    description:
      "Path to the FFmpeg build that supports Chromaprint. Required for intro detection feature to work",
    name: "intro_detection_ffmpeg_build",
    long_name: "FFmpeg build for intro detection",
    typeHint: "path",
  },
  movie_folders: {
    description:
      "List of directories that contain movie files. All movie files from these directories will show up in the library",
    name: "movie_folders",
    long_name: "Movie directories",
    typeHint: "pathArr",
  },
  port: {
    description:
      "The network port on which the server listens for incoming connections",
    name: "port",
    long_name: "Server Port",
  },
  show_folders: {
    description:
      "List of directories that contain show files. All episode files from these directories will show up in the library",
    name: "show_folders",
    long_name: "Show directories",
    typeHint: "pathArr",
  },
  hw_accel: {
    description:
      "Enable hardware acceleration to significantly improve transcoding performance, if supported by the system",
    long_name: "Hardware acceleration",
    name: "hw_accel",
  },
  ffmpeg_path: {
    description:
      "Path to ffmpeg binary. This ffmpeg binary will be used for media transcoding tasks",
    long_name: "Ffmpeg path",
    name: "ffmpeg_path",
    typeHint: "path",
  },
  ffprobe_path: {
    description:
      "Path to ffprobe binary. This setting will be deprecated in favor of ffmpeg builtin abi",
    long_name: "Ffprobe path",
    name: "ffprobe_path",
    typeHint: "path",
  },
  tmdb_key: {
    description:
      "API key for TMDB. Allows server to authenticate with TMDB metadata provider",
    name: "tmdb_key",
    long_name: "TMDB key",
    typeHint: "secret",
  },
  tvdb_key: {
    description:
      "API key for TVDB. Allows server to authenticate with TVDB metadata provider",
    name: "tvdb_key",
    long_name: "TVDB key",
    typeHint: "secret",
  },
  web_ui_path: {
    description:
      "Path to Web UI files, useful when Web UI located in a separate directory",
    name: "web_ui_path",
    long_name: "Web UI path",
    typeHint: "path",
  },
  upnp_enabled: {
    description:
      "Enable SSDP (Simple Service Discovery Protocol) for UPnP. This allows the server to be discovered on the local network by compatible devices",
    name: "upnp_enabled",
    long_name: "Enable UPnP discovery",
  },
  upnp_ttl: {
    description: "Time to live duration of SSDP packet on the local network",
    name: "upnp_ttl",
    long_name: "SSDP TTL",
  },
  metadata_language: {
    description:
      "Language to fetch metadata in. Selected language will be used in names, description and posters",
    name: "metadata_language",
    long_name: "Metadata Language",
  },
} as const;
