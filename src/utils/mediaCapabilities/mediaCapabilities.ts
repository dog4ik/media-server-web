import { Schemas } from "../serverApi";
import { commonAACProfile, getAACAudio } from "./audio/aac";
import { getAC3Audio } from "./audio/ac3";
import { getDTSAudio } from "./audio/dts";
import { getEAC3Audio } from "./audio/eac3";
import { getAv1Codec } from "./video/av1";
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
  if (!("mediaCapabilities" in navigator)) {
    throw Error("mediaCapabilities api is not supported");
  }
  let videoCodecs: string | undefined;
  let audioCodecs: string | undefined;

  if (video.codec == "h264") {
    videoCodecs = getAVCCodec(video.profile_idc, video.level);
  }
  if (video.codec == "hevc") {
    videoCodecs = getHevcVideo(video.profile_idc, video.level);
  }
  if (video.codec == "av1") {
    videoCodecs = getAv1Codec();
  }
  if (video.codec == "vp9") {
    videoCodecs = getVp9Codec();
  }
  if (video.codec == "vp8") {
    videoCodecs = getVp8Codec();
  }

  if (audio.codec == "aac") {
    audioCodecs = getAACAudio(audio.profile_idc);
  }
  if (audio.codec == "ac3") {
    audioCodecs = getAC3Audio();
  }
  if (audio.codec == "dts") {
    audioCodecs = getDTSAudio(audio.profile_idc);
  }
  if (audio.codec == "eac3") {
    audioCodecs = getEAC3Audio();
  }

  let fullVideoMime = `video/mp4; codecs=${videoCodecs}`;
  let fullAudioMime = `audio/mp4; codecs=${audioCodecs}`;

  let audioConfig = {
    contentType: fullAudioMime,
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
  if (!("mediaCapabilities" in navigator)) {
    throw Error("mediaCapabilities api is not supported");
  }
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
  if (!("mediaCapabilities" in navigator)) {
    throw Error("mediaCapabilities api is not supported");
  }
  let videoSpec: string | undefined = undefined;
  let audioSpec: string | undefined = undefined;
  if (videoCodec == "h264") {
    let level = getMaxAVCLevel(resolution, framerate);
    // Assume profile is Main
    let profile = 77;
    if (level) videoSpec = getAVCCodec(profile, level);
  }
  if (videoCodec == "hevc") {
    let level = getMaxHEVCLevel(resolution, framerate);
    // Assume profile is Main 10
    let profile = 2;
    videoSpec = getHevcVideo(profile, level);
  }
  if (videoCodec == "av1") {
    videoSpec = getAv1Codec();
  }
  if (videoCodec == "vp9") {
    videoSpec = getVp9Codec();
  }
  if (videoCodec == "vp8") {
    videoSpec = getVp8Codec();
  }

  if (audioCodec == "aac") {
    audioSpec = commonAACProfile();
  }
  if (audioCodec == "ac3") {
    audioSpec = getAC3Audio();
  }
  if (audioCodec == "dts") {
    audioSpec = getDTSAudio();
  }
  if (audioCodec == "eac3") {
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
