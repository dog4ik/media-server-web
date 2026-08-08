import { useQuery } from "@tanstack/solid-query";
import {
  createContext,
  createMemo,
  type ParentProps,
  useContext,
} from "solid-js";
import { createStore, unwrap } from "solid-js/store";
import type { MediaSessionState } from "@/lib/mediaSession";
import { throwResponseErrors } from "@/utils/errors";
import { type Schemas, server } from "@/utils/serverApi";
import tracing from "@/utils/tracing";

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

function elementVideoTracks(video: HTMLVideoElement) {
  if ("videoTracks" in video) {
    return video.videoTracks as { enabled: boolean }[];
  }
}

export function isBrowserVideoTracksSupported() {
  return "videoTracks" in HTMLVideoElement.prototype;
}

export function isBrowserAudioTracksSupported() {
  return "audioTracks" in HTMLVideoElement.prototype;
}

function subtitleQueryKey(
  sub: SelectedSubtitleTrack | undefined,
  subtitleTracks: Schemas["DetailedSubtitleTrack"][],
) {
  if (!sub) return ["subtitles", null];
  if (sub.origin === "external") return ["subtitles", "external", sub.id];
  if (sub.origin === "imported") {
    return ["subtitles", "imported", sub.text.length, sub.text.slice(0, 200)];
  }
  const rawTrack = unwrap(
    sub as Extract<SelectedSubtitleTrack, { origin: "container" }>,
  ).track;
  const idx = subtitleTracks.indexOf(rawTrack);
  return ["subtitles", "container", idx];
}

function createSelectionContext(session: () => MediaSessionState) {
  let video = createMemo(() => session().video);
  const defaultSubtitles = video().defaultSubtitles();
  let [store, setStore] = createStore<TracksSelection>({
    video: video().defaultVideo(),
    audio: video().defaultAudio(),
    subtitles: defaultSubtitles
      ? { origin: "container", track: defaultSubtitles }
      : undefined,
  });

  const fetchedSubtitles = useQuery(() => ({
    queryFn: async () => {
      const sub = store.subtitles;
      if (!sub) return;
      tracing.trace("Fetching subtitles");

      if (sub.origin === "container") {
        const rawTrack = unwrap(
          sub as Extract<SelectedSubtitleTrack, { origin: "container" }>,
        ).track;
        const selectedTrackIdx =
          video().details.subtitle_tracks.indexOf(rawTrack);
        if (selectedTrackIdx === -1) {
          tracing.warn(
            { videoSubtitlesTracksLen: video().details.subtitle_tracks.length },
            "Selected track is not found in video",
          );
          return;
        }
        tracing.debug({ selectedTrackIdx }, "Fetching container subtitles");
        return await server
          .GET("/api/video/{id}/pull_subtitle", {
            params: {
              query: { number: selectedTrackIdx },
              path: { id: video().details.id },
            },
            parseAs: "text",
          })
          .then(throwResponseErrors);
      }

      if (sub.origin === "external") {
        const { id } = sub;
        tracing.debug({ id }, "Fetching external subtitles");
        const res = await server
          .GET("/api/subtitles/{id}", {
            params: { path: { id } },
            parseAs: "text",
          })
          .then(throwResponseErrors);
        return res;
      }

      if (sub.origin === "imported") {
        return sub.text;
      }
    },
    throwOnError: false,
    enabled: store.subtitles !== undefined,
    queryKey: subtitleQueryKey(
      store.subtitles,
      video().details.subtitle_tracks,
    ),
  }));

  function selectAudioTrack(index: number) {
    if (index >= video().details.audio_tracks.length) {
      tracing.error(
        `Selected audio track is out of bounds ${index + 1}/${video().details.audio_tracks.length}`,
      );
      return;
    }
    setStore("audio", video().details.audio_tracks[index]);
    const selectedVideoTrack = unwrap(store.video);
    let videoTrackIndex = selectedVideoTrack
      ? video().details.video_tracks.indexOf(selectedVideoTrack)
      : -1;
    session().changeConfiguration({
      audio_track: index,
      video_track: videoTrackIndex === -1 ? 0 : videoTrackIndex,
    });
  }

  function audioTracks() {
    return video().details.audio_tracks;
  }

  function selectVideoTrack(index: number, element?: HTMLVideoElement) {
    if (index >= video().details.video_tracks.length) {
      tracing.error(
        `Selected video track is out of bounds ${index + 1}/${video().details.video_tracks.length}`,
      );
      return;
    }
    if (element) {
      elementVideoTracks(element)?.forEach((t, i) => {
        t.enabled = i === index;
      });
    }
    setStore("video", video().details.video_tracks[index]);
  }

  function videoTracks() {
    return video().details.video_tracks;
  }

  function selectContainerSubtitlesTrack(index: number) {
    tracing.trace({ index }, "Selecting container subtitles");
    if (index >= video().details.subtitle_tracks.length) {
      tracing.error(
        `Selected subtitles track is out of bounds ${index + 1}/${video().details.subtitle_tracks.length}`,
      );
      return;
    }
    setStore("subtitles", {
      origin: "container",
      track: video().details.subtitle_tracks[index],
    });
  }

  function selectExternalSubtitlesTrack(id: number) {
    tracing.trace({ id }, "Selecting external subtitles");
    setStore("subtitles", { origin: "external", id });
  }

  function selectImportedSubtitlesTrack(text: string) {
    setStore("subtitles", { origin: "imported", text });
  }

  function unsetSubtitlesTrack() {
    setStore("subtitles", undefined);
  }

  function containerSubtitlesTracks() {
    return video().details.subtitle_tracks;
  }

  function externalSubtitlesTracks() {
    return video().details.subtitles;
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

type Props = { video: MediaSessionState } & ParentProps;

export default function TracksSelectionProvider(props: Props) {
  let context = () => createSelectionContext(() => props.video);
  return (
    <TracksSelectionContext.Provider value={context()}>
      {props.children}
    </TracksSelectionContext.Provider>
  );
}
