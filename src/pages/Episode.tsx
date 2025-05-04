import { createAsync, useParams } from "@solidjs/router";
import { For, Show, createEffect, createSignal } from "solid-js";
import Description from "@/components/Description";
import { fullUrl, Schemas } from "@/utils/serverApi";
import { useProvider } from "@/utils/metadataProviders";
import DownloadTorrentModal from "@/components/modals/TorrentDownload";
import { setBackdrop } from "@/context/BackdropContext";
import { formatSE } from "@/utils/formats";
import Title from "@/utils/Title";
import Icon from "@/components/ui/Icon";
import { FiDownload } from "solid-icons/fi";
import VideoActions from "@/components/Description/VideoActions";
import VideoInformation from "@/components/Description/VideoInformation";
import { fetchEpisode, fetchShow, posterList } from "@/utils/library";
import { ParseParamsError } from "@/utils/errors";
import { IntroBar } from "@/components/Description/IntroBar";

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

function parseParams() {
  let params = useParams();
  if (!+params.episode || !+params.season) {
    throw new ParseParamsError("Failed to parse episode url params");
  }
  return [() => +params.episode, () => +params.season] as const;
}

export default function Episode() {
  let [episodeNumber, seasonNumber] = parseParams();
  let [showId, provider] = useProvider();
  let [torrentModal, setTorrentModal] = createSignal(false);
  // [videoIndex, variantIndex]
  let [selectedVideo, setSelectedVideo] = createSignal<
    [number, number | undefined]
  >([0, undefined]);

  let data = createAsync(async () => {
    let episodePromise = fetchEpisode(
      showId(),
      seasonNumber(),
      episodeNumber(),
      provider(),
    );
    let showPromise = fetchShow(showId(), provider());
    let [episode, show] = await Promise.all([episodePromise, showPromise]);

    if (!episode || !show) return undefined;
    let local_id = await show.localId();
    return {
      episode,
      show,
      local_id,
    };
  });

  createEffect(() => {
    let showData = data()?.show;
    if (showData) {
      let localImage =
        showData?.metadata_provider == "local"
          ? fullUrl("/api/show/{id}/backdrop", {
              path: { id: +showData.metadata_id },
            })
          : undefined;
      setBackdrop([localImage, showData.backdrop ?? undefined]);
    }
  });

  let videos = createAsync(async () => {
    let episode = data()?.episode;
    if (!episode) return undefined;
    let videos = await episode.fetchVideos();
    if (!videos) return undefined;
    return videos;
  });

  let video = () => videos()?.at(0);

  let watchUrl = () => {
    let [videoIdx, variantIdx] = selectedVideo();
    let id = provider() == "local" ? +showId() : data()?.local_id;
    if (!id) return;
    let params = new URLSearchParams();
    if (variantIdx !== undefined) {
      let variant = videos()![videoIdx].variants()[variantIdx];
      params.append("variant", variant.details.id);
    }
    let video = videos()![videoIdx];
    params.append("video", video.details.id.toString());
    return `/shows/${id}/${seasonNumber()}/${episodeNumber()}/watch?${params.toString()}`;
  };

  let pageTitle = () =>
    data()
      ? `${data()?.show?.title} S${formatSE(data()?.episode.season_number!)}E${data()?.episode.number!}`
      : "";

  return (
    <>
      <Title text={pageTitle()} />
      <Show when={data()}>
        {(data) => {
          let torrentQuery = (provider: Schemas["TorrentIndexIdentifier"]) => {
            let showData = data().show;
            let episodeData = data().episode;
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
              metadata_id={data()!.show!.metadata_id}
              onClose={() => setTorrentModal(false)}
              metadata_provider={provider()}
              query={torrentQuery}
              content_type="show"
            />
          );
        }}
      </Show>
      <div class="space-y-5 p-4">
        <Show when={data()?.episode}>
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
                    info: `${data()?.show?.title}`,
                    href: `/shows/${showId()}?provider=${provider()}`,
                  },
                  {
                    info: `Season ${episode().season_number}`,
                    href: `/shows/${showId()}?season=${episode().season_number}&provider=${provider()}`,
                  },
                  { info: `Episode ${episode().number}` },
                  episode().release_date
                    ? { info: episode().release_date! }
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
                    <Show when={videos()?.find((v) => v.details.intro)}>
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
        </Show>
        <For each={videos()}>
          {(video, idx) => (
            <>
              <VideoInformation
                title={`#${idx() + 1} Video file`}
                video={video}
                onSelect={() => setSelectedVideo([idx(), undefined])}
                isSelected={
                  selectedVideo()[0] == idx() &&
                  selectedVideo()[1] === undefined
                }
              />
              <For each={video.variants()}>
                {(variant, vidx) => (
                  <VideoInformation
                    title={`#${idx() + 1} Video variant #${vidx() + 1}`}
                    video={variant}
                    onSelect={() => setSelectedVideo([idx(), vidx()])}
                    isSelected={
                      selectedVideo()[0] == idx() &&
                      selectedVideo()[1] == vidx()
                    }
                  />
                )}
              </For>
            </>
          )}
        </For>
      </div>
    </>
  );
}
