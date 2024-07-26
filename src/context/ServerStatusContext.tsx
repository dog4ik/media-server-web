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
import { ServerError } from "../utils/errors";
import { NotificationProps } from "../components/Notification";
import { formatSE } from "../utils/formats";

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

export type DisplayTaskMetadata = {
  title: string;
  poster?: string;
  url: string;
};

export function displayTask(metadata: TaskMetadata): DisplayTaskMetadata {
  let isLocal = metadata.metadata.metadata_provider === "local";
  let poster = () => {
    if (metadata.content_type == "episode") {
      if (isLocal) {
        return fullUrl("/api/show/{id}/poster", {
          path: { id: +metadata.showMetadata.metadata_id },
        });
      }
      return metadata.showMetadata.poster;
    } else if (isLocal) {
      let id = +metadata.metadata.metadata_id;
      if (metadata.content_type == "show") {
        return fullUrl("/api/show/{id}/poster", {
          path: { id },
        });
      }
      if (metadata.content_type == "movie") {
        return fullUrl("/api/movie/{id}/poster", { path: { id } });
      }
    } else {
      return metadata.metadata.poster;
    }
  };
  let url = () => {
    let metadataId = metadata.metadata.metadata_id;
    let metadataProvider = metadata.metadata.metadata_provider;
    if (metadata.content_type == "episode") {
      return `/shows/${metadataId}/${metadata.metadata.season_number}${metadata.metadata.number}?provider=${metadataProvider}`;
    }
    if (metadata.content_type == "show") {
      return `/shows/${metadataId}?provider=${metadataProvider}`;
    }
    if (metadata.content_type == "movie") {
      return `/movies/${metadataId}?provider=${metadataProvider}`;
    }
    return "";
  };
  let title = () => {
    if (metadata.content_type == "episode") {
      return `${metadata.showMetadata.title} S${formatSE(metadata.metadata.season_number)}E${formatSE(metadata.metadata.number)}`;
    }
    return metadata.metadata.title;
  };
  return { title: title(), url: url(), poster: poster() ?? undefined };
}

export type TaskType = Schemas["Task"] & { metadata?: TaskMetadata };

function notificationProps(
  task: Schemas["Task"]["task"],
  status: Schemas["ProgressStatus"],
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
      if (task.task_type.task_kind == "previews") {
        msg += "previews";
      } else if (task.task_type.task_kind == "subtitles") {
        msg += "subtitles";
      } else if (task.task_type.task_kind == "transcode") {
        msg += "transcode";
      } else if (task.task_type.task_kind == "livetranscode") {
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
    subTitle: display.title,
    poster: display.poster,
    contentUrl: display.url,
  };
}

type Progress = {
  percent: number;
  speed: number;
};

function createServerStatusContext(
  notificator: ReturnType<typeof useRawNotifications>,
) {
  let serverTasks = createAsync(
    async () => {
      let tasks = await server.GET("/api/tasks");
      if (tasks.error) {
        notificator({ message: "Failed to fetch server tasks" });
        throw new ServerError();
      }
      let videoPromises = tasks.data.map((task) => {
        if (task.task.task_kind === "video") {
          return server
            .GET("/api/video/{id}/metadata", {
              params: { path: { id: task.task.video_id } },
            })
            .then((r) => r.data);
        }
      });
      let settledVideoMetadata = await Promise.allSettled(videoPromises);
      let result: TaskType[] = [];
      let videoMetadataIdx = 0;
      for (let i = 0; i < tasks.data.length; ++i) {
        let metadata: TaskMetadata | undefined = undefined;
        let task = tasks.data[i];
        if (task.task.task_kind == "video") {
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
        if (task.task.task_kind == "torrent" && task.task.content) {
          if ("show" in task.task.content) {
            metadata = {
              content_type: "show",
              metadata: task.task.content.show.show_metadata,
            };
          }
          if ("movie" in task.task.content) {
            metadata = {
              content_type: "movie",
              metadata: task.task.content.movie[0].metadata,
            };
          }
        }
        let toNotifyIdx = tasksToNotify.indexOf(task.id);
        if (!!~toNotifyIdx) {
          if (metadata) {
            let props = notificationProps(task.task, "start", metadata);
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

  async function onProgressEvent(event: MessageEvent<string>) {
    let data = JSON.parse(event.data) as Schemas["ProgressChunk"];
    let status = data.status;

    // task is new
    if (data.status == "start") {
      tasksToNotify.push(data.task_id);
      revalidatePath("/api/tasks");
      setTasksProgress(data.task_id, {
        percent: data.percent,
        speed: data.speed,
      });
      return;
    }

    // task ended
    if (status == "cancel" || status == "finish" || status == "error") {
      let task = tasks.find((t) => t.id == data.task_id);
      if (task && task.metadata) {
        let props = notificationProps(task.task, status, task.metadata);
        notificator(props);
      }
      setTasks(tasks.filter((t) => t.id !== data.task_id));
      cleanupProgress();
      return;
    }

    setTasksProgress(data.task_id, {
      percent: data.percent,
      speed: data.speed,
    });
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
