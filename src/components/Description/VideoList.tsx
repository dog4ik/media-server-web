import { ComponentProps, createMemo, createSignal, For, ParentProps, Show } from "solid-js";
import VideoInformationSlider from "./VideoInformationSlider";
import { VariantVideo, Video } from "@/utils/library";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/ui/collapsible";
import Trash2 from "lucide-solid/icons/trash-2";
import Subtitles from "lucide-solid/icons/subtitles";
import ChevronDown from "lucide-solid/icons/chevron-down";
import ChevronRight from "lucide-solid/icons/chevron-right";
import Plus from "lucide-solid/icons/plus";
import VideoIcon from "lucide-solid/icons/video";
import { formatCodec, Schemas, server } from "@/utils/serverApi";
import { queryApi, queryClient } from "@/utils/queryApi";
import { useNotificationsContext } from "@/context/NotificationContext";
import { notifyResponseErrors } from "@/utils/errors";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { formatDuration, formatResolution, formatSize } from "@/utils/formats";
import { Dialog, DialogContent } from "@/ui/dialog";
import { UploadSubtitles } from "./UploadSubtitles";
import promptConfirm from "../modals/ConfirmationModal";
import RadioButton from "../ui/RadioButton";
import { useCapabilityQuery } from "@/utils/mediaCapabilities";
import clsx from "clsx";
import { Skeleton } from "@/ui/skeleton";
import { TranscodeModal } from "../modals/TranscodeModal";

export type VideoSelection = {
  video_id: number;
  variant_id?: string;
};

type CompatibilityBadgeProps = {
  video?: Schemas["DetailedVideoTrack"];
  audio?: Schemas["DetailedAudioTrack"];
  videoPath: string;
} & ParentProps &
  ComponentProps<typeof Badge>;

function CompatibilityBadge(props: CompatibilityBadgeProps) {
  let compatibility = useCapabilityQuery(props.videoPath, props.video, props.audio);
  let data = createMemo(() => (compatibility.isSuccess ? compatibility.data : undefined));
  let isCompatible = createMemo(
    () => data()?.video?.supported || data()?.audio?.supported || data()?.combined?.supported,
  );
  return (
    <Badge
      class={clsx({
        "bg-emerald-500 hover:bg-emerald-400": isCompatible() === true,
        "bg-rose-500 hover:bg-rose-400": isCompatible() === false,
      })}
    >
      {props.children}
    </Badge>
  );
}

type Props = {
  videos: Video[];
  onVideoSelect: (selection: VideoSelection) => void;
  selectedVideo: VideoSelection;
};

export function VideoList(props: Props) {
  let [subtitlesModalVideo, setSubtitlesModalVideo] = createSignal<Video>();
  let [transcodeModalVideo, setTrancodeModalVideo] = createSignal<Video>();
  return (
    <>
      <Dialog
        onOpenChange={(open) => !open && setSubtitlesModalVideo(undefined)}
        open={subtitlesModalVideo() !== undefined}
      >
        <DialogContent class="h-5/6 w-5/6">
          <Show when={subtitlesModalVideo()}>
            <UploadSubtitles
              videoId={subtitlesModalVideo()!.details.id}
              onClose={() => setSubtitlesModalVideo(undefined)}
            />
          </Show>
        </DialogContent>
      </Dialog>
      <Dialog
        onOpenChange={(open) => !open && setTrancodeModalVideo(undefined)}
        open={transcodeModalVideo() !== undefined}
      >
        <DialogContent class="h-5/6 w-5/6">
          <Show when={transcodeModalVideo()}>
            <TranscodeModal
              isOpen={transcodeModalVideo() !== undefined}
              video={transcodeModalVideo()!}
              onClose={() => setTrancodeModalVideo(undefined)}
            />
          </Show>
        </DialogContent>
      </Dialog>
      <div class="space-y-4">
        <For each={props.videos}>
          {(video) => (
            <ListItem
              selectedVideo={props.selectedVideo}
              onTranscodeOpen={() => setTrancodeModalVideo(video)}
              onSubtitlesOpen={() => setSubtitlesModalVideo(video)}
              onSelect={(variantId) =>
                props.selectedVideo.video_id == video.details.id &&
                props.selectedVideo.variant_id == variantId
                  ? props.onVideoSelect({
                      video_id: video.details.id,
                      variant_id: undefined,
                    })
                  : props.onVideoSelect({
                      video_id: video.details.id,
                      variant_id: variantId,
                    })
              }
              video={video}
            />
          )}
        </For>
      </div>
    </>
  );
}

