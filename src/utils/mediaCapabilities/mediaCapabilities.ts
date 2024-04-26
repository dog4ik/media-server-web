import { AudioTrack, TranscodePayload, VideoTrack } from "../serverApi";
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

  if (audio.codec == "eac3") {
    audioCodecs = getEAC3Audio();
  }

  let fullVideoMime = `video/mp4; codecs=${videoCodecs}`;
  let fullAudioMime = `audio/mp4; codecs=${audioCodecs}`;

  console.log(videoCodecs);
  console.log(audioCodecs);

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

export async function checkCompatibility(configuration: {
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
  console.log({ video, audio, combined });
  return { video, audio, combined };
}

export async function canPlayAfterTranscode(
  payload: TranscodePayload["payload"],
  framerate: number,
) {
  let videoCodec = payload.video_codec;
  let audioCodec = payload.audio_codec;
  let videoSpec: string | undefined = undefined;
  let audioSpec: string | undefined = undefined;
  if (videoCodec == "h264") {
    let level = getMaxAVCLevel(payload.resolution, framerate);
    // Assume profile is main
    let profile = "Main";
    if (level) videoSpec = getAVCCodec(profile, level);
  }
  if (videoCodec == "hevc") {
    let level = getMaxHEVCLevel(payload.resolution, framerate);
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

  let videoConfig: VideoConfiguration | undefined = undefined;
  let audioConfig: AudioConfiguration | undefined = undefined;

  if (videoSpec) {
    let fullVideoMime = `video/mp4; codecs=${videoSpec}`;
    let { width, height } = payload.resolution;
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
  console.log({ video, audio, combined });
  return { video, audio, combined };
}

// TODO: AV1, VP9/8 codecs
