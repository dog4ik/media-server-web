import { Match, Show, Switch, createEffect, createSignal, onCleanup } from "solid-js";
import { Description, DescriptionSkeleton } from "@/components/Description";
import { fullUrl, Schemas } from "@/utils/serverApi";
import DownloadTorrentModal from "@/components/modals/TorrentDownload";
import { setBackdrop } from "@/context/BackdropContext";
import { formatSE } from "@/utils/formats";
import Icon from "@/components/ui/Icon";
import { FiDownload } from "solid-icons/fi";
import VideoActions from "@/components/Description/VideoActions";
import { extendEpisode, extendShow, posterList, Video } from "@/utils/library";
import { IntroBar } from "@/components/Description/IntroBar";
import {
  ListItemSkeleton,
  VideoList,
  VideoSelection,
} from "@/components/Description/VideoList";
import { getRouteApi, linkOptions } from "@tanstack/solid-router";
import { queryApi } from "@/utils/queryApi";
import { useQuery } from "@tanstack/solid-query";

export type SelectedSubtitles =
  | {
      origin: "container";
      index: number;
    }
  | {
      origin: "external";
      id: number;
    };

export type TrackSelection = {
  subtitlesTrack?: SelectedSubtitles;
  videoTrack?: number;
  audioTrack?: number;
};

