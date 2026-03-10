import { ErrorBoundary, For, Show, Suspense } from "solid-js";
import { ShowCard, ShowCardSkeleton } from "../components/Cards/ShowCard";
import PageTitle from "../components/PageTitle";
import { ElementsGrid } from "../components/ElementsGrid";
import AddFoldersHelp from "@/components/AddFoldersHelp";
import { queryApi } from "@/utils/queryApi";
import { errorBoundaryFallback } from "@/components/Error";

export default function Shows() {
  const shows = queryApi.useQuery("get", "/api/local_shows");

  return (
    <>
      <PageTitle>Shows</PageTitle>
      <ErrorBoundary fallback={errorBoundaryFallback("Failed to fetch shows")}>
        <Show
          when={shows.latest() !== undefined && shows.latest()?.length === 0}
        >
          <AddFoldersHelp contentType="show" />
        </Show>
        <ElementsGrid elementSize={250}>
          <Suspense fallback={<>{[...Array(7)].map(ShowCardSkeleton)}</>}>
            <For each={shows.data}>{(show) => <ShowCard show={show} />}</For>
          </Suspense>
        </ElementsGrid>
      </ErrorBoundary>
    </>
  );
}
