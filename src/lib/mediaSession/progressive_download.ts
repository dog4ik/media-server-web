import type { PlaybackMethod } from ".";

export class ProgressiveDownload implements PlaybackMethod {
  async attach(video: HTMLVideoElement, url: string) {
    video.src = url;
  }

  async destroy(video: HTMLVideoElement) {
    video.src = "";
  }
}
