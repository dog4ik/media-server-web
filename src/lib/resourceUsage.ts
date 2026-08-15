import type { Schemas } from "@/utils/serverApi";
import {
  CHART_COLORS,
  chartColor,
  OTHER_COLOR,
  OVERHEAD_COLOR,
} from "./chartColors";

export type DirKind = "movies" | "shows" | "database" | "resources" | "tmp";

export type TrackedDir = {
  id: string;
  label: string;
  path: string;
  size: number;
  kind: DirKind;
  colorIndex: number;
};

// Ids are only looked up with getElementById, so any space-free string is valid
export function dirAnchorId(path: string): string {
  return `dir-${path.replaceAll(" ", "-")}`;
}

function pathSegments(path: string): string[] {
  let segments: string[] = [];
  let current = "";
  for (let char of path) {
    if (char === "/" || char === "\\") {
      if (current) segments.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  if (current) segments.push(current);
  return segments;
}

function basename(path: string): string {
  return pathSegments(path).at(-1) ?? path;
}

// Media dirs on different disks often share a basename (".../movies"); extend
// colliding labels with parent segments until they can be told apart
function disambiguateLabels<T extends { label: string; path: string }>(
  dirs: T[],
): T[] {
  for (let depth = 2; ; depth++) {
    let counts = new Map<string, number>();
    for (let dir of dirs)
      counts.set(dir.label, (counts.get(dir.label) ?? 0) + 1);
    let extended = false;
    for (let dir of dirs) {
      if (counts.get(dir.label)! < 2) continue;
      let segments = pathSegments(dir.path);
      if (segments.length < depth) continue;
      dir.label = segments.slice(-depth).join("/");
      extended = true;
    }
    if (!extended) return dirs;
  }
}

export function collectTrackedDirs(
  resources: Schemas["Resources"],
): TrackedDir[] {
  let dirs: Omit<TrackedDir, "id" | "colorIndex">[] = [
    ...resources.movie_media_dirs.map((dir) => ({
      label: basename(dir.path),
      path: dir.path,
      size: dir.size,
      kind: "movies" as const,
    })),
    ...resources.show_media_dirs.map((dir) => ({
      label: basename(dir.path),
      path: dir.path,
      size: dir.size,
      kind: "shows" as const,
    })),
    {
      label: "Database",
      path: resources.db_path,
      size: resources.db_size,
      kind: "database" as const,
    },
    {
      label: "Resources",
      path: resources.resources_path,
      size: resources.resources_size,
      kind: "resources" as const,
    },
    {
      label: "Temp",
      path: resources.tmp_path,
      size: resources.tmp_size,
      kind: "tmp" as const,
    },
  ];
  // colorIndex is the position in this fixed order so a directory keeps its color everywhere
  return disambiguateLabels(
    dirs.map((dir, colorIndex) => ({
      ...dir,
      id: dirAnchorId(dir.path),
      colorIndex,
    })),
  );
}

function isPathPrefix(mountpoint: string, path: string): boolean {
  if (path === mountpoint) return true;
  if (!path.startsWith(mountpoint)) return false;
  let next = path[mountpoint.length];
  return (
    mountpoint.endsWith("/") ||
    mountpoint.endsWith("\\") ||
    next === "/" ||
    next === "\\"
  );
}

export function diskForPath(
  disks: Schemas["Disk"][],
  path: string,
): Schemas["Disk"] | undefined {
  let best: Schemas["Disk"] | undefined;
  for (let disk of disks) {
    if (!isPathPrefix(disk.mountpoint, path)) continue;
    if (!best || disk.mountpoint.length > best.mountpoint.length) best = disk;
  }
  return best;
}

export type DiskGroup = { disk: Schemas["Disk"]; dirs: TrackedDir[] };

export function groupByDisk(
  disks: Schemas["Disk"][],
  trackedDirs: TrackedDir[],
): { groups: DiskGroup[]; unmatched: TrackedDir[] } {
  let groups = disks.map((disk) => ({ disk, dirs: [] as TrackedDir[] }));
  let unmatched: TrackedDir[] = [];
  for (let dir of trackedDirs) {
    let disk = diskForPath(disks, dir.path);
    let group = groups.find((g) => g.disk === disk);
    if (group) group.dirs.push(dir);
    else unmatched.push(dir);
  }
  for (let group of groups) group.dirs.sort((a, b) => b.size - a.size);
  return { groups, unmatched };
}

export type UsageSegment = {
  label: string;
  size: number;
  color?: string;
  dir?: TrackedDir;
  content?: Schemas["MediaDirContent"];
};

export function driveSegments(group: DiskGroup): UsageSegment[] {
  let used = group.disk.total_space - group.disk.available_space;
  let tracked = group.dirs.map((dir) => ({
    label: dir.label,
    size: dir.size,
    color: chartColor(dir.colorIndex),
    dir,
  }));
  let trackedTotal = tracked.reduce((sum, segment) => sum + segment.size, 0);
  // Nested tracked dirs double-count into trackedTotal; the clamp keeps the bar valid
  let otherUsed = Math.max(0, used - trackedTotal);
  return [
    ...tracked,
    { label: "Other used", size: otherUsed, color: OTHER_COLOR },
  ];
}

export function dirSegments(dir: Schemas["MediaDirStats"]): UsageSegment[] {
  // contents come sorted by size (descending) from the server
  let segments: UsageSegment[] = dir.contents
    .slice(0, CHART_COLORS.length)
    .map((content, index) => ({
      label: content.title,
      size: content.size,
      color: chartColor(index),
      content,
    }));
  let rest = dir.contents.slice(CHART_COLORS.length);
  if (rest.length > 0) {
    segments.push({
      label: `${rest.length} more items`,
      size: rest.reduce((sum, content) => sum + content.size, 0),
      color: OTHER_COLOR,
    });
  }
  let contentTotal = dir.contents.reduce(
    (sum, content) => sum + content.size,
    0,
  );
  let overhead = Math.max(0, dir.size - contentTotal);
  if (overhead > 0) {
    segments.push({
      label: "Other files",
      size: overhead,
      color: OVERHEAD_COLOR,
    });
  }
  return segments;
}

if (import.meta.vitest) {
  const { describe, test, assert } = import.meta.vitest;

  const disk = (mountpoint: string): Schemas["Disk"] => ({
    mountpoint,
    fs: "ext4",
    available_space: 0,
    total_space: 0,
    is_read_only: false,
    is_removable: false,
  });

  describe("diskForPath", () => {
    const disks = [disk("/"), disk("/mnt"), disk("/mnt/media")];

    test("picks the longest matching mountpoint", () => {
      assert.strictEqual(
        diskForPath(disks, "/mnt/media/movies")?.mountpoint,
        "/mnt/media",
      );
      assert.strictEqual(diskForPath(disks, "/mnt/other")?.mountpoint, "/mnt");
      assert.strictEqual(diskForPath(disks, "/home/user")?.mountpoint, "/");
    });

    test("prefix must end on a path boundary", () => {
      assert.strictEqual(
        diskForPath(disks, "/mnt/mediastore")?.mountpoint,
        "/mnt",
      );
    });

    test("no match without a root disk", () => {
      assert.strictEqual(diskForPath([disk("/mnt")], "/home/user"), undefined);
    });
  });

  describe("dirAnchorId", () => {
    test("spaces are the only invalid id characters", () => {
      assert.strictEqual(
        dirAnchorId("/mnt/media library/tv"),
        "dir-/mnt/media-library/tv",
      );
    });
  });

  describe("collectTrackedDirs", () => {
    test("colliding basenames get parent segments", () => {
      const resources: Schemas["Resources"] = {
        config_path: "/srv/config.toml",
        db_path: "/srv/db.sqlite",
        db_size: 1,
        disks: [],
        metadata_orphan_count: 0,
        movie_media_dirs: [],
        show_media_dirs: [
          { path: "/mnt/a/shows", size: 1, contents: [] },
          { path: "/mnt/b/shows", size: 1, contents: [] },
        ],
        resources_path: "/srv/resources",
        resources_size: 1,
        tmp_path: "/srv/tmp",
        tmp_size: 0,
      };
      const labels = collectTrackedDirs(resources).map((dir) => dir.label);
      assert.deepEqual(labels, [
        "a/shows",
        "b/shows",
        "Database",
        "Resources",
        "Temp",
      ]);
    });
  });
}
