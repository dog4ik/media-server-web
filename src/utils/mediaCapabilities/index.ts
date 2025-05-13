import { Schemas } from "../serverApi";
import tracing from "../tracing";
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

export async function isCompatible<
  V extends VideoTrack | undefined,
  A extends AudioTrack | undefined,
>(
  video: V,
  audio: A,
): Promise<{
  video: V extends VideoTrack ? MediaCapabilitiesDecodingInfo : undefined;
  audio: A extends AudioTrack ? MediaCapabilitiesDecodingInfo : undefined;
  combined: V extends VideoTrack
    ? A extends AudioTrack
      ? MediaCapabilitiesDecodingInfo
      : undefined
    : undefined;
}> {
  if (!("mediaCapabilities" in navigator)) {
    tracing.warn("mediaCapabilities api is not supported");
    throw Error("mediaCapabilities api is not supported");
  }
  let videoCodecs: string | undefined;
  let audioCodecs: string | undefined;

  if (video?.codec == "h264") {
    videoCodecs = getAVCCodec(video.profile_idc, video.level);
  }
  if (video?.codec == "hevc") {
    videoCodecs = getHevcVideo(video.profile_idc, video.level);
  }
  if (video?.codec == "av1") {
    videoCodecs = getAv1Codec();
  }
  if (video?.codec == "vp9") {
    videoCodecs = getVp9Codec();
  }
  if (video?.codec == "vp8") {
    videoCodecs = getVp8Codec();
  }

  if (audio?.codec == "aac") {
    audioCodecs = getAACAudio(audio.profile_idc);
  }
  if (audio?.codec == "ac3") {
    audioCodecs = getAC3Audio();
  }
  if (audio?.codec == "dts") {
    audioCodecs = getDTSAudio(audio.profile_idc);
  }
  if (audio?.codec == "eac3") {
    audioCodecs = getEAC3Audio();
  }

  let videoConfig = () => {
    if (videoCodecs !== undefined && video !== undefined) {
      let fullVideoMime = `video/mp4; codecs=${videoCodecs}`;
      let { width, height } = video.resolution;
      return {
        bitrate: video.bitrate,
        contentType: fullVideoMime,
        framerate: video.framerate,
        width,
        height,
      };
    }
  };

  let audioConfig = () => {
    if (audioCodecs !== undefined && audio !== undefined) {
      let fullAudioMime = `audio/mp4; codecs=${audioCodecs}`;
      return {
        contentType: fullAudioMime,
        channels: audio.channels.toString(),
        samplerate: +audio.sample_rate,
      };
    }
  };

  return (await checkCompatibility({
    video: videoConfig(),
    audio: audioConfig(),
  })) as any;
}

async function checkCompatibility(configuration: {
  video?: VideoConfiguration;
  audio?: AudioConfiguration;
}) {
  if (!("mediaCapabilities" in navigator)) {
    tracing.warn("mediaCapabilities api is not supported");
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
  let [video, audio, combined] = await Promise.allSettled([
    videoQuery,
    audioQuery,
    combinedQuery,
  ]).then((r) => r.map((r) => (r.status == "fulfilled" ? r.value : undefined)));
  tracing.debug(
    {
      videoSupported: video?.supported,
      audioSupport: audio?.supported,
      combinedSupport: combined?.supported,
    },
    `Media mediaCapabilities result`,
  );
  return { video, audio, combined };
}

export async function canPlayAfterTranscode(
  videoConfig?: {
    resolution: Schemas["Resolution"];
    framerate: number;
    videoCodec: Schemas["VideoCodec"];
  },
  audioConfig?: {
    audioCodec?: Schemas["AudioCodec"];
  },
) {
  if (!("mediaCapabilities" in navigator)) {
    throw Error("mediaCapabilities api is not supported");
  }
  let videoSpec: string | undefined = undefined;
  let audioSpec: string | undefined = undefined;
  if (videoConfig?.videoCodec == "h264") {
    let level = getMaxAVCLevel(videoConfig.resolution, videoConfig.framerate);
    // Assume profile is Main
    let profile = 77;
    if (level) videoSpec = getAVCCodec(profile, level);
  }
  if (videoConfig?.videoCodec == "hevc") {
    let level = getMaxHEVCLevel(videoConfig.resolution, videoConfig.framerate);
    // Assume profile is Main 10
    let profile = 2;
    videoSpec = getHevcVideo(profile, level);
  }
  if (videoConfig?.videoCodec == "av1") {
    videoSpec = getAv1Codec();
  }
  if (videoConfig?.videoCodec == "vp9") {
    videoSpec = getVp9Codec();
  }
  if (videoConfig?.videoCodec == "vp8") {
    videoSpec = getVp8Codec();
  }

  if (audioConfig?.audioCodec == "aac") {
    audioSpec = commonAACProfile();
  }
  if (audioConfig?.audioCodec == "ac3") {
    audioSpec = getAC3Audio();
  }
  if (audioConfig?.audioCodec == "dts") {
    audioSpec = getDTSAudio();
  }
  if (audioConfig?.audioCodec == "eac3") {
    audioSpec = getEAC3Audio();
  }

  let videoQueryConfig: VideoConfiguration | undefined = undefined;
  let audioQueryConfig: AudioConfiguration | undefined = undefined;

  if (videoSpec && videoConfig) {
    let fullVideoMime = `video/mp4; codecs=${videoSpec}`;
    let { width, height } = videoConfig.resolution;
    videoQueryConfig = {
      bitrate: 200_000,
      contentType: fullVideoMime,
      framerate: videoConfig.framerate,
      width,
      height,
    };
  }
  if (audioSpec && audioConfig) {
    let fullAudioMime = `audio/mp4; codecs=${audioSpec}`;
    audioQueryConfig = {
      contentType: fullAudioMime,
    };
  }

  let combinedQuery = navigator.mediaCapabilities.decodingInfo({
    type: "media-source",
    video: videoQueryConfig,
    audio: audioQueryConfig,
  });
  let videoQuery = navigator.mediaCapabilities.decodingInfo({
    type: "media-source",
    video: videoQueryConfig,
  });
  let audioQuery = navigator.mediaCapabilities.decodingInfo({
    type: "media-source",
    audio: audioQueryConfig,
  });
  let [video, audio, combined] = await Promise.all([
    videoQuery,
    audioQuery,
    combinedQuery,
  ]);
  return { video, audio, combined };
}
