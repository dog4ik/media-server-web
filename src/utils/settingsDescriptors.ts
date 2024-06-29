import { Schemas } from "./serverApi";

type Config = Schemas["FileConfigSchema"];

type SettingTypeHint = "path" | "pathArr";

type Variable<T extends keyof Config> = {
  description: string;
  name: T;
  long_name: string;
  typeHint?: SettingTypeHint;
};

export type Settings = Omit<
  { [K in keyof Required<Config>]: Variable<K> },
  "resources" | "capabilities"
>;

export const SETTINGS: Settings = {
  h264_preset: {
    description: "H264 codec preset",
    name: "h264_preset",
    long_name: "H264 Preset",
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
  scan_max_concurrency: {
    description: "I don't remember what it does",
    name: "scan_max_concurrency",
    long_name: "Max concurrency",
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
  },
  ffprobe_path: {
    description: "Path to ffprobe binary",
    long_name: "Ffprobe path",
    name: "ffprobe_path",
  },
} as const;