export default function Episode() {
  let route = getRouteApi("/page/shows/$id/$season/$episode");
  let params = route.useParams();
  let search = route.useSearch();
  let [torrentModal, setTorrentModal] = createSignal(false);
  let [selectedVideo, setSelectedVideo] = createSignal<VideoSelection>();

  let episode = queryApi.useQuery(
    "get",
    "/api/show/{id}/{season}/{episode}",
    () => ({
      params: {
        path: {
          episode: +params().episode,
          id: params().id,
          season: +params().season,
        },
        query: {
          provider: search().provider,
        },
      },
    }),
    () => ({
      select: (episode) => extendEpisode(episode, params().id),
    }),
  );

  let show = queryApi.useQuery(
    "get",
    "/api/show/{id}",
    () => ({
      params: {
        path: { id: params().id },
        query: { provider: search().provider },
      },
    }),
    () => ({ select: extendShow }),
  );

  let local = queryApi.useQuery(
    "get",
    "/api/external_to_local/{id}",
    () => ({
      params: {
        query: { provider: show.latest()?.metadata_provider! },
        path: { id: show.latest()?.metadata_id! },
      },
    }),
    () => ({
      enabled: show.isSuccess && show.latest()?.metadata_provider !== "local",
      select: (data) => data.show_id,
      retry: false,
    }),
  );
  let localId = () =>
    show.latest()?.metadata_provider === "local"
      ? show.latest()?.metadata_id
      : local.latest();

  createEffect(() => {
    if (show.data) {
      let localImage =
        show.data.metadata_provider == "local"
          ? fullUrl("/api/show/{id}/backdrop", {
              path: { id: +show.data.metadata_id },
            })
          : undefined;
      setBackdrop([localImage, show.data.backdrop ?? undefined]);
    }
  });

  let videos = queryApi.useQuery(
    "get",
    "/api/video/by_content",
    () => ({
      params: {
        query: { id: +episode.latest()?.metadata_id!, content_type: "show" },
      },
    }),
    () => ({
      select: (videos) => videos.map((v) => new Video(v)),
      enabled: episode.latest()?.metadata_provider == "local",
    }),
  );

  createEffect(() => {
    if (selectedVideo() === undefined) {
      let video = videos.data?.at(0)!;
      setSelectedVideo(video ? { video_id: video.details.id } : undefined);
    }
  });

  let video = () => videos.latest()?.at(0);

  let watchUrl = () => {
    let selection = selectedVideo();
    if (!selection) {
      return;
    }
    let { video_id, variant_id } = selection;

    let id = localId();
    if (!id) return;
    return linkOptions({
      to: "/shows/$id/$season/$episode/watch",
      params: {
        id: params().id,
        season: params().season,
        episode: params().episode,
      },
      search: {
        video_id,
        variant_id,
      },
    });
  };

  return (
    <>
      <Show when={show.latest() && episode.latest()}>
        {(_) => {
          let showData = show.latest()!;
          let episodeData = episode.latest()!;
          let torrentQuery = (provider: Schemas["TorrentIndexIdentifier"]) => {
            if (provider == "tpb")
              return `${showData.title} S${formatSE(episodeData.season_number)}E${formatSE(episodeData.number)}`;
            if (provider == "rutracker") {
              return `${showData.title} Сезон: ${episodeData.season_number}`;
            }
            throw Error(`Unsupported torrent index ${provider}`);
          };
          return (
            <DownloadTorrentModal
              open={torrentModal()}
              metadata_id={showData.metadata_id}
              onClose={() => setTorrentModal(false)}
              metadata_provider={search().provider}
              query={torrentQuery}
              content_type="show"
            />
          );
        }}
      </Show>
      <div class="space-y-5 p-4">
        <Switch>
          <Match when={episode.isLoading || show.isLoading}>
            <DescriptionSkeleton direction="horizontal" />
          </Match>
          <Match when={episode.latest()}>
            {(episode) => {
              return (
                <Description
                  title={episode().title}
                  posterList={posterList(episode())}
                  progress={
                    video()?.details.history
                      ? {
                          history: video()!.details.history!,
                          runtime: video()!.details.duration.secs,
                        }
                      : undefined
                  }
                  plot={episode().plot}
                  imageDirection="horizontal"
                  additionalInfo={[
                    {
                      info: `${show.latest()?.title}`,
                      link: linkOptions({
                        to: "/shows/$id",
                        params: {
                          id: params().id,
                        },
                        search: { provider: search().provider },
                      }),
                    },
                    {
                      info: `Season ${episode().season_number}`,
                      link: linkOptions({
                        to: "/shows/$id",
                        params: {
                          id: params().id,
                        },
                        search: {
                          provider: search().provider,
                          season: +params().season,
                        },
                      }),
                    },
                    { info: `Episode ${episode().number}`, link: undefined },
                    episode().release_date
                      ? { info: episode().release_date!, link: undefined }
                      : undefined,
                  ].filter((i) => i !== undefined)}
                >
                  <div class="flex items-center gap-2">
                    <Show
                      when={video()}
                      fallback={
                        <Icon
                          tooltip="Download"
                          onClick={() => setTorrentModal(true)}
                        >
                          <FiDownload size={30} />
                        </Icon>
                      }
                    >
                      {(video) => (
                        <VideoActions video={video()} watchUrl={watchUrl()}>
                          <Icon
                            tooltip="Download"
                            onClick={() => setTorrentModal(true)}
                          >
                            <FiDownload size={30} />
                          </Icon>
                        </VideoActions>
                      )}
                    </Show>
                    <div class="w-96">
                      <Show
                        when={videos.latest()?.find((v) => v.details.intro)}
                      >
                        {(video) => (
                          <IntroBar
                            totalDuration={video().details.duration.secs}
                            intro={video().details.intro!}
                          />
                        )}
                      </Show>
                    </div>
                  </div>
                </Description>
              );
            }}
          </Match>
        </Switch>
        <Switch>
          <Match
            when={videos.isLoading || (!videos.isEnabled && episode.isLoading)}
          >
            <ListItemSkeleton />
          </Match>
          <Match when={videos.latest()}>
            {(videos) => (
              <>
                <Show
                  when={
                    selectedVideo() &&
                    (videos().length > 0 ||
                      videos().some((v) => v.details.variants.length > 0))
                  }
                >
                  <VideoList
                    selectedVideo={selectedVideo()!}
                    onVideoSelect={setSelectedVideo}
                    videos={videos()}
                  />
                </Show>
              </>
            )}
          </Match>
        </Switch>
      </div>
    </>
  );
}
