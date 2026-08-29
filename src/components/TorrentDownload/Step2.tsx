import { For, type ParentProps, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { Checkbox, CheckboxControl } from "@/ui/checkbox";
import { formatSE, formatSize } from "../../utils/formats";
import type { Schemas } from "../../utils/serverApi";
import { ElementsGrid } from "../ElementsGrid";

type Props = {
  content: Schemas["TorrentInfo"];
  onFileSelect: (files: boolean[]) => void;
};

type FileProps = {
  path?: string;
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
    <div class="flex flex-col">
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
      type="button"
      title={props.path}
      onClick={() => props.onSelect(!props.isSelected)}
      class="relative flex h-44 w-80 flex-col overflow-hidden rounded-xl select-none"
    >
      <img
        draggable={false}
        alt=""
        class={`absolute max-h-full max-w-full object-cover transition-all ${props.isSelected ? "brightness-95" : "brightness-50"}`}
        width={320}
        height={180}
        src={props.poster ?? "/no-photo.png"}
      />
      <div class="absolute top-3 right-3">
        <Checkbox checked={props.isSelected}>
          <CheckboxControl />
        </Checkbox>
      </div>
      <Show when={props.subtitle}>
        <div class="absolute top-3 left-3">
          <span>{props.subtitle}</span>
        </div>
      </Show>
      <div class="absolute bottom-3 left-3 w-3/4 max-w-52 truncate text-start">
        <span class="text-lg">{props.title}</span>
      </div>
      <div class="absolute right-3 bottom-3 w-1/3 truncate text-end">
        <span class="text-lg">{formatSize(props.size)}</span>
      </div>
      <div class="absolute top-3 right-3">
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
    for (const idx of idxes) {
      values[idx] = force;
    }
    setSelectedFiles(values);
    props.onFileSelect(selectedFiles);
  }

  let show = () => {
    let content = props.content.content;
    return content?.media_type === "show" ? content : undefined;
  };

  let movies = () => {
    let content = props.content.content;
    return content?.media_type === "movie" ? content.movies : undefined;
  };

  return (
    <>
      <Show when={show()}>
        {(show) => (
          <For each={Object.entries(show().seasons)}>
            {([seasonNumber, season]) => (
              <SelectionSector
                isSelected={season.every((ep) => selectedFiles[ep.file_idx])}
                title={`Season: ${seasonNumber}`}
                onSelect={(force) =>
                  selectMany(
                    season.map((ep) => ep.file_idx),
                    force,
                  )
                }
              >
                <For each={season}>
                  {(episode) => (
                    <File
                      title={episode.metadata.title}
                      subtitle={`Episode ${formatSE(episode.metadata.number)}`}
                      path={episode.path.at(-1)}
                      poster={episode.metadata.poster ?? undefined}
                      isSelected={selectedFiles[episode.file_idx]}
                      size={episode.size}
                      onSelect={(force) => select(episode.file_idx, force)}
                    />
                  )}
                </For>
              </SelectionSector>
            )}
          </For>
        )}
      </Show>
      <Show when={movies()}>
        {(movies) => (
          <SelectionSector
            title="Movie"
            onSelect={(force) =>
              selectMany(
                movies().map((f) => f.file_idx),
                force,
              )
            }
            isSelected={movies().every((v) => selectedFiles[v.file_idx])}
          >
            <For each={movies()}>
              {(movie) => (
                <File
                  isSelected={selectedFiles[movie.file_idx]}
                  title={movie.metadata.title}
                  poster={movie.metadata.poster ?? undefined}
                  onSelect={(force) => select(movie.file_idx, force)}
                  path={movie.path.at(-1)}
                  size={movie.size}
                />
              )}
            </For>
          </SelectionSector>
        )}
      </Show>
      <Show when={props.content.other_files.length}>
        <SelectionSector
          title="Other files"
          onSelect={(force) =>
            selectMany(
              props.content.other_files.map((f) => f.file_idx),
              force,
            )
          }
          isSelected={props.content.other_files.every(
            (v) => selectedFiles[v.file_idx],
          )}
        >
          <For each={props.content.other_files}>
            {(file) => (
              <File
                isSelected={selectedFiles[file.file_idx]}
                title={file.path.at(-1) ?? ""}
                onSelect={(force) => select(file.file_idx, force)}
                path={file.path.at(-1)}
                size={file.size}
              />
            )}
          </For>
        </SelectionSector>
      </Show>
    </>
  );
}
