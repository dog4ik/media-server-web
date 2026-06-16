import Hls from "hls.js";
import { PlaybackMethod } from ".";
import tracing from "@/utils/tracing";

const BACKWARD_SEEK_FLUSH_THRESHOLD = 0.5;

export class HlsSession implements PlaybackMethod {
  hls: Hls;
  private video?: HTMLVideoElement;
  // Last observed playback position, used to detect backward seeks.
  private lastTime = 0;

  private handleTimeUpdate = () => {
    if (this.video && !this.video.seeking) {
      this.lastTime = this.video.currentTime;
    }
  };

  private handleSeeking = () => {
    const video = this.video;
    if (!video) return;
    const target = video.currentTime;
    // flush the buffer when sought backwards so we don't play segments of the old hls job.
    if (target < this.lastTime - BACKWARD_SEEK_FLUSH_THRESHOLD) {
      this.hls.trigger(Hls.Events.BUFFER_FLUSHING, {
        startOffset: 0,
        endOffset: Infinity,
        type: null,
      });
    }
    this.lastTime = target;
  };

  constructor() {
    this.hls = new Hls({
      maxBufferLength: 30,
      lowLatencyMode: false,
      backBufferLength: Infinity,
    });
    this.hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
      tracing.debug("Manifest loaded, found " + data.levels.length + " quality level");
    });
    this.hls.on(Hls.Events.BACK_BUFFER_REACHED, (_event, _data) => {
      console.log("back buffer reached");
    });
    this.hls.on(Hls.Events.BUFFER_EOS, (_event, _data) => {
      console.log("Buffer eos");
    });
    this.hls.on(Hls.Events.ERROR, (_event, data) => {
      console.log(data);
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.MEDIA_ERROR:
            tracing.error("Fatal media error encountered, trying to recover");
            this.hls.recoverMediaError();
            break;
          case Hls.ErrorTypes.NETWORK_ERROR:
            tracing.error("Fatal network error encountered trying to recover");
            this.hls.startLoad();
            break;
          default:
            // cannot recover
            this.hls.destroy();
            break;
        }
      }
    });
  }

  async attach(video: HTMLVideoElement, url: string) {
    this.video = video;
    this.lastTime = video.currentTime;
    video.addEventListener("timeupdate", this.handleTimeUpdate);
    video.addEventListener("seeking", this.handleSeeking);
    this.hls.attachMedia(video);
    this.hls.loadSource(url);
  }

  async destroy(video: HTMLVideoElement) {
    video.removeEventListener("timeupdate", this.handleTimeUpdate);
    video.removeEventListener("seeking", this.handleSeeking);
    this.video = undefined;
    this.hls.detachMedia();
    this.hls.destroy();
  }
}
