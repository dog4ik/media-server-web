import { Video } from "@/utils/library";
import { Schemas, server } from "@/utils/serverApi";
import tracing from "@/utils/tracing";
import { createAsync } from "@solidjs/router";
import { ParentProps, createContext, useContext } from "solid-js";
import { createStore, unwrap } from "solid-js/store";

type TracksSelectionContextType = ReturnType<typeof createSelectionContext>;

export const TracksSelectionContext =
  createContext<TracksSelectionContextType>();

export const useTracksSelection = () => {
  let context = useContext(TracksSelectionContext);
  if (!context) {
    let m = "Tracks selection context is not available";
    tracing.error(m);
    throw new Error(m);
  }
  return context;
};

export type SelectedSubtitleTrack =
  | {
      origin: "container";
      track: Schemas["DetailedSubtitleTrack"];
    }
  | {
      origin: "external";
      id: number;
    }
  | {
      origin: "imported";
      text: string;
    };

type TracksSelection = {
  audio?: Schemas["DetailedAudioTrack"];
  video?: Schemas["DetailedVideoTrack"];
  subtitles?: SelectedSubtitleTrack;
};

type BrowserTrack = {
  id: string;
  kind: string;
  label: string;
  language: string;
  enabled: boolean;
};

export function debugBrowserTracksSupport(video: HTMLVideoElement) {
  if ("audioTracks" in video) {
    tracing.debug("audioTracks api is supported");
  } else {
    tracing.warn("audioTracks api is not supported");
  }

  if ("videoTracks" in video) {
    tracing.debug("videoTracks api is supported");
  } else {
    tracing.warn("videoTracks api is not supported");
  }
}

function elementAudioTracks(video: HTMLVideoElement) {
  if ("audioTracks" in video) {
    return video.audioTracks as BrowserTrack[];
  }
}

function elementVideoTracks(video: HTMLVideoElement) {
  if ("videoTracks" in video) {
    return video.videoTracks as BrowserTrack[];
  }
}

export function isBrowserVideoTracksSupported() {
  return typeof "VideoTracks" != "undefined";
}

export function isBrowserAudioTracksSupported() {
  return typeof "AudioTracks" != "undefined";
}

function createSelectionContext(video: Video) {
  let [store, setStore] = createStore<TracksSelection>({
    video: video.defaultVideo(),
    audio: video.defaultAudio(),
    subtitles: video.defaultSubtitles()
      ? { origin: "container", track: video.defaultSubtitles()! }
      : undefined,
  });

  let fetchedSubtitles = createAsync(async () => {
    if (!store.subtitles) return;
    tracing.trace("Fetching subtitles");
    if (store.subtitles && store.subtitles.origin === "container") {
      let track = unwrap(store.subtitles.track);
      let selectedTrackIdx = video.details.subtitle_tracks.findIndex(
        (t) => t === track,
      );
      if (selectedTrackIdx == -1) {
        tracing.warn(
          { videoSubtitlesTracksLen: video.details.subtitle_tracks.length },
          "Selected track is not found in video",
        );
        return;
      }
      tracing.debug({ selectedTrackIdx }, `Fetching container subtitles`);
      return await server
        .GET("/api/video/{id}/pull_subtitle", {
          params: {
            query: {
              number: selectedTrackIdx,
            },
            path: {
              id: video.details.id,
            },
          },
          parseAs: "text",
        })
        .then((r) => r.data);
    }

    if (store.subtitles?.origin == "external") {
      let id = store.subtitles.id;
      tracing.debug({ id }, "Fetching external subtitles");
      // todo: fetch external subtitles
      return;
    }

    if (store.subtitles?.origin == "imported") {
      return store.subtitles.text;
    }
  });

  function selectAudioTrack(index: number, element?: HTMLVideoElement) {
    if (index >= video.details.audio_tracks.length) {
      tracing.error(
        `Selected audio track is out of bounds ${index + 1}/${video.details.audio_tracks.length}`,
      );
      return;
    }
    if (element) {
      let atracks = elementAudioTracks(element);
      if (!atracks) return;
      for (let i = 0; i < atracks.length; ++i) {
        let t = atracks[i];
        if (i == index) {
          t.enabled = true;
        } else {
          t.enabled = false;
        }
      }
    }
    setStore("audio", video.details.audio_tracks[index]);
  }

  function audioTracks() {
    return video.details.audio_tracks;
  }

  function selectVideoTrack(index: number, element?: HTMLVideoElement) {
    if (index >= video.details.video_tracks.length) {
      tracing.error(
        `Selected video track is out of bounds ${index + 1}/${video.details.video_tracks.length}`,
      );
      return;
    }
    if (element) {
      elementVideoTracks(element)?.forEach((t, i) => {
        if (i == index) {
          t.enabled = true;
        } else {
          t.enabled = false;
        }
      });
    }
    setStore("video", video.details.video_tracks[index]);
  }

  function videoTracks() {
    return video.details.video_tracks;
  }

  function selectContainerSubtitlesTrack(index: number) {
    tracing.trace({ index }, "Selecting container subittles");
    if (index >= video.details.subtitle_tracks.length) {
      tracing.error(
        `Selected subtitles track is out of bounds ${index + 1}/${video.details.subtitle_tracks.length}`,
      );
      return;
    }
    setStore("subtitles", {
      origin: "container",
      track: video.details.subtitle_tracks[index],
    });
  }

  function selectExternalSubtitlesTrack(id: number) {
    tracing.trace({ id }, "Selecting external subittles");
    setStore("subtitles", {
      origin: "external",
      id,
    });
  }

  function selectImportedSubtitlesTrack(text: string) {
    setStore("subtitles", {
      origin: "imported",
      text,
    });
  }

  function unsetSubtitlesTrack() {
    setStore("subtitles", undefined);
  }

  function containerSubtitlesTracks() {
    return video.details.subtitle_tracks;
  }

  function externalSubtitlesTracks() {
    return video.details.subtitle_tracks;
  }

  return [
    {
      tracks: store,
      fetchedSubtitles,
      videoTracks,
      audioTracks,
      containerSubtitlesTracks,
      externalSubtitlesTracks,
    },
    {
      selectVideoTrack,

      selectAudioTrack,

      selectContainerSubtitlesTrack,
      selectExternalSubtitlesTrack,
      selectImportedSubtitlesTrack,
      unsetSubtitlesTrack,
    },
  ] as const;
}

type Props = { video: Video } & ParentProps;

export default function TracksSelectionProvider(props: Props) {
  let context = () => createSelectionContext(props.video);
  return (
    <TracksSelectionContext.Provider value={context()}>
      {props.children}
    </TracksSelectionContext.Provider>
  );
}