type SubtitleProps = {
  subtitles: Schemas["DetailedSubtitlesAsset"];
  onDelete?: () => void;
};

function Subtitle(props: SubtitleProps) {
  return (
    <div class="flex items-center justify-between rounded-lg border p-3">
      <div class="flex items-center gap-3">
        <Badge variant="secondary">External</Badge>
        <Badge variant="outline">{props.subtitles.language ?? "Unknown"}</Badge>
        <code class="text-muted-foreground text-sm">
          {props.subtitles.is_external ? props.subtitles.path : props.subtitles.file_stem}
        </code>
      </div>
      <Button
        variant="outline"
        size="sm"
        class="text-destructive hover:text-destructive"
        onClick={() => props.onDelete?.()}
      >
        <Trash2 class="h-3 w-3" />
      </Button>
    </div>
  );
}

type ContainerSubtitleProps = {
  track: Schemas["DetailedSubtitleTrack"];
  index: number;
};

function ContainerSubtitle(props: ContainerSubtitleProps) {
  return (
    <div class="flex items-center gap-3 rounded-lg border p-3">
      <Badge variant="secondary">Track {props.index + 1}</Badge>
      <Badge variant="outline">{props.track.language ?? "Unknown"}</Badge>
      <code class="text-muted-foreground text-sm">{props.track.codec}</code>
    </div>
  );
}

type SubtitleListProps = {
  items: Schemas["DetailedSubtitlesAsset"][];
  containerTracks: Schemas["DetailedSubtitleTrack"][];
  onAddButtonClick: () => void;
};

