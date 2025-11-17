import { revalidatePath, Schemas, server } from "@/utils/serverApi";
import {
  createEffect,
  createSignal,
  For,
  ParentProps,
  Show,
  Suspense,
} from "solid-js";
import { DynamicIntro } from "../Description/IntroBar";
import { createStore, produce } from "solid-js/store";
import { Button } from "@/ui/button";
import { ExtendedEpisode, Video } from "@/utils/library";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import FallbackImage from "../FallbackImage";
import {
  NumberField,
  NumberFieldDecrementTrigger,
  NumberFieldGroup,
  NumberFieldIncrementTrigger,
  NumberFieldInput,
  NumberFieldLabel,
} from "@/ui/number-field";
import { formatDuration, parseDuration } from "@/utils/formats";
import { FiPlusCircle, FiTrash } from "solid-icons/fi";
import { useQuery } from "@tanstack/solid-query";

type IntroRowProps = {
  index: number;
  intro: Schemas["Intro"] | undefined;
  totalDuration: number;
  onChange: (intro: Schemas["Intro"]) => void;
  originalIntro: Schemas["Intro"] | undefined;
  onReset: () => void;
  onSave: () => void;
  onDelete: () => void;
};

type SecondsInputProps = {
  value: number;
  onChange: (seconds: number) => void;
  max: number;
  min: number;
} & ParentProps;

function defaultIntro(
  duration: number,
  existingIntros: (Schemas["Intro"] | undefined)[],
) {
  let start = 0;
  let end = duration;
  let intros = existingIntros.filter((intro) => intro !== undefined);
  for (let intro of intros) {
    start += intro.start_sec;
    end += intro.end_sec;
  }

  if (intros.length === 0) {
    return { start_sec: 0, end_sec: Math.floor(duration / 8) };
  }

  return {
    start_sec: Math.floor(start / intros.length),
    end_sec: Math.floor(end / intros.length),
  };
}

function SecondsInput(props: SecondsInputProps) {
  let formattedValue = () => formatDuration({ secs: props.value, nanos: 0 });
  let [rawValue, setRawValue] = createSignal(formattedValue());

  createEffect(() => setRawValue(formattedValue()));

  function onBlur() {
    let duration = parseDuration(rawValue());
    if (duration !== undefined) {
      props.onChange(Math.max(Math.min(duration, props.max), props.min));
    } else {
      setRawValue(formattedValue());
    }
  }

  function handleChange(val: string) {
    setRawValue(val);
  }

  function increment() {
    props.onChange(Math.min(props.value + 1, props.max));
    setRawValue(formattedValue());
    console.log("increment");
  }

  function decrement() {
    props.onChange(Math.max(props.value - 1, props.min));
    setRawValue(formattedValue());
    console.log("decrement");
  }

  return (
    <NumberField value={rawValue()} class="w-40">
      <NumberFieldLabel>{props.children}</NumberFieldLabel>
      <NumberFieldGroup>
        <NumberFieldDecrementTrigger
          onClick={decrement}
          aria-label="Decrement"
        />
        <NumberFieldInput
          onInput={(e) => handleChange(e.currentTarget.value)}
          onBlur={onBlur}
          value={rawValue()}
        />
        <NumberFieldIncrementTrigger
          onClick={increment}
          aria-label="Increment"
        />
      </NumberFieldGroup>
    </NumberField>
  );
}

