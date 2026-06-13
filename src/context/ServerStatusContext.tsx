import { ParentProps, createContext, createSignal, onCleanup, useContext } from "solid-js";
import { Schemas } from "../utils/serverApi";
import { useRawNotifications } from "./NotificationContext";
import { server } from "../utils/serverApi";
import { NotificationProps } from "../components/Notification";
import { extendEpisode, extendMovie, extendShow, fetchSeason, Media, Video } from "@/utils/library";
import { ServerConnection } from "@/utils/serverStatus";
import { createStore, produce } from "solid-js/store";
import { queryApi, queryClient } from "@/utils/queryApi";

type ServerStatusType = ReturnType<typeof createServerStatusContext>;

export const ServerStatusContext = createContext<ServerStatusType>();

export const useServerStatus = () => useContext(ServerStatusContext)!;

export type TaskMetadata =
  | {
      content_type: "show";
      metadata: Schemas["Show"];
    }
  | {
      content_type: "movie";
      metadata: Schemas["Movie"];
    }
  | {
      content_type: "episode";
      show: Schemas["Show"];
      metadata: Schemas["Episode"];
    };

export function displayTask(metadata: TaskMetadata): Media {
  if (metadata.content_type == "show") {
    return extendShow(metadata.metadata);
  }
  if (metadata.content_type == "episode") {
    let episode = extendEpisode(metadata.metadata, metadata.show.provider_id);
    let show = extendShow(metadata.show);
    episode.poster = show.poster;
    return episode;
  }
  if (metadata.content_type == "movie") {
    return extendMovie(metadata.metadata);
  }
  throw Error("Unhandled content type");
}

type NotificationProgressType = Schemas["Notification"]["progress_type"];

