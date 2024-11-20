import { A, createAsync } from "@solidjs/router";
import {
  Schemas,
  defaultTrack,
  formatCodec,
  revalidatePath,
  server,
} from "../../utils/serverApi";
import { For, Match, Show, Suspense, Switch } from "solid-js";
import { InternalServerError } from "../../utils/errors";
import {
  ExtendedVideoContent,
  extendEpisode,
  fetchVideoContent,
  posterList,
} from "@/utils/library";
import { formatResolution, formatSize } from "@/utils/formats";
import clsx from "clsx";
import { FiTrash } from "solid-icons/fi";
import FallbackImage from "../FallbackImage";
import { isCompatible } from "@/utils/mediaCapabilities/mediaCapabilities";
import promptConfirm from "../modals/ConfirmationModal";

type TableRowProps = {
  title: string;
  url: string;
  posterList: string[];
  audio: Schemas["DetailedAudioTrack"];
  video: Schemas["DetailedVideoTrack"];
  size: number;
  onDelete: () => void;
};

type PlayMarkProps = {
  video: Schemas["DetailedVideoTrack"];
  audio: Schemas["DetailedAudioTrack"];
};

function CanPlayMark(props: PlayMarkProps) {
  let playStatus = createAsync(() => isCompatible(props.video, props.audio));
  return (
    <Show
      fallback={<div class="h-2 w-2 rounded-full bg-neutral-800" />}
      when={playStatus()}
    >
      {(status) => (
        <Switch>
          <Match when={status().combined.supported}>
            <div class="h-2 w-2 rounded-full bg-green-500" />
          </Match>
          <Match when={!status().combined.supported}>
            <div class="h-2 w-2 rounded-full bg-red-500" />
          </Match>
        </Switch>
      )}
    </Show>
  );
}

function TableRow(props: TableRowProps) {
  return (
    <tr class={clsx(props.onDelete || "bg-neutral-800")}>
      <th>
        <FallbackImage
          srcList={props.posterList}
          alt="Content poster"
          class="aspect-poster"
          width={60}
          height={90}
        />
      </th>
      <th>
        <A class="hover:underline" href={props.url}>
          {props.title}
        </A>
      </th>
      <td>{formatCodec(props.video.codec)}</td>
      <td>{formatResolution(props.video.resolution)}</td>
      <td>{formatCodec(props.audio.codec)}</td>
      <td>
        <CanPlayMark audio={props.audio} video={props.video} />
      </td>
      <td>{formatSize(props.size)}</td>
      <td>
        <button
          class="rounded-md p-2 transition-colors hover:bg-red-500"
          onClick={props.onDelete}
        >
          <FiTrash size={20} />
        </button>
      </td>
    </tr>
  );
}

type VariantProps = {
  video: Schemas["DetailedVideo"];
  content: ExtendedVideoContent;
  onDelete: (id: string) => void;
};

function VideoTranscodedVariants(props: VariantProps) {
  let url = () => {
    if (props.content.content_type === "episode") {
      let episode = extendEpisode(
        props.content.episode,
        props.content.show.metadata_id,
      );
      return episode.url();
    } else {
      return props.content.url();
    }
  };
  let title = () => {
    let friendlyTitle = props.content.friendlyTitle();
    if (props.content.content_type === "episode") {
      return `${friendlyTitle} ${props.content.episode.title}`;
    }
    return friendlyTitle;
  };
  return (
    <>
      <For each={props.video.variants}>
        {(variant) => (
          <TableRow
            title={title()}
            url={url()}
            posterList={posterList(props.content)}
            audio={defaultTrack(variant.audio_tracks)}
            video={defaultTrack(variant.video_tracks)}
            size={variant.size}
            onDelete={() => props.onDelete(variant.id)}
          />
        )}
      </For>
    </>
  );
}

function NoItemsDisplay() {
  return (
    <>
      <p class="text-center text-2xl">No transcoded videos</p>
      <p class="text-center">
        Start transcoding videos and they will show up here
      </p>
    </>
  );
}

export default function Variants() {
  let videos = createAsync(async () => {
    let variants = await server.GET("/api/variants");
    if (!variants.data)
      throw new InternalServerError("Failed to get all variants");
    let promises = variants.data.map((video) => fetchVideoContent(video.id));
    let settled = await Promise.allSettled(promises);
    return variants.data?.map((d, idx) => {
      let settledContent = settled[idx];
      return {
        ...d,
        content:
          settledContent.status == "fulfilled"
            ? settledContent.value
            : undefined,
      };
    });
  });

  async function onDelete(videoId: number, variantId: string) {
    let confirmed = await promptConfirm("Do you want to delete variant?");
    if (confirmed) {
      await server.DELETE("/api/video/{id}/variant/{variant_id}", {
        params: { path: { id: videoId, variant_id: variantId } },
      });
      await revalidatePath("/api/variants");
    }
  }

  return (
    <div class="flex flex-col gap-5">
      <Suspense>
        <Show fallback={<NoItemsDisplay />} when={videos()?.length! > 0}>
          <table class="table bg-black">
            <thead>
              <tr class="text-white">
                {/*Poster*/}
                <th>#</th>
                {/*Name*/}
                <th></th>
                <th>Video codec</th>
                <th>Resolution</th>
                <th>Audio codec</th>
                <th></th>
                <th>Size</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <For each={videos()}>
                {(video) => (
                  <VideoTranscodedVariants
                    onDelete={(variantId: string) =>
                      onDelete(video.id, variantId)
                    }
                    video={video}
                    content={video.content!}
                  />
                )}
              </For>
            </tbody>
          </table>
        </Show>
      </Suspense>
    </div>
  );
}
