import {
  ParentProps,
  createContext,
  createSignal,
  onCleanup,
  useContext,
} from "solid-js";
import { revalidatePath, Schemas } from "../utils/serverApi";
import { useRawNotifications } from "./NotificationContext";
import { server } from "../utils/serverApi";
import { NotificationProps } from "../components/Notification";
import {
  extendEpisode,
  extendMovie,
  extendShow,
  fetchSeason,
  Media,
  Video,
} from "@/utils/library";
import { ServerConnection } from "@/utils/serverStatus";
import { queryApi } from "@/utils/queryApi";

type ServerStatusType = ReturnType<typeof createServerStatusContext>;

export const ServerStatusContext = createContext<ServerStatusType>();

export const useServerStatus = () => useContext(ServerStatusContext)!;

export type TaskMetadata =
  | {
      content_type: "show";
      metadata: Schemas["ShowMetadata"];
    }
  | {
      content_type: "movie";
      metadata: Schemas["MovieMetadata"];
    }
  | {
      content_type: "episode";
      showMetadata: Schemas["ShowMetadata"];
      metadata: Schemas["EpisodeMetadata"];
    };

export function displayTask(metadata: TaskMetadata): Media {
  if (metadata.content_type == "show") {
    return extendShow(metadata.metadata);
  }
  if (metadata.content_type == "episode") {
    let episode = extendEpisode(
      metadata.metadata,
      metadata.showMetadata.metadata_id,
    );
    let show = extendShow(metadata.showMetadata);
    episode.poster = show.poster;
    return episode;
  }
  if (metadata.content_type == "movie") {
    return extendMovie(metadata.metadata);
  }
  throw Error("Unhandled content type");
}

function notificationProps(
  content: Media,
  taskStatus: Schemas["Notification"]["status"]["progress_type"],
  type: Schemas["Notification"]["task_type"],
  undoId?: string,
): NotificationProps {
  let status = () => {
    if (taskStatus == "start") {
      return "Started";
    }
    if (taskStatus == "finish") {
      return "Finished";
    }
    if (taskStatus == "error") {
      return "Errored";
    }
    if (taskStatus == "cancel") {
      return "Canceled";
    }
    if (taskStatus == "pending") {
      return "Pending";
    }
    if (taskStatus == "pause") {
      return "Paused";
    }
  };

  let taskType = () => {
    if (type == "libraryscan") {
      return "library scan";
    }
    if (type == "transcode" || type == "previews") {
      return "video task";
    }
    if (type == "torrent") {
      return "torrent task";
    }
    if (type == "watchsession") {
      return "watching";
    }
    if (type == "introdetection") {
      return "intro detection";
    }
  };

  let onUndo = () => {
    if (!undoId) {
      return;
    }
    if (taskStatus != "start") return;
    if (type == "previews") {
      return () =>
        server.DELETE("/api/tasks/previews/{id}", {
          params: { path: { id: undoId } },
        });
    }
    if (type == "transcode") {
      return () =>
        server.DELETE("/api/tasks/transcode/{id}", {
          params: { path: { id: undoId } },
        });
    }
  };

  let message = `${status()} ${taskType()}`;

  return {
    message,
    poster: content.localPoster(),
    subTitle: content.friendlyTitle(),
    onUndo: onUndo(),
    contentUrl: content.url(),
  };
}

function createServerStatusContext(
  notificator: ReturnType<typeof useRawNotifications>,
) {
  let capabilities = queryApi.useQuery(
    "get",
    "/api/configuration/capabilities",
  );

  let [isConnecting, setIsConnecting] = createSignal(true);
  let [isErrored, setIsErrored] = createSignal(false);

  function onOpen() {
    for (let cb of wakeSubscribers.values()) {
      cb();
    }
    wakeSubscribers.clear();
    setIsConnecting(false);
    setIsErrored(false);
  }

  function onError() {
    setIsErrored(true);
    setIsConnecting(false);
  }

  function cleanup() {
    serverStatus.close();
  }

  window.addEventListener("beforeunload", cleanup);

  let serverStatus = new ServerConnection();

  onCleanup(() => {
    window.removeEventListener("beforeunload", cleanup);
    cleanup();
  });

  let wakeSubscribers: Map<string, () => void> = new Map();

  function addWakeSubscriber(cb: () => void) {
    let uuid = crypto.randomUUID();
    wakeSubscribers.set(uuid, cb);
    return uuid;
  }

  function removeWakeSubscriber(id: string) {
    return wakeSubscribers.delete(id);
  }

  async function handleVideoProgress(
    progress: Schemas["Notification"] & { video_id: number },
  ) {
    let progressType = progress.status.progress_type;
    if (progressType == "pending") {
      return;
    }
    let video = await Video.fetch(progress.video_id);
    if (video == undefined) {
      return;
    }

    let metadata = await video.fetchMetadata().then((d) => d.data);
    if (metadata?.content_type == "movie") {
      let movie = extendMovie(metadata.movie);
      notificator(
        notificationProps(
          movie,
          progress.status.progress_type,
          progress.task_type,
          progress.activity_id,
        ),
      );
    }
    if (metadata?.content_type == "episode") {
      let episode = extendEpisode(metadata.episode, metadata.show.metadata_id);
      notificator(
        notificationProps(
          episode,
          progress.status.progress_type,
          progress.task_type,
          progress.activity_id,
        ),
      );
    }
  }

  serverStatus.addProgressHandler("transcode", handleVideoProgress);
  serverStatus.addProgressHandler("previews", handleVideoProgress);
  serverStatus.addProgressHandler("libraryscan", (progress) => {
    if (progress.status.progress_type == "start") {
      notificator({ message: "Started library scan" });
    }
    if (progress.status.progress_type == "finish") {
      notificator({ message: "Finished library scan" });
      revalidatePath("/api/local_shows");
      revalidatePath("/api/show/{id}");
      revalidatePath("/api/show/{id}/{season}");
      revalidatePath("/api/show/{id}/{season}/{episode}");
      revalidatePath("/api/local_movies");
      revalidatePath("/api/movie/{id}");
    }
  });

  serverStatus.addProgressHandler("introdetection", async (progress) => {
    if (
      progress.status.progress_type == "start" ||
      progress.status.progress_type == "error" ||
      progress.status.progress_type == "finish"
    ) {
      let season = await fetchSeason(
        progress.show_id.toString(),
        progress.season,
        "local",
      );
      if (season) {
        notificator(
          notificationProps(
            season,
            progress.status.progress_type,
            progress.task_type,
            progress.activity_id,
          ),
        );
      }
    }
  });

  return [
    {
      isConnecting,
      isErrored,
      capabilities,
      serverStatus,
    },
    { addWakeSubscriber, removeWakeSubscriber },
  ] as const;
}

export default function TaskContextProvider(props: ParentProps) {
  let notificator = useRawNotifications();
  let context = createServerStatusContext(notificator);
  return (
    <ServerStatusContext.Provider value={context}>
      {props.children}
    </ServerStatusContext.Provider>
  );
}
