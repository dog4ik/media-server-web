import { For, ParentProps, Show } from "solid-js";
import {} from "../../utils/serverApi";
import FallbackImage from "../FallbackImage";
import { A } from "@solidjs/router";

type AdditionalInfo = {
  info: string;
  href?: string;
};

type Props = {
  poster?: string | null;
  localPoster: string | undefined;
  plot?: string | null;
  title: string;
  additionalInfo?: AdditionalInfo[];
  imageDirection?: "horizontal" | "vertical";
};

function Addition(props: { data: AdditionalInfo[] }) {
  return (
    <div class="flex items-center gap-1">
      <For each={props.data}>
        {(content, i) => {
          let isLast = i() == props.data.length - 1;
          return (
            <Show
              when={content.href}
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
                <A href={href()}>
                  <span class="text-base hover:underline">{content.info}</span>
                  <Show when={!isLast}>
                    <span>·</span>
                  </Show>
                </A>
              )}
            </Show>
          );
        }}
      </For>
    </div>
  );
}

export default function Description(props: Props & ParentProps) {
  let imageDirection = props.imageDirection ?? "vertical";
  return (
    <div class="flex w-full flex-col gap-8 md:flex-row">
      <div
        class={`${imageDirection == "horizontal" ? "w-80" : "w-52"} shrink-0`}
      >
        <FallbackImage
          alt="Description image"
          width={imageDirection == "horizontal" ? 350 : 208}
          class="rounded-xl"
          height={imageDirection == "horizontal" ? 208 : 312}
          srcList={[props.localPoster, props.poster ?? undefined]}
        />
      </div>
      <div>
        <div class="text-3xl">
          <span>{props.title}</span>
        </div>
        <Show when={props.additionalInfo}>
          <Addition data={props.additionalInfo!} />
        </Show>
        <Show when={props.plot && props.plot.length > 0}>
          <p
            title={props.plot ?? undefined}
            class={`${imageDirection == "horizontal" ? "line-clamp-4" : "line-clamp-5"} max-w-5xl pt-8`}
          >
            {props.plot}
          </p>
        </Show>
        {props.children}
      </div>
    </div>
  );
}
