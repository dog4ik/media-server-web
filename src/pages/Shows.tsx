import { createSignal, ErrorBoundary, For, Show, Suspense } from "solid-js";
import { ShowCard, ShowCardSkeleton } from "../components/Cards/ShowCard";
import PageTitle from "../components/PageTitle";
import { ElementsGrid } from "../components/ElementsGrid";
import AddFoldersHelp from "@/components/AddFoldersHelp";
import { queryApi } from "@/utils/queryApi";
import { errorBoundaryFallback } from "@/components/Error";
import { ContentFilterBar, DEFAULT_FILTER_STATE } from "@/components/ContentFilterBar";
import clsx from "clsx";

export default function Shows() {
  let [filterState, setFilterState] = createSignal(DEFAULT_FILTER_STATE);
  const shows = queryApi.useQuery(
    "get",
    "/api/local_shows",
    () => ({
      params: {
        query: {
          search: filterState().titleFilter,
          actors: filterState().actorFilter,
        },
      },
    }),
    () => ({ placeholderData: (stale) => stale }),
  );

  return (
    <>
      <PageTitle>Shows</PageTitle>
      <ContentFilterBar
        state={filterState()}
        onChange={(s) => {
          setFilterState(s);
        }}
      />
      <ErrorBoundary fallback={errorBoundaryFallback("Failed to fetch shows")}>
        <Show when={shows.latest() !== undefined && shows.latest()?.data.length === 0}>
          <AddFoldersHelp contentType="show" />
        </Show>
        <ElementsGrid elementSize={250}>
          <Suspense fallback={<>{[...Array(7)].map(ShowCardSkeleton)}</>}>
            <For each={shows.data?.data}>
              {(show) => (
                <div class={clsx(shows.isFetching && shows.isPlaceholderData && "opacity-50")}>
                  <ShowCard show={show} />
                </div>
              )}
            </For>
          </Suspense>
        </ElementsGrid>
      </ErrorBoundary>
    </>
  );
}
