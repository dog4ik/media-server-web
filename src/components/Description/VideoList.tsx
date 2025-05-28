import { createSignal, For, Show } from "solid-js";
import VideoInformationSlider from "./VideoInformationSlider";
import { Video } from "@/utils/library";
import { VideoSelection } from "./VideoInformation";
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
import { revalidatePath, Schemas, server } from "@/utils/serverApi";
import { useNotificationsContext } from "@/context/NotificationContext";
import { notifyResponseErrors } from "@/utils/errors";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import FileVideo from "lucide-solid/icons/file-video";
import { formatDuration, formatSize } from "@/utils/formats";
import { Dialog, DialogContent, DialogTrigger } from "@/ui/dialog";
import { UploadSubtitles } from "./UploadSubtitles";
import promptConfirm from "../modals/ConfirmationModal";

type Props = {
  videos: Video[];
  onVideoSelect: (selection: VideoSelection) => void;
};

const KEY_SEPARATOR = "-";

function makeVideoKey(videoId: number, variantIdx?: number) {
  if (variantIdx === undefined) {
    return videoId.toString();
  } else {
    return `${videoId}${KEY_SEPARATOR}${variantIdx}`;
  }
}

function resolveVideoKeyTuple(key: string): VideoSelection {
  if (key.indexOf(KEY_SEPARATOR) != -1) {
    let s = key.split(KEY_SEPARATOR);
    return { video_id: +s[0], variant_id: s[1] };
  } else {
    return { video_id: +key };
  }
}

export function VideoList(props: Props) {
  return (
    <div class="space-y-4">
      <For each={props.videos}>
        {(video) => (
          <ListItem
            onSelect={(variantId) =>
              props.onVideoSelect({
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
  variant: Schemas["DetailedVariant"];
  onDelete?: () => void;
};

function Variant(props: VariantProps) {
  return (
    <div class="flex items-center justify-between rounded-lg border p-3">
      <div class="flex items-center gap-3">
        <Badge variant="outline">
          {formatDuration(props.variant.duration)}
        </Badge>
        <Badge variant="outline">{formatSize(props.variant.size)}</Badge>
        <Show when={props.variant.path}>
          <code class="text-sm text-muted-foreground">
            {props.variant.path}
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

type VariantListProps = {
  videoId: number;
  items: Schemas["DetailedVariant"][];
  onAddButtonClick: () => void;
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
                variant={variant}
                onDelete={() => deleteVariant(variant.id)}
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

type ListItemProps = {
  video: Video;
  onSelect: (variantId?: string) => void;
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
              <FileVideo class="mt-1 h-6 w-6 flex-shrink-0 text-blue-500" />
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
              onAddButtonClick={() => setAddModalOpen(true)}
              items={props.video.details.variants}
              videoId={props.video.details.id}
            />
          </Show>
        </CardContent>
      </Card>
    </>
  );
}