function IntroRow(props: IntroRowProps) {
  let hasChanged = () => !cmpIntro(props.originalIntro, props.intro);
  return (
    <div class="flex w-full items-center justify-center gap-10 overflow-y-auto py-4">
      <span class="shrink-0">Video {props.index + 1}:</span>
      <div class="flex w-full items-center gap-16">
        <Show
          when={props.intro}
          fallback={
            <Button
              onClick={() =>
                props.onChange(defaultIntro(props.totalDuration, []))
              }
              class="w-full"
            >
              <FiPlusCircle size={30} />
            </Button>
          }
        >
          {(intro) => (
            <>
              <SecondsInput
                onChange={(v) =>
                  props.onChange({ start_sec: v, end_sec: intro().end_sec })
                }
                value={intro().start_sec}
                max={intro().end_sec}
                min={0}
              >
                Start
              </SecondsInput>
              <SecondsInput
                onChange={(v) =>
                  props.onChange({ start_sec: intro().start_sec, end_sec: v })
                }
                value={intro().end_sec}
                max={props.totalDuration}
                min={intro().start_sec}
              >
                End
              </SecondsInput>
              <div class="flex-1">
                <DynamicIntro
                  totalDuration={props.totalDuration}
                  start={intro().start_sec}
                  end={intro().end_sec}
                  onChange={props.onChange}
                />
              </div>
            </>
          )}
        </Show>
      </div>
      <div class="flex basis-1/3 items-center justify-end gap-2">
        <Button disabled={!hasChanged()} onClick={props.onReset}>
          Reset
        </Button>
        <Button disabled={!hasChanged()} onClick={props.onSave}>
          Save
        </Button>
        <Button
          variant={"destructive"}
          onClick={props.onDelete}
          disabled={props.intro === undefined}
        >
          <FiTrash size={30} />
        </Button>
      </div>
    </div>
  );
}

type IntroContent = {
  episode: ExtendedEpisode;
  videos?: Video[];
};

type InnerProps = {
  content: IntroContent[];
  show_id: number;
  season: number;
};

type SaveStatus = "pending" | "success" | "error";

function cmpIntro(
  lhs: Schemas["Intro"] | undefined,
  rhs: Schemas["Intro"] | undefined,
) {
  if (lhs === undefined && rhs == undefined) {
    return true;
  }

  if (!lhs || !rhs) {
    return false;
  }

  return (
    Math.floor(lhs.start_sec) == Math.floor(rhs.start_sec) &&
    Math.floor(lhs.end_sec) == Math.floor(rhs.end_sec)
  );
}

