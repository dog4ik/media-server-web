import { ComponentProps, createSignal, For, ParentProps, Show } from "solid-js";
import VideoInformationSlider from "./VideoInformationSlider";
import { VariantVideo, Video } from "@/utils/library";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import Trash2 from "lucide-solid/icons/trash-2";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/ui/collapsible";
import Subtitles from "lucide-solid/icons/subtitles";
import ChevronDown from "lucide-solid/icons/chevron-down";
import ChevronRight from "lucide-solid/icons/chevron-right";
import Plus from "lucide-solid/icons/plus";
import VideoIcon from "lucide-solid/icons/video";
import {
  formatCodec,
  revalidatePath,
  Schemas,
  server,
} from "@/utils/serverApi";
import { useNotificationsContext } from "@/context/NotificationContext";
import { notifyResponseErrors } from "@/utils/errors";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { formatDuration, formatSize } from "@/utils/formats";
import { Dialog, DialogContent } from "@/ui/dialog";
import { UploadSubtitles } from "./UploadSubtitles";
import promptConfirm from "../modals/ConfirmationModal";
import RadioButton from "../RadioButton";
import { isCompatible } from "@/utils/mediaCapabilities";
import { createAsync } from "@solidjs/router";
import clsx from "clsx";

export type VideoSelection = {
  video_id: number;
  variant_id?: string;
};

type CompatibilityBadgeProps = {
  compatibility: ReturnType<typeof isCompatible>;
} & ParentProps &
  ComponentProps<typeof Badge>;

