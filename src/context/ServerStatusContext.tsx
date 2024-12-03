import {
  ParentProps,
  createContext,
  createSignal,
  onCleanup,
  useContext,
} from "solid-js";
import { fullUrl, Schemas } from "../utils/serverApi";
import { useRawNotifications } from "./NotificationContext";
import { server, revalidatePath } from "../utils/serverApi";
import { createAsync } from "@solidjs/router";
import { createStore } from "solid-js/store";
import { InternalServerError } from "../utils/errors";
import { NotificationProps } from "../components/Notification";
import {
  extendEpisode,
  extendMovie,
  extendShow,
  Media,
  Video,
} from "@/utils/library";

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

export type TaskType = Schemas["Task"] & { metadata?: TaskMetadata };

function notificationProps(
  task: Schemas["Task"]["kind"],
  status: Schemas["ProgressStatus"]["progress_type"],
  data: TaskMetadata,
): NotificationProps {
  let display = displayTask(data);
  let message = () => {
    let msg = "";
    if (status == "start") msg += "Created";
    else if (status == "finish") msg += "Finished";
    else if (status == "pause") msg += "Paused";
    else if (status == "cancel") msg += "Canceled";
    else if (status == "error") msg += "Errored";
    msg += " ";
    if (task.task_kind == "video") {
      if (task.kind == "previews") {
        msg += "previews";
      } else if (task.kind == "subtitles") {
        msg += "subtitles";
      } else if (task.kind == "transcode") {
        msg += "transcode";
      } else if (task.kind == "livetranscode") {
        msg += "live transcode";
      }
    } else if (task.task_kind == "scan") {
      msg += "library scan";
    } else if (task.task_kind == "torrent") {
      msg += "torrent";
    }
    msg += " task";
    return msg;
  };
  return {
    message: message(),
    subTitle: display.friendlyTitle(),
    poster: display.poster,
    contentUrl: display.url(),
  };
}

export type Speed = Schemas["ProgressSpeed"];

export type Progress = {
  percent: number;
  speed: Speed;
};

