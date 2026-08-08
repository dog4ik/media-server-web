import { Subtitle } from "@/lib/subtitles";
import { useTracksSelection } from "@/pages/Watch/TracksSelectionContext";
import { Show, createMemo } from "solid-js";

type Props = {
  time: number;
};

export default function Subtitles(props: Props) {
  let [{ fetchedSubtitles, tracks }] = useTracksSelection();
  let subs = createMemo(() => {
    if (fetchedSubtitles.isSuccess && fetchedSubtitles.data) {
      let subs = new Subtitle()
      subs.parse(fetchedSubtitles.data);
      return subs;
    }
  });

  let currentChunk = createMemo(() => {
    return subs()?.seek(props.time);
  });

  return (
    <>
      <div class="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/80">
        <Show
          when={
            tracks.subtitles &&
            currentChunk() &&
            currentChunk()!.startMs <= props.time &&
            currentChunk()!.endMs > props.time
          }
        >
          <p class="flex rounded-md text-2xl 2xl:text-4xl">{currentChunk()?.text}</p>
        </Show>
      </div>
    </>
  );
}
