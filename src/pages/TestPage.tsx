import { createSignal, Show as SolidShow } from "solid-js";
import Notification from "../components/Notification";
import {
  useMediaNotifications,
  useRawNotifications,
} from "../context/NotificationContext";
import { createAsync } from "@solidjs/router";
import {
  fetchShow,
  fetchMovie,
  fetchEpisode,
  fetchVideoContent,
} from "../utils/library";
import promptConfirm from "@/components/modals/ConfirmationModal";

export default function TestPage() {
  let [show, setShow] = createSignal(true);
  let mediaNotifications = useMediaNotifications();
  let rawNotificator = useRawNotifications();
  let tvShow = createAsync(async () => {
    return await fetchShow("2");
  });
  let episode = createAsync(async () => {
    let episode = await fetchEpisode("2", 1, 2);
    let video = await episode?.fetchVideo();
    console.log("video id", video?.id);
    return episode;
  });
  let video = createAsync(async () => {
    return await fetchVideoContent(360);
  });
  let movie = createAsync(async () => {
    return await fetchMovie("4");
  });
  let emitNotification = () => {
    mediaNotifications(tvShow()!, "Hello from show notifications");
    mediaNotifications(movie()!, "Hello from movie notifications");
    mediaNotifications(episode()!, "Hello from episode notifications");
    mediaNotifications(video()!, "Hello from video notifications");
    let showEpisodeNotificator = episode()!.showNotifications(
      rawNotificator,
      tvShow()!.title,
      tvShow()?.localPoster(),
    );
    showEpisodeNotificator("Hello from show episode notifications");
  };

  async function handleConfirm() {
    console.log("stated handling confirm");
    let result = await promptConfirm("True or false?");
    if (result === true) {
      console.log("user pressed ok");
    }
    if (result === false) {
      console.log("user pressed cancel");
    }
  }

  return (
    <div>
      <SolidShow when={show()}>
        <Notification
          onClose={() => {
            console.log("Closed notification");
            setShow(false);
          }}
          poster="http://localhost:6969/api/show/198/poster"
          message="Finished transcoding"
          subTitle="Witcher S01E02"
          duration={40000}
          contentUrl="https://google.com"
          onUndo={() => console.log("cancelled")}
        />
      </SolidShow>
      <button onClick={() => emitNotification()} class="btn">
        Test
      </button>
      <button class="btn" onClick={handleConfirm}>
        Prompt Confirm
      </button>
    </div>
  );
}
