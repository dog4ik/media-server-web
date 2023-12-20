import { createAsync, useParams } from "@solidjs/router";
import { Show } from "solid-js";
import Description from "../components/Description";
import { TranscodeModal } from "../components/modals/TranscodeModal";
import { getCachedEpisode } from "../utils/cachedApi";
import PrimeButton from "../components/ui/PrimeButton";

export default function Episode() {
  let params = useParams();
  let modal: HTMLDialogElement;

  let episode = createAsync(() =>
    getCachedEpisode(+params.show_id, +params.season, +params.episode),
  );

  return (
    <Show when={episode()}>
      {(episode) => (
        <>
          <TranscodeModal video_id={String(episode().id)} ref={modal!} />
          <div>
            <Description item={episode()} imageDirection="horizontal" />
            <div class="flex items-center gap-10">
              <PrimeButton href={`/watch/${episode().video_id}`}>
                Watch it
              </PrimeButton>
              <PrimeButton onClick={() => modal.showModal()}>Transcode</PrimeButton>
            </div>
          </div>
        </>
      )}
    </Show>
  );
}
