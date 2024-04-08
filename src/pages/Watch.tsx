import { useLocation, useNavigate, useParams } from "@solidjs/router";
import { NotFoundError } from "../utils/errors";
import VideoPlayer from "../components/VideoPlayer";
import { getVideoUrl } from "../utils/serverApi";
import { Show, createSignal } from "solid-js";
import { FiArrowLeft } from "solid-icons/fi";

function videoUrl() {
  let params = useParams();
  let location = useLocation<{ variant: string }>();
  let query = location.query;

  let videoId = +params.video_id;
  if (isNaN(videoId)) {
    throw new NotFoundError();
  }
  let variant: string | undefined = query.variant;
  return getVideoUrl(videoId, variant);
}

export default function Watch() {
  let url = videoUrl();
  let [showOverlay, setShowOverlay] = createSignal(true);
  function handleAudioError() {
    console.log("audio error encountered");
  }

  function handleVideoError() {
    console.log("video error encountered");
  }

  return (
    <div class="relative h-screen w-screen overflow-hidden">
      <Show when={showOverlay()}>
        <div class="absolute left-5 top-5 flex items-center gap-5 text-2xl text-white">
          <button onClick={window.history.back}>
            <FiArrowLeft size={40} />
          </button>
          <span>{url.toString()}</span>
        </div>
        <div></div>
      </Show>
      <VideoPlayer
        onAudioError={handleAudioError}
        onVideoError={handleVideoError}
        src={url.toString()}
      />
    </div>
  );
}
