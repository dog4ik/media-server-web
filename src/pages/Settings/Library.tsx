import SectionTitle from "../../components/Settings/SectionTitle";
import SectionSubTitle from "../../components/Settings/SectionSubTitle";
import BlurImage from "../../components/BlurImage";
import { getAllVariants } from "../../utils/serverApi";
import { createAsync, revalidate } from "@solidjs/router";
import { For } from "solid-js";
import { type Variant, removeVariant } from "../../utils/serverApi";

type VariantProps = {
  variant: Variant;
  poster: string;
  title: string;
  onDelete: () => void;
};

function Variant(props: VariantProps) {
  return (
    <div class="flex items-center justify-between gap-5">
      <BlurImage src={props.poster} height={80} width={60} />
      <div>{props.title}</div>
      <div>
        <button class="btn btn-error" onClick={props.onDelete}>
          Remove
        </button>
      </div>
    </div>
  );
}

function Variants() {
  let items = createAsync(async () => await getAllVariants());
  async function onDelete(videoId: number, variantId: string) {
    await removeVariant({ video_id: videoId, variant_id: variantId });
    revalidate(getAllVariants.key);
  }

  return (
    <div class="flex flex-col gap-5">
      <For each={items()}>
        {(item) => (
          <For each={item.variants}>
            {(variant) => (
              <Variant
                onDelete={() => onDelete(item.video_id, variant.id)}
                variant={variant}
                title={item.title}
                poster={item.poster}
              />
            )}
          </For>
        )}
      </For>
    </div>
  );
}

export default function Library() {
  return (
    <div class="flex flex-col">
      <SectionTitle name="Library" />
      <SectionSubTitle name="Library variants" />
      <Variants />
    </div>
  );
}
