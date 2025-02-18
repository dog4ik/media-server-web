import { For, ParentProps, Show, createMemo } from "solid-js";
import { Schemas } from "../../utils/serverApi";
import ElementsGrid from "../ElementsGrid";
import { formatSize } from "../../utils/formats";
import { createStore } from "solid-js/store";
import { Checkbox, CheckboxControl } from "@/ui/checkbox";

type Props = {
  content: Schemas["TorrentInfo"];
  onFileSelect: (files: boolean[]) => void;
};

type FileProps = {
  path: string;
  size: number;
  title: string;
  subtitle?: string;
  isSelected: boolean;
  poster?: string;
  onSelect: (isSelected: boolean) => void;
};

type SelectionSectorProps = {
  title: string;
  isSelected: boolean;
  onSelect: (force: boolean) => void;
};

function SelectionSector(props: SelectionSectorProps & ParentProps) {
  return (
    <div class="flex flex-col py-10">
      <div class="flex items-center gap-4">
        <span class="text-3xl">{props.title}</span>
        <Checkbox checked={props.isSelected} onChange={props.onSelect}>
          <CheckboxControl />
        </Checkbox>
      </div>
      <ElementsGrid elementSize={300}>{props.children}</ElementsGrid>
    </div>
  );
}

function File(props: FileProps) {
  return (
    <button
      title={props.path}
      onClick={() => props.onSelect(!props.isSelected)}
      class="relative flex h-44 w-80 select-none flex-col overflow-hidden rounded-xl"
    >
      <img
        draggable={false}
        class={`absolute max-h-full max-w-full object-cover transition-all ${props.isSelected ? "brightness-95" : "brightness-50"}`}
        width={320}
        height={180}
        src={props.poster ?? "/no-photo.png"}
      />
      <div class="absolute right-3 top-3">
        <Checkbox checked={props.isSelected}>
          <CheckboxControl />
        </Checkbox>
      </div>
      <Show when={props.subtitle}>
        <div class="absolute left-3 top-3">
          <span>{props.subtitle}</span>
        </div>
      </Show>
      <div
        title={props.title}
        class="absolute bottom-3 left-3 w-3/4 max-w-52 truncate text-start"
      >
        <span class="text-lg">{props.title}</span>
      </div>
      <div class="absolute bottom-3 right-3 w-1/3 truncate text-end">
        <span class="text-lg">{formatSize(props.size)}</span>
      </div>
      <div class="absolute right-3 top-3">
        <Checkbox checked={props.isSelected}>
          <CheckboxControl />
        </Checkbox>
      </div>
    </button>
  );
}

export default function Step2(props: Props) {
  let [selectedFiles, setSelectedFiles] = createStore<boolean[]>([]);
  function select(idx: number, force: boolean) {
    setSelectedFiles(idx, force);
    props.onFileSelect(selectedFiles);
  }

  function selectMany(idxes: number[], force: boolean) {
    let values = [...selectedFiles];
    for (let idx of idxes) {
      values[idx] = force;
    }
    setSelectedFiles(values);
    props.onFileSelect(selectedFiles);
  }

  let file = (idx: number) => props.content.contents.files[idx];

  let otherFiles = createMemo(() => {
    if (
      props.content.contents.content &&
      "show" in props.content.contents.content
    ) {
      let allShows = Object.values(
        props.content.contents.content.show.seasons,
      ).flatMap((d) => d?.map((f) => f.file_idx));
      return props.content.contents.files
        .map((f, i) => ({ ...f, idx: i }))
        .filter((_, idx) => !allShows.includes(idx));
    }
    if (props.content.contents.content?.movie) {
      let allMovies = Object.values(props.content.contents.content.movie).map(
        (d) => d.file_idx,
      );
      return props.content.contents.files
        .map((f, i) => ({ ...f, idx: i }))
        .filter((_, idx) => !allMovies.includes(idx));
    }
    return props.content.contents.files.map((f, i) => ({ ...f, idx: i }));
  });

  let show = () => {
    if (
      props.content.contents.content &&
      "show" in props.content.contents.content
    ) {
      return props.content.contents.content.show;
    }
  };

  let movie = () => {
    if (
      props.content.contents.content &&
      "movie" in props.content.contents.content
    ) {
      return props.content.contents.content.movie;
    }
  };

  return (
    <>
      <Show when={show()}>
        {(show) => (
          <For each={Object.entries(show().seasons)}>
            {([seasonNumber, season]) => (
              <SelectionSector
                isSelected={season!.every((ep) => selectedFiles[ep.file_idx])}
                title={`Season: ${seasonNumber}`}
                onSelect={(force) =>
                  selectMany(
                    season!.map((ep) => ep.file_idx),
                    force,
                  )
                }
              >
                <For each={season}>
                  {(episode) => (
                    <File
                      title={episode.metadata.title}
                      subtitle={`Episode ${episode.metadata.number.toString().padStart(2, "0")}`}
                      path={file(episode.file_idx).path.at(-1)!}
                      poster={episode.metadata.poster ?? undefined}
                      isSelected={selectedFiles[episode.file_idx]}
                      size={file(episode.file_idx).size}
                      onSelect={(force) => select(episode.file_idx, force)}
                    />
                  )}
                </For>
              </SelectionSector>
            )}
          </For>
        )}
      </Show>
      <Show when={movie()}>
        {(movie) => (
          <SelectionSector
            title="Movie"
            onSelect={(force) =>
              selectMany(
                movie().map((f) => f.file_idx),
                force,
              )
            }
            isSelected={movie().every((v) => selectedFiles[v.file_idx])}
          >
            <For each={movie()}>
              {(movie) => (
                <File
                  isSelected={selectedFiles[movie.file_idx]}
                  title={file(movie.file_idx).path.at(-1)!}
                  onSelect={(force) => select(movie.file_idx, force)}
                  path={file(movie.file_idx).path.at(-1)!}
                  size={file(movie.file_idx).size}
                />
              )}
            </For>
          </SelectionSector>
        )}
      </Show>
      <Show when={otherFiles().length}>
        <SelectionSector
          title="Other files"
          onSelect={(force) =>
            selectMany(
              otherFiles().map((f) => f.idx),
              force,
            )
          }
          isSelected={otherFiles().every((v) => selectedFiles[v.idx])}
        >
          <For each={otherFiles()}>
            {(file) => (
              <File
                isSelected={selectedFiles[file.idx]}
                title={file.path.at(-1)!}
                onSelect={(force) => select(file.idx, force)}
                path={file.path.at(-1)!}
                size={file.size}
              />
            )}
          </For>
        </SelectionSector>
      </Show>
    </>
  );
}
