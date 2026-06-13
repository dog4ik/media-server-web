import { MediaSessionState } from "@/lib/mediaSession";
import { Schemas, server } from "@/utils/serverApi";
import tracing from "@/utils/tracing";
import { useQuery } from "@tanstack/solid-query";
import { ParentProps, createContext, createMemo, useContext } from "solid-js";
import { createStore, unwrap } from "solid-js/store";

type TracksSelectionContextType = ReturnType<typeof createSelectionContext>;

export const TracksSelectionContext = createContext<TracksSelectionContextType>();

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
  const rawTrack = unwrap(sub as Extract<SelectedSubtitleTrack, { origin: "container" }>).track;
  const idx = subtitleTracks.findIndex((t) => t === rawTrack);
  return ["subtitles", "container", idx];
}

function createSelectionContext(session: () => MediaSessionState) {
  let video = createMemo(() => session().video);
  let [store, setStore] = createStore<TracksSelection>({
    video: video().defaultVideo(),
    audio: video().defaultAudio(),
    subtitles: video().defaultSubtitles()
      ? { origin: "container", track: video().defaultSubtitles()! }
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
        const selectedTrackIdx = video().details.subtitle_tracks.findIndex((t) => t === rawTrack);
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
          .then((r) => r.data);
      }

      if (sub.origin === "external") {
        const { id } = sub;
        tracing.debug({ id }, "Fetching external subtitles");
        const res = await server.GET("/api/subtitles/{id}", {
          params: { path: { id } },
          parseAs: "text",
        });
        if (res.error) {
          tracing.error({ message: res.error.message }, "Failed to fetch external subtitles");
        }
        return res.data;
      }

      if (sub.origin === "imported") {
        return sub.text;
      }
    },
    queryKey: subtitleQueryKey(store.subtitles, video().details.subtitle_tracks),
  }));

  function selectAudioTrack(index: number) {
    if (index >= video().details.audio_tracks.length) {
      tracing.error(
        `Selected audio track is out of bounds ${index + 1}/${video().details.audio_tracks.length}`,
      );
      return;
    }
    setStore("audio", video().details.audio_tracks[index]);
    let videoTrackIndex = video().details.video_tracks.findIndex((t) => t === unwrap(store.video));
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
        t.enabled = i == index;
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
