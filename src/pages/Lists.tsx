import { Component, createSignal, ErrorBoundary, For, Show, Suspense } from "solid-js";
import { Dynamic } from "solid-js/web";
import { Link } from "@tanstack/solid-router";
import Plus from "lucide-solid/icons/plus";
import Clock from "lucide-solid/icons/clock";
import Bookmark from "lucide-solid/icons/bookmark";
import ListVideo from "lucide-solid/icons/list-video";
import PageTitle from "@/components/PageTitle";
import { queryApi, queryClient } from "@/utils/queryApi";
import { errorBoundaryFallback } from "@/components/Error";
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Skeleton } from "@/ui/skeleton";
import MoreButton from "@/components/ContextMenu/MoreButton";
import { MenuRow } from "@/components/ContextMenu/Menu";
import promptConfirm from "@/components/modals/ConfirmationModal";
import { ListFormDialog } from "@/components/Lists/ListFormDialog";
import type { Schemas } from "@/utils/serverApi";

type ListCardProps = {
  list: Schemas["List"];
  icon: Component<{ class?: string }>;
  onEdit?: () => void;
  onDelete?: () => void;
};

function ListCard(props: ListCardProps) {
  return (
    <Card class="relative gap-3 py-4 transition-colors has-[a:hover]:border-white/20">
      <CardHeader class="px-4">
        <CardTitle>
          {/* Stretched link: makes the whole card clickable */}
          <Link
            to="/lists/$id"
            params={{ id: props.list.id.toString() }}
            class="flex items-center gap-2 after:absolute after:inset-0"
          >
            <Dynamic component={props.icon} class="text-muted-foreground size-4 shrink-0" />
            <span class="truncate">{props.list.name}</span>
          </Link>
        </CardTitle>
        <CardDescription class="line-clamp-2 min-h-5">{props.list.description}</CardDescription>
        <Show when={props.onEdit}>
          <CardAction class="relative z-10">
            <MoreButton>
              <MenuRow onClick={props.onEdit}>Edit list</MenuRow>
              <MenuRow variant="destructive" onClick={props.onDelete}>
                Delete list
              </MenuRow>
            </MoreButton>
          </CardAction>
        </Show>
      </CardHeader>
      <CardFooter class="px-4">
        <span class="text-muted-foreground text-sm">
          {props.list.size} {props.list.size === 1 ? "item" : "items"}
        </span>
      </CardFooter>
    </Card>
  );
}

function ListCardSkeleton() {
  return <Skeleton class="h-28 rounded-xl" />;
}

function ListsSkeleton() {
  return (
    <div class="grid gap-4 p-2 sm:grid-cols-2 sm:p-4 xl:grid-cols-3">
      {[...Array(4)].map(ListCardSkeleton)}
    </div>
  );
}

export default function Lists() {
  let lists = queryApi.useQuery("get", "/api/lists");
  let [dialog, setDialog] = createSignal<{
    open: boolean;
    list?: Schemas["List"];
  }>({
    open: false,
  });

  let deleteList = queryApi.useMutation("delete", "/api/lists/{id}", () => ({
    onSettled: () => queryApi.invalidateQueries(queryClient, "get", "/api/lists"),
  }));

  async function handleDelete(list: Schemas["List"]) {
    if (await promptConfirm(`Are you sure you want to delete "${list.name}"?`)) {
      deleteList.mutate({ params: { path: { id: list.id } } });
    }
  }

  return (
    <>
      <div class="flex items-center justify-between pr-2 sm:pr-8">
        <PageTitle>Lists</PageTitle>
        <Button onClick={() => setDialog({ open: true })}>
          <Plus />
          New list
        </Button>
      </div>
      <Show when={dialog().open}>
        <ListFormDialog
          open={dialog().open}
          list={dialog().list}
          onClose={() => setDialog({ open: false })}
        />
      </Show>
      <ErrorBoundary fallback={errorBoundaryFallback("Failed to fetch lists")}>
        <Suspense fallback={<ListsSkeleton />}>
          <div class="space-y-8 p-2 sm:p-4">
            <Show when={lists.data}>
              {(all) => (
                <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <ListCard list={all().watch} icon={Clock} />
                  <ListCard list={all().saved} icon={Bookmark} />
                </section>
              )}
            </Show>
            <section>
              <h2 class="text-muted-foreground mb-4 text-sm font-medium tracking-wide uppercase">
                My lists
              </h2>
              <Show
                when={lists.data?.custom.length}
                fallback={
                  <p class="text-muted-foreground">
                    You don't have any custom lists yet. Create one to organize your library.
                  </p>
                }
              >
                <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <For each={lists.data?.custom}>
                    {(list) => (
                      <ListCard
                        list={list}
                        icon={ListVideo}
                        onEdit={() => setDialog({ open: true, list })}
                        onDelete={() => handleDelete(list)}
                      />
                    )}
                  </For>
                </div>
              </Show>
            </section>
          </div>
        </Suspense>
      </ErrorBoundary>
    </>
  );
}