function Inner(props: InnerProps) {
  let flattenVideos = () =>
    props.content.flatMap((c) =>
      c.videos
        ? c.videos.map((v) => ({
            id: v.details.id,
            intro: v.details.intro,
            episode: c.episode,
          }))
        : [],
    );

  let [changes, setChanges] = createStore<Record<number, Schemas["Intro"]>>({});

  let [pendingSaves, setPendingSaves] = createStore<(SaveStatus | undefined)[]>(
    flattenVideos().map((_) => undefined),
  );

  async function deleteSeasonIntros() {
    let res = await server.DELETE("/api/show/{show_id}/{season}/intros", {
      params: { path: { season: props.season, show_id: props.show_id } },
    });

    if (res.error !== undefined) {
      console.warn(`Failed to delete intros: ${res.error.message}`);
    } else {
      await revalidatePath("/api/video/by_content");
      setChanges({});
    }
  }

  async function saveAll() {
    for (let i = 0; i < flattenVideos().length; ++i) {
      let video = flattenVideos()[i];
      let timing = changes[video.id];
      if (timing !== undefined && !cmpIntro(timing, video.intro ?? undefined)) {
        setPendingSaves(i, "pending");
        await server
          .PUT("/api/video/{video_id}/intro", {
            params: { path: { video_id: video.id } },
            body: {
              start: Math.floor(timing.start_sec),
              end: Math.floor(timing.end_sec),
            },
          })
          .then((r) =>
            r.error !== undefined
              ? setPendingSaves(i, "success")
              : setPendingSaves(i, "error"),
          )
          .catch(() => setPendingSaves(i, "error"));
        await revalidatePath("/api/video/by_content");
        setChanges({});
      }
    }
  }

  async function saveOne(id: number) {
    let idx = flattenVideos().findIndex((v) => v.id == id);
    let video = flattenVideos()[idx];
    let timing = changes[video.id];
    if (timing !== undefined && !cmpIntro(timing, video.intro ?? undefined)) {
      setPendingSaves(idx, "pending");
      await server
        .PUT("/api/video/{video_id}/intro", {
          params: { path: { video_id: video.id } },
          body: {
            start: Math.floor(timing.start_sec),
            end: Math.floor(timing.end_sec),
          },
        })
        .then((r) => {
          r.error !== undefined
            ? setPendingSaves(idx, "success")
            : setPendingSaves(idx, "error");
        })
        .catch(() => setPendingSaves(idx, "error"));
      await revalidatePath("/api/video/by_content");
      removeChange(id);
    }
  }

  async function deleteOne(videoId: number) {
    if (flattenVideos().find((v) => v.id == videoId)?.intro != undefined) {
      let deleteResult = await server.DELETE("/api/video/{video_id}/intro", {
        params: { path: { video_id: videoId } },
      });
      if (deleteResult.error !== undefined) {
        console.warn(`Failed to delete intro: ${deleteResult.error.message}`);
      }
      await revalidatePath("/api/video/by_content");
    }
    removeChange(videoId);
  }

  function haveChange() {
    return Object.keys(changes).length !== 0;
  }

  function removeChange(id: number) {
    setChanges(produce((v) => delete v[id]));
  }

  return (
    <div class="overflow-y-scroll">
      <div class="space-y-10">
        <For each={props.content}>
          {(payload) => (
            <div class="flex flex-col gap-4">
              <FallbackImage
                alt="Episode poster"
                srcList={[
                  payload.episode.localPoster(),
                  payload.episode.poster,
                ]}
                width={200}
                class="rounded-md"
                height={120}
              />
              <div>{payload.episode.friendlyTitle()}</div>
              <div class="space-y-10 divide-y-2 px-8">
                <For each={payload.videos}>
                  {(v, i) => (
                    <IntroRow
                      onSave={() => saveOne(v.details.id)}
                      index={i()}
                      intro={changes[v.details.id] ?? v.details.intro}
                      totalDuration={v.details.duration.secs}
                      onChange={(newIntro) => {
                        if (!cmpIntro(newIntro, v.details.intro ?? undefined)) {
                          setChanges(v.details.id, newIntro);
                        } else {
                          removeChange(v.details.id);
                        }
                      }}
                      onDelete={() => deleteOne(v.details.id)}
                      originalIntro={v.details.intro ?? undefined}
                      onReset={() => removeChange(v.details.id)}
                    />
                  )}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>
      <Button onClick={saveAll} disabled={!haveChange()}>
        Save new timings
      </Button>
    </div>
  );
}

type Props = {
  episodes: ExtendedEpisode[];
  show_id: number;
  season: number;
  open: boolean;
  onClose: () => void;
};

function Loading() {
  return <div>Loading..</div>;
}

export function IntrosModal(props: Props) {
  let detailedVideos = useQuery(() => ({
    queryFn: async () => {
      let promises = props.episodes.map((e) => e.fetchVideos());
      return (await Promise.allSettled(promises)).map((r) =>
        r.status == "fulfilled" ? (r.value ?? []) : undefined,
      );
    },
    queryKey: ["detailed_videos", props.show_id, props.season]
  }));
  return (
    <Dialog
      open={props.open}
      onOpenChange={(isOpen) => isOpen || props.onClose()}
    >
      <DialogContent class="h-3/4 w-2/3">
        <DialogHeader>
          <DialogTitle>Manage intros</DialogTitle>
        </DialogHeader>
        <Suspense fallback={<Loading />}>
          <Show when={detailedVideos.data}>
            {(videos) => (
              <Inner
                season={props.season}
                show_id={props.show_id}
                content={videos().map((v, i) => ({
                  episode: props.episodes[i],
                  videos: v,
                }))}
              />
            )}
          </Show>
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}
