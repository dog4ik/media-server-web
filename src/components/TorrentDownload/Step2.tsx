import { For, ParentProps, Show, createMemo, createSignal } from "solid-js";
import { Schemas } from "../../utils/serverApi";
import ElementsGrid from "../ElementsGrid";
import { formatSize } from "../../utils/formats";

type Props = {
  content: Schemas["TorrentInfo"];
  onFileSelect: (files: number[]) => void;
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

type CheckboxProps = {
  onSelect?: (force: boolean) => void;
  isChecked: boolean;
};

function Checkbox(props: CheckboxProps) {
  return (
    <input
      type="checkbox"
      checked={props.isChecked}
      onChange={(e) =>
        props.onSelect && props.onSelect(e.currentTarget.checked)
      }
      class="checkbox-accent checkbox checkbox-lg rounded-full"
    />
  );
}

function SelectionSector(props: SelectionSectorProps & ParentProps) {
  return (
    <div class="flex flex-col py-10">
      <div class="flex items-center gap-4">
        <span class="text-3xl">{props.title}</span>
        <Checkbox isChecked={props.isSelected} onSelect={props.onSelect} />
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
        <Checkbox isChecked={props.isSelected} />
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
        <Checkbox isChecked={props.isSelected} />
      </div>
    </button>
  );
}

export default function Step2(props: Props) {
  let [selectedFiles, setSelectedFiles] = createSignal<number[]>([]);
  function handleSelect(idx: number, force: boolean) {
    if (force) {
      setSelectedFiles([...selectedFiles(), idx]);
    } else {
      setSelectedFiles(selectedFiles().filter((i) => i != idx));
    }
    props.onFileSelect(selectedFiles());
  }

  function handleManySelect(idxes: number[], force: boolean) {
    if (force) {
      for (let idx of idxes) {
        if (!selectedFiles().includes(idx)) {
          setSelectedFiles([...selectedFiles(), idx]);
        }
      }
    } else {
      for (let idx of idxes) {
        setSelectedFiles(selectedFiles().filter((i) => i != idx));
      }
    }
    props.onFileSelect(selectedFiles());
  }
  let file = (idx: number) => props.content.contents.files[idx];

  let otherFiles = createMemo(() => {
    if (props.content.contents.content?.show) {
      let allShows = Object.values(
        props.content.contents.content.show.seasons,
      ).flatMap((d) => d.map((f) => f.file_idx));
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

  return (
    <>
      <Show when={props.content.contents.content?.show}>
        {(show) => (
          <For each={Object.entries(show().seasons)}>
            {([seasonNumber, season]) => (
              <SelectionSector
                isSelected={season.every((ep) =>
                  selectedFiles().includes(ep.file_idx),
                )}
                title={`Season: ${seasonNumber}`}
                onSelect={(force) =>
                  handleManySelect(
                    season.map((ep) => ep.file_idx),
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
                      isSelected={selectedFiles().includes(episode.file_idx)}
                      size={file(episode.file_idx).size}
                      onSelect={(force) =>
                        handleSelect(episode.file_idx, force)
                      }
                    />
                  )}
                </For>
              </SelectionSector>
            )}
          </For>
        )}
      </Show>
      <Show when={props.content.contents.content?.movie}>
        <SelectionSector
          title="Movie"
          onSelect={(force) =>
            handleManySelect(
              props.content.contents.content!.movie!.map((f) => f.file_idx),
              force,
            )
          }
          isSelected={otherFiles().every((v) =>
            selectedFiles().includes(v.idx),
          )}
        >
          <For each={props.content.contents.content?.movie}>
            {(movie) => (
              <File
                isSelected={selectedFiles().includes(movie.file_idx)}
                title={file(movie.file_idx).path.at(-1)!}
                onSelect={(force) => handleSelect(movie.file_idx, force)}
                path={file(movie.file_idx).path.at(-1)!}
                size={file(movie.file_idx).size}
              />
            )}
          </For>
        </SelectionSector>
      </Show>
      <Show when={otherFiles().length}>
        <SelectionSector
          title="Other files"
          onSelect={(force) =>
            handleManySelect(
              otherFiles().map((f) => f.idx),
              force,
            )
          }
          isSelected={otherFiles().every((v) =>
            selectedFiles().includes(v.idx),
          )}
        >
          <For each={otherFiles()}>
            {(file) => (
              <File
                isSelected={selectedFiles().includes(file.idx)}
                title={file.path.at(-1)!}
                onSelect={(force) => handleSelect(file.idx, force)}
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
