import { Schemas } from "../serverApi";
import { commonAACProfile, getAACAudio } from "./audio/aac";
import { getAC3Audio } from "./audio/ac3";
import { getEAC3Audio } from "./audio/eac3";
import { getAVCCodec, getMaxAVCLevel } from "./video/avc";
import { getHevcVideo, getMaxHEVCLevel } from "./video/hevc";

export type Compatibility = {
  video: MediaCapabilitiesDecodingInfo;
  audio: MediaCapabilitiesDecodingInfo;
  combined: MediaCapabilitiesDecodingInfo;
};

type VideoTrack = Schemas["DetailedVideo"]["video_tracks"][number];
type AudioTrack = Schemas["DetailedVideo"]["audio_tracks"][number];

export async function isCompatible(video: VideoTrack, audio: AudioTrack) {
  let videoCodecs: string | undefined;
  let audioCodecs: string | undefined;

  if (video.codec == "h264") {
    videoCodecs = getAVCCodec(video.profile, video.level);
  }
  if (video.codec == "hevc") {
    videoCodecs = getHevcVideo(video.profile, video.level);
  }

  if (audio.codec == "aac" && audio.profile) {
    audioCodecs = getAACAudio(audio.profile);
  }
  if (audio.codec == "ac3") {
    audioCodecs = getAC3Audio();
  }

  if (typeof audio.codec == "object" && audio.codec.other == "eac3") {
    audioCodecs = getEAC3Audio();
  }

  let fullVideoMime = `video/mp4; codecs=${videoCodecs}`;
  let fullAudioMime = `audio/mp4; codecs=${audioCodecs}`;

  let audioConfig = {
    contentType: fullAudioMime,
    profile: audio.profile,
    channels: audio.channels.toString(),
    samplerate: +audio.sample_rate,
  };

  let { width, height } = video.resolution;
  let videoConfig = {
    bitrate: video.bitrate,
    contentType: fullVideoMime,
    framerate: video.framerate,
    width,
    height,
  };

  return await checkCompatibility({
    video: videoConfig,
    audio: audioConfig,
  });
}

async function checkCompatibility(configuration: {
  video?: VideoConfiguration;
  audio?: AudioConfiguration;
}) {
  let combinedQuery = navigator.mediaCapabilities.decodingInfo({
    type: "media-source",
    video: configuration.video,
    audio: configuration.audio,
  });
  let videoQuery = navigator.mediaCapabilities.decodingInfo({
    type: "media-source",
    video: configuration.video,
  });
  let audioQuery = navigator.mediaCapabilities.decodingInfo({
    type: "media-source",
    audio: configuration.audio,
  });
  let [video, audio, combined] = await Promise.all([
    videoQuery,
    audioQuery,
    combinedQuery,
  ]);
  return { video, audio, combined };
}

export async function canPlayAfterTranscode(
  resolution: Schemas["Resolution"],
  framerate: number,
  videoCodec?: Schemas["VideoCodec"],
  audioCodec?: Schemas["AudioCodec"],
) {
  let videoSpec: string | undefined = undefined;
  let audioSpec: string | undefined = undefined;
  if (videoCodec == "h264") {
    let level = getMaxAVCLevel(resolution, framerate);
    // Assume profile is main
    let profile = "Main";
    if (level) videoSpec = getAVCCodec(profile, level);
  }
  if (videoCodec == "hevc") {
    let level = getMaxHEVCLevel(resolution, framerate);
    // Assume profile is main 10
    let profile = "Main 10";
    videoSpec = getHevcVideo(profile, level);
  }
  if (audioCodec == "aac") {
    audioSpec = commonAACProfile();
  }

  if (audioCodec == "ac3") {
    audioSpec = getAC3Audio();
  }

  if (typeof audioCodec == "object" && audioCodec.other == "eac3") {
    audioSpec = getEAC3Audio();
  }

  let videoConfig: VideoConfiguration | undefined = undefined;
  let audioConfig: AudioConfiguration | undefined = undefined;

  if (videoSpec) {
    let fullVideoMime = `video/mp4; codecs=${videoSpec}`;
    let { width, height } = resolution;
    videoConfig = {
      bitrate: 200_000,
      contentType: fullVideoMime,
      framerate,
      width,
      height,
    };
  }
  if (audioSpec) {
    let fullAudioMime = `audio/mp4; codecs=${audioSpec}`;
    audioConfig = {
      contentType: fullAudioMime,
    };
  }

  let combinedQuery = navigator.mediaCapabilities.decodingInfo({
    type: "media-source",
    video: videoConfig,
    audio: audioConfig,
  });
  let videoQuery = navigator.mediaCapabilities.decodingInfo({
    type: "media-source",
    video: videoConfig,
  });
  let audioQuery = navigator.mediaCapabilities.decodingInfo({
    type: "media-source",
    audio: audioConfig,
  });
  let [video, audio, combined] = await Promise.all([
    videoQuery,
    audioQuery,
    combinedQuery,
  ]);
  return { video, audio, combined };
}

// TODO: AV1, VP9/8 codecs
