import { Button } from "@/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/ui/sheet";
import { Video } from "@/utils/library";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import ChevronRight from "lucide-solid/icons/chevron-right";
import FileVideo from "lucide-solid/icons/file-video";
import Info from "lucide-solid/icons/info";
import Monitor from "lucide-solid/icons/monitor";
import { Badge } from "@/ui/badge";
import {
  formatBitrate,
  formatCodec,
  formatDuration,
  formatSize,
} from "@/utils/formats";
import Volume2 from "lucide-solid/icons/volume-2";
import Play from "lucide-solid/icons/play";
import History from "lucide-solid/icons/history";
import Subtitles from "lucide-solid/icons/subtitles";
import Clock from "lucide-solid/icons/clock";
import HardDrive from "lucide-solid/icons/hard-drive";

type Props = {
  video: Video;
};

export default function VideoInformationSlider(props: Props) {
  return (
    <Sheet>
      <SheetTrigger>
        <Button variant="outline" class="gap-2">
          <Info class="h-4 w-4" />
          Full Details
        </Button>
      </SheetTrigger>
      <SheetContent class="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle class="flex items-center gap-2">
            <FileVideo class="h-5 w-5" />
            Video Details
          </SheetTitle>
          <SheetDescription>
            Complete information about the video file and its tracks
          </SheetDescription>
        </SheetHeader>

        <div class="mt-6 h-[calc(100vh-120px)] overflow-y-auto">
          <div class="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle class="flex items-center gap-2 text-lg">
                  <Monitor class="h-4 w-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent class="space-y-3">
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span>ID:</span> {props.video.details.id}
                  </div>
                  <div>
                    <span>Container:</span>
                    <Badge variant="secondary" class="ml-2">
                      {props.video.details.container}
                    </Badge>
                  </div>
                  <div>
                    <span>Duration:</span>{" "}
                    {formatDuration(props.video.details.duration)}
                  </div>
                  <div>
                    <span>Size:</span> {formatSize(props.video.details.size)}
                  </div>
                  <div class="col-span-2">
                    <span>Path:</span>
                    <code class="bg-muted ml-2 rounded px-2 py-1 text-xs">
                      {props.video.details.path}
                    </code>
                  </div>
                  <div>
                    <span>Scan Date:</span>{" "}
                    {new Date(
                      props.video.details.scan_date,
                    ).toLocaleDateString()}
                  </div>
                  <div>
                    <span>Previews:</span> {props.video.details.previews_count}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle class="flex items-center gap-2 text-lg">
                  <Play class="h-4 w-4" />
                  Video Tracks ({props.video.details.video_tracks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div class="space-y-4">
                  {props.video.details.video_tracks.map((track, index) => (
                    <div class="rounded-lg border p-3">
                      <div class="mb-2 flex items-center gap-2">
                        <Badge
                          variant={track.is_default ? "default" : "secondary"}
                        >
                          Track {index + 1}
                        </Badge>
                        {track.is_default && (
                          <Badge variant="outline">Default</Badge>
                        )}
                      </div>
                      <div class="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span>Codec:</span> {formatCodec(track.codec)}
                        </div>
                        <div>
                          <span>Resolution:</span> {track.resolution.width}×
                          {track.resolution.height}
                        </div>
                        <div>
                          <span>Bitrate:</span> {formatBitrate(track.bitrate)}
                        </div>
                        <div>
                          <span>Framerate:</span> {track.framerate} fps
                        </div>
                        <div>
                          <span>Level:</span> {track.level}
                        </div>
                        <div>
                          <span>Profile:</span> {track.profile_idc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle class="flex items-center gap-2 text-lg">
                  <Volume2 class="h-4 w-4" />
                  Audio Tracks ({props.video.details.audio_tracks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div class="space-y-4">
                  {props.video.details.audio_tracks.map((track, index) => (
                    <div class="rounded-lg border p-3">
                      <div class="mb-2 flex items-center gap-2">
                        <Badge
                          variant={track.is_default ? "default" : "secondary"}
                        >
                          Track {index + 1}
                        </Badge>
                        {track.is_default && (
                          <Badge variant="outline">Default</Badge>
                        )}
                        {track.is_dub && <Badge variant="outline">Dub</Badge>}
                        {track.is_hearing_impaired && (
                          <Badge variant="outline">HI</Badge>
                        )}
                        {track.is_visual_impaired && (
                          <Badge variant="outline">VI</Badge>
                        )}
                      </div>
                      <div class="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span>Codec:</span> {formatCodec(track.codec)}
                        </div>
                        <div>
                          <span>Channels:</span> {track.channels}
                        </div>
                        <div>
                          <span>Sample Rate:</span> {track.sample_rate} Hz
                        </div>
                        <div>
                          <span>Language:</span> {track.language || "Unknown"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle class="flex items-center gap-2 text-lg">
                  <Subtitles class="h-4 w-4" />
                  Subtitle Tracks ({props.video.details.subtitle_tracks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div class="space-y-4">
                  {props.video.details.subtitle_tracks.map((track, index) => (
                    <div class="rounded-lg border p-3">
                      <div class="mb-2 flex items-center gap-2">
                        <Badge
                          variant={track.is_default ? "default" : "secondary"}
                        >
                          Track {index + 1}
                        </Badge>
                        {track.is_default && (
                          <Badge variant="outline">Default</Badge>
                        )}
                        {track.is_hearing_impaired && (
                          <Badge variant="outline">HI</Badge>
                        )}
                        {track.is_visual_impaired && (
                          <Badge variant="outline">VI</Badge>
                        )}
                        {track.is_text_format && (
                          <Badge variant="outline">Text</Badge>
                        )}
                      </div>
                      <div class="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span>Codec:</span> {track.codec}
                        </div>
                        <div>
                          <span>Language:</span> {track.language || "Unknown"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {props.video.details.chapters.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle class="flex items-center gap-2 text-lg">
                    <Clock class="h-4 w-4" />
                    Chapters ({props.video.details.chapters.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div class="space-y-2">
                    {props.video.details.chapters.map((chapter, index) => (
                      <div class="flex items-center justify-between rounded border p-2">
                        <div class="flex items-center gap-3">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span>{chapter.title || `Chapter ${index + 1}`}</span>
                        </div>
                        <div class="text-muted-foreground text-sm">
                          {formatDuration(chapter.start)} -{" "}
                          {formatDuration(chapter.end)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {props.video.details.variants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle class="flex items-center gap-2 text-lg">
                    <HardDrive class="h-4 w-4" />
                    Variants ({props.video.details.variants.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div class="space-y-4">
                    {props.video.details.variants.map((variant, index) => (
                      <div class="rounded-lg border p-3">
                        <div class="mb-2 flex items-center gap-2">
                          <Badge variant="secondary">Variant {index + 1}</Badge>
                          <Badge variant="outline">{variant.container}</Badge>
                        </div>
                        <div class="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span>Duration:</span>{" "}
                            {formatDuration(variant.duration)}
                          </div>
                          <div>
                            <span>Size:</span> {formatSize(variant.size)}
                          </div>
                          <div class="col-span-2">
                            <span>Path:</span>
                            <code class="bg-muted ml-2 rounded px-2 py-1 text-xs">
                              {variant.path}
                            </code>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {props.video.details.history && (
              <Card>
                <CardHeader>
                  <CardTitle class="flex items-center gap-2 text-lg">
                    <History class="h-4 w-4" />
                    Viewing History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div class="space-y-2">
                    <div class="flex items-center justify-between">
                      <span>Progress:</span>
                      <Badge
                        variant={
                          props.video.details.history.is_finished
                            ? "default"
                            : "secondary"
                        }
                      >
                        {props.video.details.history.is_finished
                          ? "Finished"
                          : "In Progress"}
                      </Badge>
                    </div>
                    <div class="flex items-center justify-between">
                      <span>Time Watched:</span>
                      <span>
                        {Math.floor(props.video.details.history.time / 60)}m{" "}
                        {props.video.details.history.time % 60}s
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span>Last Updated:</span>
                      <span>
                        {new Date(
                          props.video.details.history.update_time,
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {props.video.details.intro && (
              <Card>
                <CardHeader>
                  <CardTitle class="flex items-center gap-2 text-lg">
                    <ChevronRight class="h-4 w-4" />
                    Intro Sequence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div class="text-sm">
                    <span>Duration:</span> {props.video.details.intro.start_sec}{" "}
                    - {props.video.details.intro.end_sec}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
