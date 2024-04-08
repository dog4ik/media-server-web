import { AudioTrack, TranscodePayload, VideoTrack } from "../serverApi";
import { commonAACProfile, getAACAudio } from "./audio/aac";
import { getAC3Audio } from "./audio/ac3";
import { getEAC3Audio } from "./audio/eac3";
import { getAVCCodec, getMaxAVCLevel } from "./video/avc";
import { getHevcVideo, getMaxHEVCLevel } from "./video/hevc";

export type CanPlay = "yes" | "no" | "unknown";

export async function isCompatible(
  video: VideoTrack,
  audio: AudioTrack,
): Promise<CanPlay> {
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

  if (!videoCodecs || !audioCodecs) return "unknown";

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

  let result = await checkCompatibility({
    video: videoConfig,
    audio: audioConfig,
  });
  return result.supported ? "yes" : "no";
}

export async function checkCompatibility(configuration: {
  video?: VideoConfiguration;
  audio?: AudioConfiguration;
}) {
  return await navigator.mediaCapabilities
    .decodingInfo({
      type: "media-source",
      video: configuration.video,
      audio: configuration.audio,
    })
    .then((result) => {
      console.log(
        `This configuration is ${
          result.supported ? "" : "not "
        }supported`.toUpperCase(),
      );
      return result;
    });
}

export async function canPlayAfterTranscode(
  payload: TranscodePayload["payload"],
  framerate: number,
): Promise<CanPlay> {
  let videoCodec = payload.video_codec;
  let audioCodec = payload.audio_codec;
  let video: string | undefined = undefined;
  let audio: string | undefined = undefined;
  if (videoCodec == "h264") {
    let level = getMaxAVCLevel(payload.resolution, framerate);
    // Assume profile is main
    let profile = "Main";
    if (!level) return "unknown";
    video = getAVCCodec(profile, level);
  }
  if (videoCodec == "hevc") {
    let level = getMaxHEVCLevel(payload.resolution, framerate);
    // Assume profile is main 10
    let profile = "Main 10";
    video = getHevcVideo(profile, level);
  }
  if (audioCodec == "aac") {
    audio = commonAACProfile();
  }

  if (audioCodec == "ac3") {
    audio = getAC3Audio();
  }

  if (!video || !audio) return "unknown";

  let fullVideoMime = `video/mp4; codecs=${video}`;
  let fullAudioMime = `audio/mp4; codecs=${audio}`;

  console.log(video);
  console.log(audio);

  let audioConfig = {
    contentType: fullAudioMime,
  };

  let { width, height } = payload.resolution;
  let videoConfig = {
    bitrate: 200_000,
    contentType: fullVideoMime,
    framerate,
    width,
    height,
  };

  let result = await checkCompatibility({
    video: videoConfig,
    audio: audioConfig,
  });
  return result.supported ? "yes" : "no";
}

// TODO: AV1, VP9/8 codecs
