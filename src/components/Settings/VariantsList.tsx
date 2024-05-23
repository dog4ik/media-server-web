import { A, createAsync } from "@solidjs/router";
import { Schemas, revalidatePath, server } from "../../utils/serverApi";
import BlurImage from "../BlurImage";
import { For } from "solid-js";
import FallbackImage from "../FallbackImage";
import ServerNotAvailable from "../../pages/ServerNotAvailable";
import { ServerError } from "../../utils/errors";

type VariantProps = {
  variant: Schemas["VariantSummary"]["variants"][number];
  poster?: string | null;
  title: string;
  href: string;
  onDelete: () => void;
};

function Variant(props: VariantProps) {
  return (
    <div class="flex max-w-2xl items-center justify-between gap-5">
      <A href={props.href}>
        <FallbackImage
          class="rounded-md"
          srcList={[props.poster ?? undefined]}
          alt={"Content's poster"}
          width={160}
          height={120}
        />
        <div>{props.title}</div>
      </A>
      <button class="btn btn-error" onClick={props.onDelete}>
        Remove
      </button>
    </div>
  );
}

export default function Variants() {
  let items = createAsync(async () => {
    let variants = await server.GET("/api/variants");
    if (!variants.data) throw new ServerError("Failed to get all variants");
    let promises: Promise<string | undefined>[] = [];
    for (let video of variants.data) {
      if (video.content_type == "show") {
        promises.push(
          server
            .GET("/api/local_episode/by_video", {
              params: { query: { id: video.video_id } },
            })
            .then((r) =>
              r.data
                ? `/shows/${video.content_id}/${r.data.season_number}/${r.data.number}`
                : undefined,
            ),
        );
      }
      if (video.content_type == "movie") {
        promises.push(new Promise((res) => res(`/movies/${video.content_id}`)));
      }
    }
    let settled = await Promise.allSettled(promises);
    return variants.data?.map((d, idx) => {
      let settledUrl = settled[idx];
      let href =
        settledUrl.status == "fulfilled" ? settledUrl.value : undefined;
      return {
        ...d,
        href,
      };
    });
  });
  async function onDelete(videoId: number, variantId: string) {
    await server.DELETE("/api/video/{id}/variant/{variant_id}", {
      params: { path: { id: videoId, variant_id: variantId } },
    });
    await revalidatePath("/api/variants");
  }

  return (
    <div class="flex flex-col gap-5">
      <For each={items()}>
        {(item) => {
          return (
            <For each={item.variants}>
              {(variant) => (
                <Variant
                  onDelete={() => onDelete(item.video_id, variant.id)}
                  href={item.href ?? ""}
                  variant={variant}
                  title={item.title}
                  poster={item.poster}
                />
              )}
            </For>
          );
        }}
      </For>
    </div>
  );
}
