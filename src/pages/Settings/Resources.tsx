import { cx } from "cva";
import Film from "lucide-solid/icons/film";
import Gauge from "lucide-solid/icons/gauge";
import HardDrive from "lucide-solid/icons/hard-drive";
import Tv from "lucide-solid/icons/tv";
import {
  createMemo,
  ErrorBoundary,
  For,
  type JSX,
  Show,
  Suspense,
} from "solid-js";
import { errorBoundaryFallback } from "@/components/Error";
import { DriveCard } from "@/components/Resources/DriveCard";
import { MediaDirCard } from "@/components/Resources/MediaDirCard";
import SectionSubTitle from "@/components/Settings/SectionSubTitle";
import TranscodedVariantsList from "@/components/Settings/TranscodedVariantsList";
import { chartColor, OTHER_COLOR } from "@/lib/chartColors";
import {
  collectTrackedDirs,
  dirAnchorId,
  groupByDisk,
} from "@/lib/resourceUsage";
import { Skeleton } from "@/ui/skeleton";
import { formatSize } from "@/utils/formats";
import { queryApi } from "@/utils/queryApi";
import type { Schemas } from "@/utils/serverApi";

export function ResourcesPage() {
  let resources = queryApi.useQuery("get", "/api/resources");

  return (
    <div class="flex max-w-5xl flex-col gap-8 p-5">
      <ErrorBoundary
        fallback={errorBoundaryFallback("Failed to load resource usage")}
      >
        <Suspense fallback={<DashboardSkeleton />}>
          <Show when={resources.data}>
            {(data) => <ResourcesDashboard resources={data()} />}
          </Show>
        </Suspense>
      </ErrorBoundary>
      <section>
        <SectionSubTitle name="Transcoded variants" />
        <TranscodedVariantsList />
      </section>
    </div>
  );
}

function ResourcesDashboard(props: { resources: Schemas["Resources"] }) {
  let trackedDirs = createMemo(() => collectTrackedDirs(props.resources));
  let grouped = createMemo(() =>
    groupByDisk(props.resources.disks, trackedDirs()),
  );
  // ignore pseudo-filesystems that don't have any meaningful size
  let visibleGroups = () =>
    grouped().groups.filter(
      (group) => group.disk.total_space > 0 || group.dirs.length > 0,
    );
  let accentFor = (path: string) => {
    let dir = trackedDirs().find((dir) => dir.path === path);
    return dir ? chartColor(dir.colorIndex) : OTHER_COLOR;
  };

  return (
    <>
      <section class="space-y-4">
        <Eyebrow icon={<Gauge class="size-4" />} label="overview" />
        <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatTile
            label="Resources"
            value={formatSize(props.resources.resources_size)}
            note={props.resources.resources_path}
            noteMono
          />
          <StatTile
            label="Temp"
            value={formatSize(props.resources.tmp_size)}
            note={props.resources.tmp_path}
            noteMono
          />
          <StatTile
            label="Database"
            value={formatSize(props.resources.db_size)}
            note={props.resources.db_path}
            noteMono
          />
          <StatTile
            label="Orphan metadata"
            value={props.resources.metadata_orphan_count.toString()}
            note="stored but unused"
          />
        </div>
        <p
          class="text-muted-foreground truncate font-mono text-xs"
          title={props.resources.config_path}
        >
          config: {props.resources.config_path}
        </p>
      </section>

      <section class="space-y-4">
        <Eyebrow icon={<HardDrive class="size-4" />} label="drives" />
        <For each={visibleGroups()}>
          {(group) => <DriveCard group={group} />}
        </For>
        <Show when={grouped().unmatched.length > 0}>
          <div class="bg-card rounded-lg border p-4">
            <p class="text-muted-foreground text-sm">
              Not matched to any disk:{" "}
              <span class="font-mono">
                {grouped()
                  .unmatched.map((dir) => dir.path)
                  .join(", ")}
              </span>
            </p>
          </div>
        </Show>
      </section>

      <Show when={props.resources.movie_media_dirs.length > 0}>
        <section class="space-y-4">
          <Eyebrow icon={<Film class="size-4" />} label="movie directories" />
          <For each={props.resources.movie_media_dirs}>
            {(dir) => (
              <MediaDirCard
                dir={dir}
                kind="movies"
                anchorId={dirAnchorId(dir.path)}
                accentColor={accentFor(dir.path)}
              />
            )}
          </For>
        </section>
      </Show>

      <Show when={props.resources.show_media_dirs.length > 0}>
        <section class="space-y-4">
          <Eyebrow icon={<Tv class="size-4" />} label="show directories" />
          <For each={props.resources.show_media_dirs}>
            {(dir) => (
              <MediaDirCard
                dir={dir}
                kind="shows"
                anchorId={dirAnchorId(dir.path)}
                accentColor={accentFor(dir.path)}
              />
            )}
          </For>
        </section>
      </Show>
    </>
  );
}

function Eyebrow(props: { icon: JSX.Element; label: string }) {
  return (
    <div class="text-muted-foreground flex items-center gap-2">
      {props.icon}
      <span class="text-xs font-medium tracking-widest uppercase">
        {props.label}
      </span>
    </div>
  );
}

function StatTile(props: {
  label: string;
  value: string;
  note: string;
  noteMono?: boolean;
}) {
  return (
    <div class="bg-card rounded-lg border p-4">
      <p class="text-muted-foreground text-xs">{props.label}</p>
      <p class="mt-1 text-2xl font-semibold">{props.value}</p>
      <p
        class={cx(
          "text-muted-foreground mt-1 truncate text-xs",
          props.noteMono && "font-mono",
        )}
        title={props.note}
      >
        {props.note}
      </p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <For each={[...Array(4)]}>
          {() => <Skeleton class="h-24 rounded-lg" />}
        </For>
      </div>
      <Skeleton class="h-40 rounded-xl" />
      <Skeleton class="h-40 rounded-xl" />
    </>
  );
}
