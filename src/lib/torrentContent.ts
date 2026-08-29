import type { Schemas } from "@/utils/serverApi";
import { assertNever } from "./assert";

export type TorrentContent = Schemas["TorrentContent"];
export type TorrentFile = Schemas["ResolvedTorrentFile"];

/** Files the backend matched against metadata, flattened in content order. */
export function contentFiles(content: TorrentContent): TorrentFile[] {
  if (content.media_type === "show") {
    return Object.values(content.seasons).flat();
  }
  if (content.media_type === "movie") {
    return content.movies;
  }
  return assertNever(content);
}

/** Every file of the torrent: matched content files plus the unmatched rest. */
export function torrentFiles(info: Schemas["TorrentInfo"]): TorrentFile[] {
  let matched = info.content ? contentFiles(info.content) : [];
  return [...matched, ...info.other_files];
}

/** Lookup by `file_idx` */
export function torrentFilesIndex(
  info: Schemas["TorrentInfo"],
): Map<number, TorrentFile> {
  return new Map(torrentFiles(info).map((file) => [file.file_idx, file]));
}

if (import.meta.vitest) {
  const { describe, test, assert } = import.meta.vitest;

  function file(file_idx: number): TorrentFile {
    return {
      file_idx,
      offset: 0,
      path: [`${file_idx}.mkv`],
      priority: "medium",
      size: 100,
    };
  }

  describe("torrent content files", () => {
    test("show seasons are flattened in season order", () => {
      let content = {
        media_type: "show",
        seasons: {
          1: [file(3)],
          2: [file(1)],
        },
      } as unknown as TorrentContent;
      assert.deepStrictEqual(
        contentFiles(content).map((f) => f.file_idx),
        [3, 1],
      );
    });

    test("matched files and other files are both included", () => {
      let info = {
        content: { media_type: "movie", movies: [file(0)] },
        other_files: [file(1), file(2)],
      } as unknown as Schemas["TorrentInfo"];
      assert.deepStrictEqual(
        torrentFiles(info).map((f) => f.file_idx),
        [0, 1, 2],
      );
    });

    test("unmatched torrent falls back to other files", () => {
      let info = {
        content: null,
        other_files: [file(0), file(1)],
      } as unknown as Schemas["TorrentInfo"];
      assert.deepStrictEqual(
        torrentFiles(info).map((f) => f.file_idx),
        [0, 1],
      );
    });

    test("index is keyed by file_idx, not position", () => {
      let info = {
        content: null,
        other_files: [file(4), file(9)],
      } as unknown as Schemas["TorrentInfo"];
      let index = torrentFilesIndex(info);
      assert.strictEqual(index.get(9)?.path.at(-1), "9.mkv");
      assert.strictEqual(index.get(0), undefined);
    });
  });
}
