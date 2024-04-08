import { For, ParentProps, Show } from "solid-js";
import {} from "../utils/serverApi";
import BlurImage from "./BlurImage";

type Props = {
  poster?: string;
  plot?: string;
  title: string;
  additionalInfo?: string[];
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
        <BlurImage
          width={imageDirection == "horizontal" ? 350 : 208}
          class="rounded-xl"
          height={imageDirection == "horizontal" ? 208 : 312}
          src={props.poster ?? ""}
          blurData={undefined}
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
            title={props.plot}
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