function CompatibilityBadge(props: CompatibilityBadgeProps) {
  let compatibility = createAsync(async () => {
    let compatibility = await props.compatibility;
    if (compatibility.combined) return compatibility.combined.supported;
    if (compatibility.video) return compatibility.video.supported;
    if (compatibility.audio) return compatibility.audio.supported;
  });
  return (
    <Badge
      class={clsx({
        "bg-emerald-500 hover:bg-emerald-400": compatibility() === true,
        "bg-rose-500 hover:bg-rose-400": compatibility() === false,
        "": compatibility() === undefined,
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
  return (
    <div class="space-y-4">
      <For each={props.videos}>
        {(video) => (
          <ListItem
            selectedVideo={props.selectedVideo}
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
        <Badge variant="outline">{props.subtitles.language ?? "Unknown"}</Badge>
        <Show when={props.subtitles.is_external}>
          <code class="text-sm text-muted-foreground">
            {props.subtitles.path}
          </code>
        </Show>
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

type SubtitleListProps = {
  items: Schemas["DetailedSubtitlesAsset"][];
  onAddButtonClick: () => void;
};

function SubtitlesList(props: SubtitleListProps) {
  let [, { addNotification }] = useNotificationsContext();
  let [isOpen, setIsOpen] = createSignal(false);

  async function deleteSubtitle(id: number) {
    if (await promptConfirm("Remove subtitles? This action is irreversible.")) {
      server
        .DELETE("/api/subtitles/{id}", { params: { path: { id } } })
        .then(notifyResponseErrors(addNotification, "delete subtitles"))
        .finally(() => revalidatePath("/api/video/by_content"));
    }
  }

  return (
    <Collapsible open={isOpen()} onOpenChange={setIsOpen}>
      <CollapsibleTrigger class="flex h-auto w-full items-center justify-between rounded-md px-2 py-2 hover:bg-accent hover:text-accent-foreground">
        <div class="flex items-center gap-2">
          <Subtitles class="h-4 w-4" />
          <span class="font-medium">Subtitles ({props.items.length})</span>
        </div>
        <Show fallback={<ChevronRight class="h-4 w-4" />} when={isOpen()}>
          <ChevronDown class="h-4 w-4" />
        </Show>
      </CollapsibleTrigger>
      <CollapsibleContent class="mt-3">
        <div class="space-y-2">
          <For
            fallback={
              <div class="py-4 text-center text-muted-foreground">
                <p class="mb-2">No subtitles available for this video</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={props.onAddButtonClick}
                >
                  <Plus class="mr-1 h-4 w-4" />
                  Add Subtitle
                </Button>
              </div>
            }
            each={props.items}
          >
            {(subtitle) => (
              <Subtitle
                subtitles={subtitle}
                onDelete={() => deleteSubtitle(subtitle.id)}
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
        <Badge variant="outline">
          {formatDuration(props.variant.details.duration)}
        </Badge>
        <Badge variant="outline">
          {formatSize(props.variant.details.size)}
        </Badge>
        <Show when={props.variant.defaultVideo()}>
          {(video) => (
            <CompatibilityBadge
              compatibility={isCompatible(video(), undefined)}
            >
              {formatCodec(video().codec)}
            </CompatibilityBadge>
          )}
        </Show>
        <Show when={props.variant.defaultAudio()}>
          {(audio) => (
            <CompatibilityBadge
              compatibility={isCompatible(undefined, audio())}
            >
              {formatCodec(audio().codec)}
            </CompatibilityBadge>
          )}
        </Show>
        <Show when={props.variant.details.path}>
          <code class="text-sm text-muted-foreground">
            {props.variant.details.path}
          </code>
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
  let [isOpen, setIsOpen] = createSignal(false);

  async function deleteVariant(id: string) {
    if (await promptConfirm("Remove variant? This action is irreversible.")) {
      server
        .DELETE("/api/video/{id}/variant/{variant_id}", {
          params: { path: { id: props.videoId, variant_id: id } },
        })
        .then(notifyResponseErrors(addNotification, "delete variant"))
        .finally(() => revalidatePath("/api/video/by_content"));
    }
  }

  return (
    <Collapsible open={isOpen()} onOpenChange={setIsOpen}>
      <CollapsibleTrigger class="flex h-auto w-full items-center justify-between rounded-md px-2 py-2 hover:bg-accent hover:text-accent-foreground">
        <div class="flex items-center gap-2">
          <VideoIcon class="h-4 w-4" />
          <span class="font-medium">Variants ({props.items.length})</span>
        </div>
        <Show fallback={<ChevronRight class="h-4 w-4" />} when={isOpen()}>
          <ChevronDown class="h-4 w-4" />
        </Show>
      </CollapsibleTrigger>
      <CollapsibleContent class="mt-3">
        <div class="space-y-2">
          <For
            fallback={
              <div class="py-4 text-center text-muted-foreground">
                <p class="mb-2">No variants available for this video</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={props.onAddButtonClick}
                >
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
  selectedVideo: VideoSelection;
};

function ListItem(props: ListItemProps) {
  let [addModalOpen, setAddModalOpen] = createSignal(false);

  async function onAddSubtitles() {
    await revalidatePath("/api/video/by_content");
    setAddModalOpen(false);
  }

  return (
    <>
      <Dialog onOpenChange={setAddModalOpen} open={addModalOpen()}>
        <DialogContent class="h-5/6 w-5/6">
          <UploadSubtitles
            videoId={props.video.details.id}
            onClose={onAddSubtitles}
          />
        </DialogContent>
      </Dialog>
      <Card class="overflow-hidden bg-primary-foreground">
        <CardHeader class="pb-3">
          <div class="flex items-start justify-between">
            <div class="flex flex-1 items-start gap-3">
              <RadioButton
                checked={props.selectedVideo.video_id == props.video.details.id}
                onClick={() => props.onSelect(undefined)}
              />
              <div class="min-w-0 flex-1 space-y-1">
                <CardTitle class="text-sm leading-tight">
                  {props.video.details.path}
                </CardTitle>
                <div class="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary">
                    {formatDuration(props.video.details.duration)}
                  </Badge>
                  <Badge variant="outline">
                    {formatSize(props.video.details.size)}
                  </Badge>
                  <Badge variant="secondary">
                    {formatDuration(props.video.details.duration)}
                  </Badge>
                  <Show when={props.video.defaultVideo()}>
                    {(video) => (
                      <CompatibilityBadge
                        compatibility={isCompatible(video(), undefined)}
                      >
                        {formatCodec(video().codec)}
                      </CompatibilityBadge>
                    )}
                  </Show>
                  <Show when={props.video.defaultAudio()}>
                    {(audio) => (
                      <CompatibilityBadge
                        compatibility={isCompatible(undefined, audio())}
                      >
                        {formatCodec(audio().codec)}
                      </CompatibilityBadge>
                    )}
                  </Show>
                </div>
              </div>
            </div>
            <div class="flex flex-shrink-0 items-center gap-2">
              <VideoInformationSlider video={props.video} />
            </div>
          </div>
        </CardHeader>

        <CardContent class="space-y-4 pt-0">
          <SubtitlesList
            onAddButtonClick={() => setAddModalOpen(true)}
            items={props.video.details.subtitles}
          />
          <Show when={props.video.details.variants.length > 0}>
            <VariantList
              onVideoSelect={props.onSelect}
              onAddButtonClick={() => setAddModalOpen(true)}
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
