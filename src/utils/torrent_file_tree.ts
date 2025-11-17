import { Schemas } from "./serverApi";

export type Entry = File | Directory;

export type File = {
  kind: "file";
} & Schemas["StateFile"];

export type Directory = {
  kind: "directory";
  priority: Schemas["Priority"] | "mixed";
  children: Entry[];
} & Omit<Schemas["StateFile"], "index" | "priority">;

export function buildFileTree(files: Schemas["StateFile"][]): Entry[] {
  let rootEntries: Entry[] = [];

  for (const file of files) {
    let currentChildren = rootEntries;
    let currentPath: string[] = [];

    for (let i = 0; i < file.path.length; i++) {
      let part = file.path[i];
      let isLast = i === file.path.length - 1;

      if (isLast) {
        // Add file as child
        currentChildren.push({ kind: "file", ...file });
      } else {
        currentPath = [...currentPath, part];

        // Find or create directory
        let fileDirectory: Directory | undefined = currentChildren.find(
          (c): c is Directory =>
            "children" in c && c.path[c.path.length - 1] === part,
        );

        if (!fileDirectory) {
          fileDirectory = {
            priority: file.priority,
            size: 0,
            children: [],
            path: currentPath,
            start_piece: file.start_piece,
            end_piece: file.end_piece,
            kind: "directory",
          };
          currentChildren.push(fileDirectory);
        }

        // Accumulate size
        fileDirectory.size += file.size;
        fileDirectory.end_piece = file.end_piece;
        if (file.priority != fileDirectory.priority) {
          fileDirectory.priority = "mixed";
        }

        // Move deeper
        currentChildren = fileDirectory.children;
      }
    }
  }

  return rootEntries;
}
