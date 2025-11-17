import { useTracksSelection } from "@/pages/Watch/TracksSelectionContext";
import { Show, createEffect, createSignal, createMemo } from "solid-js";

type Props = {
  time: number;
};

type SubtitleChunk = {
  idx: number;
  startTime: number;
  endTime: number;
  text: string;
};

export default function Subtitles(props: Props) {
  let [{ fetchedSubtitles, tracks }] = useTracksSelection();
  let subs = createMemo(() => {
    let subs = fetchedSubtitles.data;
    if (subs) {
      return srtParser(subs);
    }
  });

  let [currentIndex, setCurrentIndex] = createSignal(0);
  seek(props.time);
  let currentChunk = () => subs()?.at(currentIndex());

  function seek(time: number) {
    let s = subs();
    if (!s) return;
    let currentIndex = s.findIndex((v) => v.startTime > time);
    if (currentIndex === -1) {
      currentIndex = s.length - 1;
    }
    setCurrentIndex(currentIndex - 1);
  }

  createEffect(() => {
    seek(props.time);
  });

  return (
    <>
      <div class="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/80">
        <Show
          when={
            tracks.subtitles &&
            currentChunk() &&
            currentChunk()!.startTime <= props.time &&
            currentChunk()!.endTime > props.time
          }
        >
          <p class="flex rounded-md text-2xl 2xl:text-4xl">
            {currentChunk()?.text}
          </p>
        </Show>
      </div>
    </>
  );
}

const timeMs = function (val: string) {
  const regex = /(\d+):(\d{2}):(\d{2}),(\d{3})/;
  const parts = regex.exec(val);

  if (parts === null) {
    return 0;
  }
  const timeParts = [];
  for (let i = 1; i < 5; i++) {
    timeParts.push(parseInt(parts[i], 10));
    if (isNaN(timeParts[i])) timeParts[i] = 0;
  }

  // hours + minutes + seconds + ms
  return (
    timeParts[1] * 3600000 +
    timeParts[2] * 60000 +
    timeParts[3] * 1000 +
    timeParts[4]
  );
};

function srtParser(data: string) {
  data = data.replace(/\r/g, "");
  const regex =
    /(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/g;
  const ArrData = data.split(regex);

  ArrData.shift();

  const items: SubtitleChunk[] = [];
  for (let i = 0; i < ArrData.length; i += 4) {
    items.push({
      idx: Number(ArrData[i].trim()),
      startTime: timeMs(ArrData[i + 1].trim()),
      endTime: timeMs(ArrData[i + 2].trim()),
      text: ArrData[i + 3].trim(),
    });
  }
  return items;
}

let quickSearch = function (
  arr: SubtitleChunk[],
  searchIdx: number,
  start: number,
  end: number,
) {
  if (start > end) return false;
  let mid = Math.floor((start + end) / 2);
  if (arr[mid].idx === searchIdx) return true;

  // If element at mid is greater than x,
  // search in the left half of mid
  if (arr[mid].idx > searchIdx)
    return quickSearch(arr, searchIdx, start, mid - 1);
  else return quickSearch(arr, searchIdx, mid + 1, end);
};
