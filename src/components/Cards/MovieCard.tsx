import { components } from "../../client/types";
import MoreButton, { Row } from "../ContextMenu/MoreButton";
import { A } from "@solidjs/router";
import FallbackImage from "../FallbackImage";
import { fullUrl } from "../../utils/serverApi";

function provider(provider: string): string {
  if (provider === "local") {
    return "";
  }
  return `?provider=${provider}`;
}

export default function MovieCard(props: {
  movie: components["schemas"]["MovieMetadata"];
}) {
  let url = `/movies/${props.movie.metadata_id}${provider(props.movie.metadata_provider)}`;
  function handleDelete() { }

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

  let localUrl =
    props.movie.metadata_provider == "local"
      ? fullUrl("/api/movie/{id}/poster", {
        path: { id: +props.movie.metadata_id },
      })
      : undefined;

  return (
    <>
      <div class="w-52">
        <A href={url} class="relative w-full">
          <FallbackImage
            alt="Movie poster"
            srcList={[localUrl, props.movie.poster ?? undefined]}
            class="rounded-xl"
            width={208}
            height={312}
          />
        </A>
        <div class="flex items-center justify-between">
          <A href={url}>
            <div class="truncate text-lg">
              <span>{props.movie.title}</span>
            </div>
          </A>
          <MoreButton rows={rows} />
        </div>
      </div>
    </>
  );
}
