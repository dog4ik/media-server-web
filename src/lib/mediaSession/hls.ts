import Hls from "hls.js";
import { PlaybackMethod } from ".";
import tracing from "@/utils/tracing";

export class HlsSession implements PlaybackMethod {
  hls: Hls;
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
    this.hls.attachMedia(video);
    this.hls.loadSource(url);
  }

  async destroy(_video: HTMLVideoElement) {
    this.hls.detachMedia();
    this.hls.destroy();
  }
}
