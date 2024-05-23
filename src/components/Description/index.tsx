import { For, ParentProps, Show } from "solid-js";
import {} from "../../utils/serverApi";
import FallbackImage from "../FallbackImage";

type Props = {
  poster?: string | null;
  localPoster: string | undefined;
  plot?: string | null;
  title: string;
  additionalInfo?: string[] | null;
  imageDirection?: "horizontal" | "vertical";
};

function Addition(props: { data: string[] }) {
  return (
    <div class="flex items-center gap-1">
      <For each={props.data}>
        {(content, i) => {
          let isLast = i() == props.data.length - 1;
          return (
            <>
              <span class="text-sm">{content}</span>
              <Show when={!isLast}>
                <span>·</span>
              </Show>
            </>
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
            class={`${imageDirection == "horizontal" ? "line-clamp-2" : "line-clamp-5"} max-w-2xl animate-fade-in pt-8`}
          >
            {props.plot}
          </p>
        </Show>
        {props.children}
      </div>
    </div>
  );
}