function notificationProps(
  content: Media,
  taskStatus: NotificationProgressType,
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

function isTerminal(progress_type: string): boolean {
  return progress_type === "finish" || progress_type === "cancel" || progress_type === "error";
}

function createServerStatusContext(notificator: ReturnType<typeof useRawNotifications>) {
  let [isConnecting, setIsConnecting] = createSignal(true);
  let [isErrored, setIsErrored] = createSignal(false);

  let [tasks, setTasks] = createStore<Schemas["TasksSnapshot"]>({
    intro_detection_tasks: [],
    library_scan_tasks: [],
    previews_tasks: [],
    torrent_tasks: [],
    transcode_tasks: [],
    watch_sessions: [],
  });

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

  serverStatus.setConnectedHandler((snapshot) => {
    setTasks(snapshot);
  });

  async function notifyVideoTask(
    videoId: number,
    progressType: NotificationProgressType,
    taskType: "transcode" | "previews",
    activityId: string,
  ) {
    let video = await Video.fetch(videoId);
    if (video == undefined) return;
    let metadata = await video.fetchMetadata().then((d) => d.data);
    if (metadata?.content_type == "movie") {
      let movie = extendMovie(metadata.movie);
      notificator(notificationProps(movie, progressType, taskType, activityId));
    }
    if (metadata?.content_type == "episode") {
      let episode = extendEpisode(metadata.episode, metadata.show.provider_id);
      notificator(notificationProps(episode, progressType, taskType, activityId));
    }
  }

  serverStatus.addProgressHandler("transcode", async (progress) => {
    if (progress.progress_type === "start") {
      setTasks(
        produce((s) => {
          s.transcode_tasks.push(progress.task);
        }),
      );
      await notifyVideoTask(
        progress.task.kind.video_id,
        "start",
        "transcode",
        progress.activity_id,
      );
      return;
    }
    if (progress.progress_type === "pending") {
      let idx = tasks.transcode_tasks.findIndex((t) => t.id === progress.activity_id);
      if (idx !== -1) setTasks("transcode_tasks", idx, "latest_progress", progress.progress);
      return;
    }
    let task = tasks.transcode_tasks.find((t) => t.id === progress.activity_id);
    if (isTerminal(progress.progress_type)) {
      if (task) {
        await notifyVideoTask(
          task.kind.video_id,
          progress.progress_type,
          "transcode",
          progress.activity_id,
        );
      }
      setTasks("transcode_tasks", (arr) => arr.filter((t) => t.id !== progress.activity_id));
    }
  });

  serverStatus.addProgressHandler("previews", async (progress) => {
    if (progress.progress_type === "start") {
      setTasks(
        produce((s) => {
          s.previews_tasks.push(progress.task);
        }),
      );
      await notifyVideoTask(progress.task.kind.video_id, "start", "previews", progress.activity_id);
      return;
    }
    if (progress.progress_type === "pending") {
      let idx = tasks.previews_tasks.findIndex((t) => t.id === progress.activity_id);
      if (idx !== -1) setTasks("previews_tasks", idx, "latest_progress", progress.progress);
      return;
    }
    let task = tasks.previews_tasks.find((t) => t.id === progress.activity_id);
    if (isTerminal(progress.progress_type)) {
      if (task) {
        await notifyVideoTask(
          task.kind.video_id,
          progress.progress_type as NotificationProgressType,
          "previews",
          progress.activity_id,
        );
      }
      setTasks("previews_tasks", (arr) => arr.filter((t) => t.id !== progress.activity_id));
    }
  });

  serverStatus.addProgressHandler("libraryscan", (progress) => {
    if (progress.progress_type === "start") {
      setTasks(
        produce((s) => {
          s.library_scan_tasks.push(progress.task);
        }),
      );
      notificator({ message: "Started library scan" });
      return;
    }
    if (progress.progress_type === "finish") {
      notificator({ message: "Finished library scan" });
      queryApi.invalidateQueries(queryClient, "get", "/api/local_shows");
      queryApi.invalidateQueries(queryClient, "get", "/api/show/{id}");
      queryApi.invalidateQueries(queryClient, "get", "/api/show/{id}/{season}");
      queryApi.invalidateQueries(queryClient, "get", "/api/show/{id}/{season}/{episode}");
      queryApi.invalidateQueries(queryClient, "get", "/api/local_movies");
      queryApi.invalidateQueries(queryClient, "get", "/api/movie/{id}");
    }
    if (progress.progress_type === "pending") {
      let idx = tasks.library_scan_tasks.findIndex((t) => t.id === progress.activity_id);
      if (idx !== -1) setTasks("library_scan_tasks", idx, "latest_progress", progress.progress);
      return;
    }
    if (isTerminal(progress.progress_type)) {
      setTasks("library_scan_tasks", (arr) => arr.filter((t) => t.id !== progress.activity_id));
    }
  });

  serverStatus.addProgressHandler("introdetection", async (progress) => {
    if (progress.progress_type === "start") {
      setTasks(
        produce((s) => {
          s.intro_detection_tasks.push(progress.task);
        }),
      );
      let season = await fetchSeason(
        progress.task.kind.show_id.toString(),
        progress.task.kind.season,
        "local",
      );
      if (season) {
        notificator(notificationProps(season, "start", "introdetection", progress.activity_id));
      }
      return;
    }
    if (progress.progress_type === "pending") {
      let idx = tasks.intro_detection_tasks.findIndex((t) => t.id === progress.activity_id);
      if (idx !== -1) setTasks("intro_detection_tasks", idx, "latest_progress", progress.progress);
      return;
    }
    let task = tasks.intro_detection_tasks.find((t) => t.id === progress.activity_id);
    if (isTerminal(progress.progress_type)) {
      if (task) {
        let season = await fetchSeason(task.kind.show_id.toString(), task.kind.season, "local");
        if (season) {
          notificator(
            notificationProps(
              season,
              progress.progress_type as NotificationProgressType,
              "introdetection",
              progress.activity_id,
            ),
          );
        }
      }
      setTasks("intro_detection_tasks", (arr) => arr.filter((t) => t.id !== progress.activity_id));
    }
  });

  serverStatus.addProgressHandler("watchsession", (progress) => {
    if (progress.progress_type === "start") {
      setTasks(
        produce((s) => {
          s.watch_sessions.push(progress.task);
        }),
      );
      return;
    }
    if (progress.progress_type === "pending") {
      let idx = tasks.watch_sessions.findIndex((t) => t.id === progress.activity_id);
      if (idx !== -1) setTasks("watch_sessions", idx, "latest_progress", progress.progress);
      return;
    }
    if (isTerminal(progress.progress_type)) {
      setTasks("watch_sessions", (arr) => arr.filter((t) => t.id !== progress.activity_id));
    }
  });

  serverStatus.addProgressHandler("torrent", (progress) => {
    if (progress.progress_type === "start") {
      setTasks(
        produce((s) => {
          s.torrent_tasks.push(progress.task);
        }),
      );
      return;
    }
    if (progress.progress_type === "pending") {
      let idx = tasks.torrent_tasks.findIndex((t) => t.id === progress.activity_id);
      if (idx !== -1) setTasks("torrent_tasks", idx, "latest_progress", progress.progress);
      return;
    }
    if (isTerminal(progress.progress_type)) {
      setTasks("torrent_tasks", (arr) => arr.filter((t) => t.id !== progress.activity_id));
    }
  });

  return [
    {
      isConnecting,
      isErrored,
      serverStatus,
      tasks,
    },
    { addWakeSubscriber, removeWakeSubscriber },
  ] as const;
}

export default function TaskContextProvider(props: ParentProps) {
  let notificator = useRawNotifications();
  let context = createServerStatusContext(notificator);
  return (
    <ServerStatusContext.Provider value={context}>{props.children}</ServerStatusContext.Provider>
  );
}
