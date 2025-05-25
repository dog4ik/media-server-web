import { A, createAsync } from "@solidjs/router";
import {
  Schemas,
  formatCodec,
  revalidatePath,
  server,
} from "../../utils/serverApi";
import { ErrorBoundary, For, Match, Show, Suspense, Switch } from "solid-js";
import { throwResponseErrors } from "../../utils/errors";
import {
  defaultTrack,
  ExtendedVideoContent,
  extendEpisode,
  fetchVideoContent,
  posterList,
} from "@/utils/library";
import { formatResolution, formatSize } from "@/utils/formats";
import { FiTrash } from "solid-icons/fi";
import FallbackImage from "../FallbackImage";
import { isCompatible } from "@/utils/mediaCapabilities";
import promptConfirm from "../modals/ConfirmationModal";
import {
  Table,
  TableBody,
  TableRow,
  TableHead,
  TableHeader,
  TableCell,
} from "@/ui/table";

type TableRowProps = {
  title: string;
  idx: number;
  url: string;
  posterList: string[];
  audio?: Schemas["DetailedAudioTrack"];
  video?: Schemas["DetailedVideoTrack"];
  size: number;
  onDelete: () => void;
};

type PlayMarkProps = {
  video?: Schemas["DetailedVideoTrack"];
  audio?: Schemas["DetailedAudioTrack"];
};

function CanPlayMark(props: PlayMarkProps) {
  let playStatus = createAsync(() => isCompatible(props.video, props.audio));
  return (
    <Show
      fallback={<div class="h-2 w-2 rounded-full bg-neutral-800" />}
      when={playStatus()}
    >
      {(status) => (
        <Switch fallback={<div class="h-2 w-2 rounded-full bg-neutral-700" />}>
          <Match when={status().combined?.supported}>
            <div class="h-2 w-2 rounded-full bg-green-500" />
          </Match>
          <Match when={!status().combined?.supported}>
            <div class="h-2 w-2 rounded-full bg-red-500" />
          </Match>
        </Switch>
      )}
    </Show>
  );
}

function VariantsError(props: { e: any }) {
  return (
    <div class="flex size-full items-center justify-center">
      <span class="text-2xl">Failed to load variants</span>
    </div>
  );
}

function Row(props: TableRowProps) {
  return (
    <TableRow>
      <TableCell>{props.idx + 1}</TableCell>
      <TableCell>
        <FallbackImage
          srcList={props.posterList}
          alt="Content poster"
          class="inline aspect-poster rounded-md"
          width={60}
          height={90}
        />
        <A class="pl-2 hover:underline" href={props.url}>
          {props.title}
        </A>
      </TableCell>
      <TableCell>
        {props.video?.codec ? formatCodec(props.video.codec) : "N/A"}
      </TableCell>
      <TableCell>
        {props.video?.resolution
          ? formatResolution(props.video.resolution)
          : "N/A"}
      </TableCell>
      <TableCell>
        {props.audio?.codec ? formatCodec(props.audio.codec) : "N/A"}
      </TableCell>
      <TableCell>
        <CanPlayMark audio={props.audio} video={props.video} />
      </TableCell>
      <TableCell>{formatSize(props.size)}</TableCell>
      <TableCell>
        <button
          class="rounded-md p-2 transition-colors hover:bg-red-500"
          onClick={props.onDelete}
        >
          <FiTrash size={20} />
        </button>
      </TableCell>
    </TableRow>
  );
}

type VariantProps = {
  video: Schemas["DetailedVideo"];
  content: ExtendedVideoContent;
  idx: number;
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
        {(variant, idx) => {
          return (
            <>
              <Row
                idx={props.idx + idx()}
                title={title()}
                url={url()}
                posterList={posterList(props.content)}
                audio={defaultTrack(variant.audio_tracks)}
                video={defaultTrack(variant.video_tracks)}
                size={variant.size}
                onDelete={() => props.onDelete(variant.id)}
              />
            </>
          );
        }}
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
    let variants = await server.GET("/api/variants").then(throwResponseErrors);
    let promises = variants.map((video) => fetchVideoContent(video.id));
    let settled = await Promise.allSettled(promises);
    return variants.map((d, idx) => {
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
      <ErrorBoundary fallback={(e) => <VariantsError e={e} />}>
        <Suspense>
          <Show fallback={<NoItemsDisplay />} when={videos()?.length! > 0}>
            <Table class="border">
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Video Codec</TableHead>
                  <TableHead>Resolution</TableHead>
                  <TableHead>Audio Codec</TableHead>
                  <TableHead>Can play</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead class="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <For each={videos()}>
                  {(video, idx) => (
                    <VideoTranscodedVariants
                      idx={idx()}
                      onDelete={(variantId: string) =>
                        onDelete(video.id, variantId)
                      }
                      video={video}
                      // this is a lie
                      content={video.content!}
                    />
                  )}
                </For>
              </TableBody>
            </Table>
          </Show>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
