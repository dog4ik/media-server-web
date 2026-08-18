import { getRouteApi, linkOptions } from "@tanstack/solid-router";
import Download from "lucide-solid/icons/download";
import {
  createEffect,
  createSignal,
  ErrorBoundary,
  Match,
  Show,
  Suspense,
  Switch,
} from "solid-js";
import { ActorSection } from "@/components/Cast/ActorSection";
import { Description, DescriptionSkeleton } from "@/components/Description";
import { IntroBar } from "@/components/Description/IntroBar";
import { ListActions } from "@/components/Description/ListActions";
import VideoActions from "@/components/Description/VideoActions";
import {
  ListItemSkeleton,
  VideoList,
  type VideoSelection,
} from "@/components/Description/VideoList";
import { errorBoundaryFallback } from "@/components/Error";
import DownloadTorrentModal from "@/components/modals/TorrentDownload";
import Icon from "@/components/ui/Icon";
import { setBackdrop } from "@/context/BackdropContext";
import { episodeListItems } from "@/lib/lists";
import * as torrentQuery from "@/lib/torrentQuery";
import { extendEpisode, extendShow, posterList, Video } from "@/utils/library";
import { queryApi } from "@/utils/queryApi";
import { fullUrl } from "@/utils/serverApi";

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
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
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
    () => ({
      select: extendShow,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }),
  );

  createEffect(() => {
    if (show.data) {
      let localImage =
        show.data.provider === "local"
          ? fullUrl("/api/show/{id}/backdrop", {
              path: { id: +show.data.provider_id },
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
        query: { id: +episode.latest()?.provider_id!, content_type: "show" },
      },
    }),
    () => ({
      select: (videos) => videos.map((v) => new Video(v)),
      enabled: episode.latest()?.provider === "local",
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }),
  );

  createEffect(() => {
    if (selectedVideo() === undefined) {
      let video = videos.latest()?.at(0)!;
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

    let id = show.data?.local?.id;
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
    <ErrorBoundary fallback={errorBoundaryFallback("Failed to load episode")}>
      <Show when={show.latest()}>
        {(showData) => (
          <Show when={episode.latest()}>
            {(episodeData) => (
              <DownloadTorrentModal
                open={torrentModal()}
                metadata_id={showData().provider_id}
                onClose={() => setTorrentModal(false)}
                metadata_provider={search().provider}
                query={(p) =>
                  torrentQuery.EPISODE_FORMATTER[p](showData(), episodeData())
                }
                content_type="show"
              />
            )}
          </Show>
        )}
      </Show>
      <Switch>
        <Match when={episode.isLoading || show.isLoading}>
          <DescriptionSkeleton direction="horizontal" />
        </Match>
        <Match when={episode.latest()}>
          {(episode) => {
            const progress = () => {
              const history = episode().local?.history;
              const runtime = video()?.details?.duration;
              if (!history || runtime === undefined) return undefined;
              return { history, runtime };
            };
            return (
              <Description
                title={episode().title}
                posterList={posterList(episode())}
                progress={progress()}
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
                ]}
                releaseDate={episode().release_date ?? undefined}
              >
                <div class="flex flex-wrap items-center gap-2">
                  <Show
                    when={video()}
                    fallback={
                      <Icon
                        tooltip="Download"
                        onClick={() => setTorrentModal(true)}
                      >
                        <Download size="1em" />
                      </Icon>
                    }
                  >
                    {(video) => (
                      <VideoActions video={video()} watchUrl={watchUrl()}>
                        <Icon
                          tooltip="Download"
                          onClick={() => setTorrentModal(true)}
                        >
                          <Download size="1em" />
                        </Icon>
                      </VideoActions>
                    )}
                  </Show>
                  <ListActions
                    items={() => episodeListItems(episode(), params().id)}
                    memberships={episode().local?.lists}
                    metadataId={episode().local?.metadata_id}
                  />
                  <div class="w-full sm:w-96">
                    <Show when={episode().local?.intro && video()}>
                      {(video) => (
                        <IntroBar
                          totalDuration={video().details.duration}
                          intro={episode().local?.intro!}
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
      <Suspense>
        <Show
          when={episode.data?.cast?.length ? episode.data?.cast : undefined}
        >
          {(cast) => <ActorSection actors={cast()} />}
        </Show>
      </Suspense>
    </ErrorBoundary>
  );
}