function createServerStatusContext(
  notificator: ReturnType<typeof useRawNotifications>,
) {
  let serverTasks = createAsync(
    async () => {
      let tasks = await server.GET("/api/tasks");
      if (tasks.error || !tasks.data) {
        notificator({ message: "Failed to fetch server tasks" });
        throw new InternalServerError();
      }
      let videoPromises = tasks.data.map((task) => {
        if (task.kind.task_kind === "video") {
          return Video.fetch(task.kind.video_id)
            .then((v) => v?.fetchMetadata())
            .then((m) => m?.data);
        }
      });
      let settledVideoMetadata = await Promise.allSettled(videoPromises);
      let result: TaskType[] = [];
      let videoMetadataIdx = 0;
      for (let i = 0; i < tasks.data.length; ++i) {
        let metadata: TaskMetadata | undefined = undefined;
        let task = tasks.data[i];
        if (task.kind.task_kind == "video") {
          let settledMetadata = settledVideoMetadata[videoMetadataIdx];
          videoMetadataIdx += 1;
          if (settledMetadata.status == "fulfilled" && settledMetadata.value) {
            let value = settledMetadata.value;
            if (value.content_type == "movie") {
              metadata = { content_type: "movie", metadata: value.movie };
            }
            if (value.content_type == "episode") {
              metadata = {
                content_type: "episode",
                showMetadata: value.show,
                metadata: value.episode,
              };
            }
          }
        }
        if (task.kind.task_kind == "torrent" && task.kind.content) {
          if ("show" in task.kind.content) {
            metadata = {
              content_type: "show",
              metadata: task.kind.content.show.show_metadata,
            };
          }
          if ("movie" in task.kind.content) {
            metadata = {
              content_type: "movie",
              metadata: task.kind.content.movie[0].metadata,
            };
          }
        }
        let toNotifyIdx = tasksToNotify.indexOf(task.id);
        if (!!~toNotifyIdx) {
          if (task.kind.task_kind == "scan") {
            notificator({ message: "Scanning library" });
          }
          if (metadata) {
            let props = notificationProps(task.kind, "start", metadata);
            if (task.cancelable) {
              props.onUndo = () => {
                server.DELETE("/api/tasks/{id}", {
                  params: { path: { id: task.id } },
                });
              };
            }
            notificator(props);
          }
          tasksToNotify.splice(toNotifyIdx, 1);
        }
        result.push({ ...task, metadata });
      }
      setTasks(result);
      return result;
    },
    { initialValue: [] },
  );

  let capabilities = createAsync(async () => {
    let capabilities = await server
      .GET("/api/configuration/capabilities")
      .then((data) => data.data);
    return capabilities;
  });

  let [tasksProgress, setTasksProgress] = createStore<Record<string, Progress>>(
    {},
  );
  let [tasks, setTasks] = createStore<TaskType[]>([]);
  let tasksToNotify: string[] = [];
  let [isConnecting, setIsConnecting] = createSignal(true);
  let [isErrored, setIsErrored] = createSignal(false);
  let wakeSubscribers: Map<string, () => void> = new Map();

  function addWakeSubscriber(cb: () => void) {
    let uuid = crypto.randomUUID();
    wakeSubscribers.set(uuid, cb);
    return uuid;
  }

  function removeWakeSubscriber(id: string) {
    return wakeSubscribers.delete(id);
  }

  function getTaskWithProgress(task_id: string) {
    let task = serverTasks().find((task) => task.id == task_id);

    if (task) {
      return { ...task, progress: tasksProgress[task_id] };
    } else {
      return undefined;
    }
  }

  function cleanupProgress() {
    let cleanProgress: Record<string, Progress> = {};
    for (let task of serverTasks()) {
      let taskProgress = tasksProgress[task.id];
      if (taskProgress === undefined) {
        continue;
      }
      cleanProgress[task.id] = taskProgress;
    }
    setTasksProgress(cleanProgress);
  }

  async function cancelTask(task_id: string) {
    await server
      .DELETE("/api/tasks/{id}", { params: { path: { id: task_id } } })
      .then(() => {
        revalidatePath("/api/tasks");
        cleanupProgress();
      });
  }

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

  function onProgressEvent(event: MessageEvent<string>) {
    let data = JSON.parse(event.data) as Schemas["ProgressChunk"];
    let status = data.status;

    // task is new
    if (data.status.progress_type == "start") {
      tasksToNotify.push(data.task_id);
      revalidatePath("/api/tasks");
      return;
    }

    // task ended
    if (
      status.progress_type == "cancel" ||
      status.progress_type == "finish" ||
      status.progress_type == "error"
    ) {
      let task = tasks.find((t) => t.id == data.task_id);
      if (task?.kind.task_kind == "scan") {
        notificator({ message: "Finished library scan" });
      }
      if (task && task.metadata) {
        let props = notificationProps(
          task.kind,
          status.progress_type,
          task.metadata,
        );
        notificator(props);
      }
      setTasks(tasks.filter((t) => t.id !== data.task_id));
      cleanupProgress();
      return;
    }

    if (status.progress_type == "pending") {
      if ("relativespeed" in status.speed!) {
        status.speed.relativespeed;
      }
      setTasksProgress(data.task_id, {
        percent: status.percent ?? undefined,
        speed: status.speed ?? undefined,
      });
    }
  }

  let sse = new EventSource(fullUrl("/api/tasks/progress", {}));
  sse.addEventListener("message", onProgressEvent);
  sse.addEventListener("open", onOpen);
  sse.addEventListener("error", onError);
  onCleanup(() => {
    sse.removeEventListener("message", onProgressEvent);
    sse.removeEventListener("open", onOpen);
    sse.removeEventListener("error", onError);
    sse.close();
  });

  return [
    {
      tasks,
      tasksProgress,
      getTaskWithProgress,
      isConnecting,
      isErrored,
      capabilities,
    },
    { cancelTask, addWakeSubscriber, removeWakeSubscriber },
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
