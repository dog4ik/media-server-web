import { useParams } from "@solidjs/router";
import { NotFoundError } from "../utils/errors";
import VideoPlayer from "../components/VideoPlayer";
import { getVideoUrl } from "../utils/serverApi";

export default function Watch() {
  let params = useParams();
  let videoId = +params.video_id;

  if (isNaN(videoId)) {
    throw new NotFoundError();
  }
  let url = getVideoUrl(videoId)

  function handleAudioError() {
    console.log("audio error encountered");
  }

  function handleVideoError() {
    console.log("video error encountered");
  }


  return (
    <div>
      <VideoPlayer onAudioError={handleAudioError} onVideoError={handleVideoError} src={url.toString()} />
    </div>
  );
}
