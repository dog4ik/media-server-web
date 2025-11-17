import { For, ParentProps, Show } from "solid-js";
import { Schemas } from "../../utils/serverApi";
import FallbackImage from "../FallbackImage";
import ProgressBar from "../Cards/ProgressBar";
import { Link, LinkOptions } from "@tanstack/solid-router";
import { Skeleton } from "@/ui/skeleton";
import clsx from "clsx";

type AdditionalInfo = {
  info: string;
  link: LinkOptions | undefined;
};

type ImageDirection = "horizontal" | "vertical";

type Props = {
  posterList: string[];
  plot?: string | null;
  title: string;
  progress?: { history: Schemas["DbHistory"]; runtime: number };
  additionalInfo?: AdditionalInfo[];
  imageDirection?: ImageDirection;
};

function Addition(props: { data: AdditionalInfo[] }) {
  return (
    <div class="flex items-center gap-2">
      <For each={props.data}>
        {(content, i) => {
          let isLast = i() == props.data.length - 1;
          return (
            <Show
              when={content.link}
              fallback={
                <>
                  <span class="text-sm">{content.info}</span>
                  <Show when={!isLast}>
                    <span>·</span>
                  </Show>
                </>
              }
            >
              {(href) => (
                <>
                  <Link {...href()}>
                    <span class="text-base hover:underline">
                      {content.info}
                    </span>
                  </Link>
                  <Show when={!isLast}>
                    <span>·</span>
                  </Show>
                </>
              )}
            </Show>
          );
        }}
      </For>
    </div>
  );
}

export function Description(props: Props & ParentProps) {
  let imageDirection = () => props.imageDirection ?? "vertical";
  return (
    <div class="flex w-full flex-col gap-8 md:flex-row">
      <div
        class={`${imageDirection() == "horizontal" ? "w-80" : "w-52"} relative h-fit shrink-0 overflow-hidden rounded-xl`}
      >
        <FallbackImage
          alt="Description image"
          width={imageDirection() == "horizontal" ? 320 : 208}
          class="rounded-xl"
          height={imageDirection() == "horizontal" ? 180 : 312}
          srcList={props.posterList}
        />
        <Show when={props.progress}>
          {(progress) => (
            <ProgressBar
              history={progress().history}
              runtime={progress().runtime}
            />
          )}
        </Show>
      </div>
      <div class="space-y-4">
        <div class="text-3xl">
          <span>{props.title}</span>
        </div>
        <Show when={props.additionalInfo}>
          {(info) => <Addition data={info()} />}
        </Show>
        <Show when={props.plot && props.plot.length > 0}>
          <p
            title={props.plot ?? undefined}
            class={`${imageDirection() == "horizontal" ? "line-clamp-4" : "line-clamp-5"} max-w-5xl`}
          >
            {props.plot}
          </p>
        </Show>
        {props.children}
      </div>
    </div>
  );
}

export function DescriptionSkeleton(props: { direction: ImageDirection }) {
  return (
    <div class="flex w-full flex-col gap-8 md:flex-row">
      <Skeleton
        class={clsx(
          props.direction == "horizontal"
            ? "h-[180px] w-[320px]"
            : "h-[312px] w-[208px]",
          "shrink-0",
        )}
      />
      <div class="w-full flex-col space-y-4">
        <Skeleton class="h-10 w-60" />
        <div class="flex items-center space-x-4">
          {[...Array(3)].map(() => (
            <Skeleton class="h-3 w-12" />
          ))}
        </div>
        <Skeleton class="h-16 w-5/6" />
      </div>
    </div>
  );
}
