import { A } from "@solidjs/router";
import { Schemas, fullUrl } from "../../utils/serverApi";
import MoreButton, { Row } from "../ContextMenu/MoreButton";
import { Show } from "solid-js";
import { FiDownload } from "solid-icons/fi";
import { formatDuration, formatTimeBeforeRelease } from "../../utils/formats";
import ProgressBar from "./ProgressBar";
import FallbackImage from "../FallbackImage";

type Props = {
  episode: Schemas["EpisodeMetadata"];
  url: string;
  availableLocally: boolean;
  history?: Schemas["DbHistory"];
  onFixMetadata: () => void;
  onOptimize: () => void;
  onDelete: () => void;
};

export default function EpisodeCard(props: Props) {
  let rows: Row[] = [
    { title: "Row1" },
    { title: "Row2" },
    {
      title: "Expanded",
      expanded: [
        { title: "ExpandedRow1" },
        { title: "ExpandedRow2" },
        {
          title: "ExpandedExpanded",
          expanded: [
            {
              title: "ExpandedExpanded1",
            },
            {
              title: "ExpandedExpanded2",
            },
          ],
        },
      ],
    },
  ];

  let imageUrl =
    props.episode.metadata_provider == "local"
      ? fullUrl("/api/episode/{id}/poster", {
        path: { id: +props.episode.metadata_id },
      })
      : undefined;

  return (
    <div class="flex w-80 cursor-pointer flex-col">
      <A href={props.url} class="relative w-full overflow-hidden rounded-xl">
        <FallbackImage
          alt="Episode poster"
          width={320}
          height={178}
          class="aspect-video rounded-xl"
          srcList={[imageUrl, props.episode.poster ?? undefined]}
        />
        <Show when={props.episode.release_date}>
          {(date) => (
            <div class="bg-black-20 absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full">
              <span class="text-xl">{formatTimeBeforeRelease(date())}</span>
            </div>
          )}
        </Show>
        <Show when={props.availableLocally}>
          <div class="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
            <FiDownload />
          </div>
        </Show>
        <Show when={props.episode.runtime}>
          <div class="absolute bottom-2 right-2 flex items-center justify-center bg-black/90 p-1">
            <span class="text-xs font-semibold">
              {formatDuration(props.episode.runtime!)}
            </span>
          </div>
        </Show>
        <Show when={props.history && props.episode.runtime}>
          <ProgressBar
            history={props.history!}
            runtime={+props.episode.runtime!}
          />
        </Show>
      </A>
      <div class="flex items-center justify-between">
        <A href={props.url} class="flex flex-col pt-2">
          <span class="text-base" title={props.episode.title}>
            {props.episode.title}
          </span>
          <span class="pt-1 text-sm">Episode {props.episode.number}</span>
        </A>
        <MoreButton rows={rows} />
      </div>
    </div>
  );
}
