import { fullUrl, Schemas, server } from "@/utils/serverApi";
import { HlsSession } from "./hls";
import { ProgressiveDownload } from "./progressive_download";
import { throwResponseErrors } from "@/utils/errors";
import { Compatibility } from "@/utils/mediaCapabilities";
import { Video } from "@/utils/library";
import tracing from "@/utils/tracing";
import {
  isBrowserAudioTracksSupported,
  isBrowserVideoTracksSupported,
} from "@/pages/Watch/TracksSelectionContext";

export interface PlaybackMethod {
  attach(video: HTMLVideoElement, contentUrl: string): Promise<void>;
  destroy(video: HTMLVideoElement): Promise<void>;
}

type Session = {
  id: string;
  video_element: HTMLVideoElement;
} & (
  | {
      type: "direct";
      method: ProgressiveDownload;
    }
  | {
      type: "hls";
      method: HlsSession;
    }
);

type PlaybackConfiguration = {
  audio_track: number;
  video_track: number;
};

export class MediaSessionState {
  session?: Session;

  configuration: PlaybackConfiguration;
  constructor(
    public video: Video,
    private variant_id?: string,
  ) {
    this.configuration = { audio_track: 0, video_track: 0 };
  }

  async start(video_element: HTMLVideoElement) {
    if (this.session) {
      await server.DELETE("/api/tasks/watch_session/{id}", {
        params: { path: { id: this.session.id } },
      });
      await this.session.method.destroy(this.session.video_element);
    }

    let compatibility = await this.video.videoCompatibility(this.configuration);
    let session_id: string;
    let can_use_direct_stream =
      compatibility.combined?.supported &&
      this.video.isContainerSupported() &&
      (this.configuration.video_track === 0 ||
        isBrowserVideoTracksSupported()) &&
      (this.configuration.audio_track === 0 || isBrowserAudioTracksSupported());

    if (can_use_direct_stream) {
      session_id = await this.createDirectSession(video_element);
      await this.session?.method.attach(
        video_element,
        directStreamUrl(this.video.details.id),
      );
    } else {
      session_id = await this.createHlsSession(video_element, compatibility);
      await this.session?.method.attach(
        video_element,
        hlsStreamUrl(session_id),
      );
    }
    return session_id;
  }

  private async createDirectSession(video_element: HTMLVideoElement) {
    tracing.debug("Using direct playback method");
    let streamId = await server
      .POST("/api/watch/direct/start/{id}", {
        params: { path: { id: this.video.details.id } },
        body: { variant_id: this.variant_id },
      })
      .then(throwResponseErrors);
    let session = new ProgressiveDownload();
    this.session = {
      type: "direct",
      method: session,
      video_element,
      id: streamId.task_id,
    };
    return streamId.task_id;
  }

  async changeConfiguration(new_config: PlaybackConfiguration) {
    if (
      new_config.audio_track === this.configuration.audio_track &&
      new_config.video_track === this.configuration.video_track
    ) {
      return;
    }
    this.configuration = new_config;
    return await this.start(this.session!.video_element);
  }

  private async createHlsSession(
    video_element: HTMLVideoElement,
    compatibility: Partial<Compatibility>,
  ) {
    let audio_codec: Schemas["AudioCodec"] | undefined = undefined;
    let video_codec: Schemas["VideoCodec"] | undefined = undefined;
    if (!compatibility.audio?.supported) {
      audio_codec = "aac";
    }
    if (!compatibility.video?.supported) {
      video_codec = "h264";
    }

    tracing.debug(
      {
        video_codec,
        audio_codec,
      },
      "Using hls playback method",
    );
    let streamId = await server
      .POST("/api/watch/hls/start/{id}", {
        params: { path: { id: this.video.details.id } },
        body: {
          variant_id: this.variant_id,
          audio_track: this.configuration.audio_track,
          audio_codec,
          video_track: this.configuration.video_track,
          video_codec,
        },
      })
      .then(throwResponseErrors);

    let session = new HlsSession();
    this.session = {
      type: "hls",
      method: session,
      video_element,
      id: streamId.task_id,
    };
    return streamId.task_id;
  }
}

function directStreamUrl(videoId: number) {
  let url = fullUrl("/api/video/{id}/watch", {
    query: undefined,
    path: { id: videoId },
  });
  return url;
}

function hlsStreamUrl(streamId: string) {
  return fullUrl("/api/watch/hls/{id}/manifest", { path: { id: streamId } });
}