function SubtitlesList(props: SubtitleListProps) {
  let [, { addNotification }] = useNotificationsContext();
  let [isOpen, setIsOpen] = createSignal(false);
  let totalCount = () => props.items.length + props.containerTracks.length;

  async function deleteSubtitle(id: number) {
    if (await promptConfirm("Remove subtitles? This action is irreversible.")) {
      await server
        .DELETE("/api/subtitles/{id}", { params: { path: { id } } })
        .then(notifyResponseErrors(addNotification, "delete subtitles"));
      await queryApi.invalidateQueries(queryClient, "get", "/api/video/by_content");
    }
  }

  return (
    <Collapsible open={isOpen()} onOpenChange={setIsOpen}>
      <CollapsibleTrigger class="hover:bg-accent hover:text-accent-foreground flex h-auto w-full items-center justify-between rounded-md px-2 py-2">
        <div class="flex items-center gap-2">
          <Subtitles class="h-4 w-4" />
          <span class="font-medium">Subtitles ({totalCount()})</span>
        </div>
        <Show fallback={<ChevronRight class="h-4 w-4" />} when={isOpen()}>
          <ChevronDown class="h-4 w-4" />
        </Show>
      </CollapsibleTrigger>
      <CollapsibleContent class="mt-3">
        <div class="space-y-2">
          <Show when={totalCount() === 0}>
            <div class="text-muted-foreground py-4 text-center">
              <p class="mb-2">No subtitles available for this video</p>
              <Button variant="outline" size="sm" onClick={props.onAddButtonClick}>
                <Plus class="mr-1 h-4 w-4" />
                Add Subtitle
              </Button>
            </div>
          </Show>
          <For each={props.items}>
            {(subtitle) => (
              <Subtitle subtitles={subtitle} onDelete={() => deleteSubtitle(subtitle.id)} />
            )}
          </For>
          <For each={props.containerTracks}>
            {(track, index) => <ContainerSubtitle track={track} index={index()} />}
          </For>
          <Show when={totalCount() > 0}>
            <Button
              variant="outline"
              size="sm"
              class="mt-2 w-full"
              onClick={() => props.onAddButtonClick()}
            >
              <Plus class="mr-1 h-4 w-4" />
              Add Subtitle
            </Button>
          </Show>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

type VariantProps = {
  variant: VariantVideo;
  isSelected: boolean;
  onDelete?: () => void;
  onSelect: () => void;
};

function Variant(props: VariantProps) {
  return (
    <button
      onClick={props.onSelect}
      class="flex w-full items-center justify-between rounded-lg border p-3"
    >
      <RadioButton onClick={props.onSelect} checked={props.isSelected} />
      <div class="flex items-center gap-3">
        <Badge variant="outline">{formatDuration(props.variant.details.duration)}</Badge>
        <Badge variant="outline">{formatSize(props.variant.details.size)}</Badge>
        <Show when={props.variant.defaultVideo()}>
          {(video) => (
            <CompatibilityBadge videoPath={props.variant.details.path} video={video()}>
              {formatCodec(video().codec)}
            </CompatibilityBadge>
          )}
        </Show>
        <Show when={props.variant.defaultAudio()}>
          {(audio) => (
            <CompatibilityBadge videoPath={props.variant.details.path} audio={audio()}>
              {formatCodec(audio().codec)}
            </CompatibilityBadge>
          )}
        </Show>
        <Show when={props.variant.details.path}>
          <code class="text-muted-foreground text-sm">{props.variant.details.path}</code>
        </Show>
      </div>
      <Button
        variant="outline"
        size="sm"
        class="text-destructive hover:text-destructive"
        onClick={(e) => {
          // prevent variant to be selected
          e.stopPropagation();
          props.onDelete?.();
        }}
      >
        <Trash2 class="h-3 w-3" />
      </Button>
    </button>
  );
}

type VariantListProps = {
  videoId: number;
  items: VariantVideo[];
  onAddButtonClick: () => void;
  selectedVideo: VideoSelection;
  onVideoSelect: (variantId: string) => void;
};

function VariantList(props: VariantListProps) {
  let [, { addNotification }] = useNotificationsContext();
  let [isListOpen, setIsListOpen] = createSignal(false);

  async function deleteVariant(id: string) {
    if (await promptConfirm("Remove variant? This action is irreversible.")) {
      await server
        .DELETE("/api/video/{id}/variant/{variant_id}", {
          params: { path: { id: props.videoId, variant_id: id } },
        })
        .then(notifyResponseErrors(addNotification, "delete variant"));
      await queryApi.invalidateQueries(queryClient, "get", "/api/video/by_content");
    }
  }

  return (
    <Collapsible open={isListOpen()} onOpenChange={setIsListOpen}>
      <CollapsibleTrigger class="hover:bg-accent hover:text-accent-foreground flex h-auto w-full items-center justify-between rounded-md px-2 py-2">
        <div class="flex items-center gap-2">
          <VideoIcon class="h-4 w-4" />
          <span class="font-medium">Variants ({props.items.length})</span>
        </div>
        <Show fallback={<ChevronRight class="h-4 w-4" />} when={isListOpen()}>
          <ChevronDown class="h-4 w-4" />
        </Show>
      </CollapsibleTrigger>
      <CollapsibleContent class="mt-3">
        <div class="space-y-2">
          <For
            fallback={
              <div class="text-muted-foreground py-4 text-center">
                <p class="mb-2">No variants available for this video</p>
                <Button variant="outline" size="sm" onClick={props.onAddButtonClick}>
                  <Plus class="mr-1 h-4 w-4" />
                  Add Variant
                </Button>
              </div>
            }
            each={props.items}
          >
            {(variant) => (
              <Variant
                onSelect={() => props.onVideoSelect(variant.details.id)}
                isSelected={
                  props.selectedVideo.video_id == props.videoId &&
                  props.selectedVideo.variant_id == variant.details.id
                }
                variant={variant}
                onDelete={() => deleteVariant(variant.details.id)}
              />
            )}
          </For>
          <Show when={props.items.length > 0}>
            <Button
              variant="outline"
              size="sm"
              class="mt-2 w-full"
              onClick={() => props.onAddButtonClick()}
            >
              <Plus class="mr-1 h-4 w-4" />
              Add Transcoded Variant
            </Button>
          </Show>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

type ListItemProps = {
  video: Video;
  onSelect: (variantId?: string) => void;
  onSubtitlesOpen: () => void;
  onTranscodeOpen: () => void;
  selectedVideo: VideoSelection;
};

function ListItem(props: ListItemProps) {
  return (
    <>
      <Card class="overflow-hidden">
        <CardHeader class="pb-3">
          <div class="flex items-start justify-between">
            <div class="flex flex-1 items-start gap-3">
              <RadioButton
                checked={props.selectedVideo.video_id == props.video.details.id}
                onClick={() => props.onSelect(undefined)}
              />
              <div class="min-w-0 flex-1 space-y-1">
                <CardTitle class="text-sm leading-tight">{props.video.details.path}</CardTitle>
                <div class="text-muted-foreground flex flex-wrap gap-2 text-sm">
                  <Badge variant="secondary">{formatDuration(props.video.details.duration)}</Badge>
                  <Badge variant="outline">{formatSize(props.video.details.size)}</Badge>
                  <Show when={props.video.defaultVideo()}>
                    {(video) => (
                      <>
                        <CompatibilityBadge videoPath={props.video.details.path} video={video()}>
                          {formatCodec(video().codec)}
                        </CompatibilityBadge>
                        <Badge variant="secondary">{formatResolution(video().resolution)}</Badge>
                      </>
                    )}
                  </Show>
                  <Show when={props.video.defaultAudio()}>
                    {(audio) => (
                      <CompatibilityBadge videoPath={props.video.details.path} audio={audio()}>
                        {formatCodec(audio().codec)}
                      </CompatibilityBadge>
                    )}
                  </Show>
                </div>
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <VideoInformationSlider video={props.video} />
            </div>
          </div>
        </CardHeader>

        <CardContent class="space-y-4 pt-0">
          <SubtitlesList
            onAddButtonClick={props.onSubtitlesOpen}
            items={props.video.details.subtitles}
            containerTracks={props.video.details.subtitle_tracks}
          />
          <Show when={props.video.details.variants.length > 0}>
            <VariantList
              onVideoSelect={props.onSelect}
              onAddButtonClick={props.onTranscodeOpen}
              items={props.video.variants()}
              videoId={props.video.details.id}
              selectedVideo={props.selectedVideo}
            />
          </Show>
        </CardContent>
      </Card>
    </>
  );
}

export function ListItemSkeleton() {
  return (
    <Card class="overflow-hidden">
      <CardHeader class="pb-3">
        <div class="flex items-start justify-between pb-10">
          <div class="flex flex-1 items-start gap-3">
            <Skeleton class="size-6 rounded-full" />
            <div class="min-w-0 flex-1 space-y-1">
              <Skeleton class="h-4 w-5/6" />
              <Skeleton class="h-4 w-1/6" />
              <div class="text-muted-foreground flex flex-wrap gap-2 text-sm">
                {[...Array(5)].map(() => (
                  <Skeleton class="h-4 w-14" />
                ))}
              </div>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <Skeleton class="h-8 w-30" />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
