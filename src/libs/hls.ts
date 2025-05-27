import tracing from "@/utils/tracing";
import Hls from "hls.js";

export class HlsActiveSession {
  public session: Hls;
  private video: HTMLVideoElement;
  constructor(videoElement: HTMLVideoElement) {
    this.video = videoElement;
    this.session = new Hls({
      maxBufferLength: 30,
      lowLatencyMode: false,
      backBufferLength: Infinity,
    });
    this.session.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
      tracing.debug(
        "Manifest loaded, found " + data.levels.length + " quality level",
      );
    });
    this.session.on(Hls.Events.BACK_BUFFER_REACHED, (_event, _data) => {
      console.log("back buffer reached");
    });
    this.session.on(Hls.Events.BUFFER_EOS, (_event, _data) => {
      console.log("Buffer eos");
    });
    this.session.on(Hls.Events.ERROR, (_event, data) => {
      console.log(data);
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.MEDIA_ERROR:
            tracing.error("Fatal media error encountered, trying to recover");
            this.session.recoverMediaError();
            break;
          case Hls.ErrorTypes.NETWORK_ERROR:
            tracing.error("Fatal network error encountered trying to recover");
            this.session.startLoad();
            break;
          default:
            // cannot recover
            this.session.destroy();
            break;
        }
      }
    });
    this.session.attachMedia(this.video);
  }
}
