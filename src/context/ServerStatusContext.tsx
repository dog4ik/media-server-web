import {
  ParentProps,
  createContext,
  createSignal,
  onCleanup,
  useContext,
} from "solid-js";
import { MEDIA_SERVER_URL, Schemas } from "../utils/serverApi";
import { useNotifications } from "./NotificationContext";
import { server, revalidatePath } from "../utils/serverApi";
import { createAsync } from "@solidjs/router";
import { createStore } from "solid-js/store";
import { ServerError } from "../utils/errors";

export type EventStatus =
  | "start"
  | "finish"
  | "pending"
  | "cancel"
  | "error"
  | "pause";

export type EventType = {
  task_id: string;
  progress: number;
  status: EventStatus;
};

type Task = Schemas["Task"];

type ServerStatusType = ReturnType<typeof createServerStatusContext>;

export const ServerStatusContext = createContext<ServerStatusType>();

export const useServerStatus = () => useContext(ServerStatusContext)!;

function createServerStatusContext(
  notificator: ReturnType<typeof useNotifications>,
) {
  let serverTasks = createAsync(
    async () => {
      let tasks = await server.GET("/api/tasks");
      if (tasks.error) {
        notificator("error", "Failed to fetch server tasks");
        throw new ServerError();
      }
      setTasks(tasks.data);
      return tasks.data;
    },
    { initialValue: [] },
  );
  // Record<task_id, progress%>
  let [tasksProgress, setTasksProgress] = createStore<Record<string, number>>(
    {},
  );
  let [tasks, setTasks] = createStore<Task[]>([]);
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
    let cleanProgress: Record<string, number> = {};
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
    let data = JSON.parse(event.data) as EventType;
    let status = data.status;

    // task is new
    if (data.status == "start") {
      revalidatePath("/api/tasks");
      notificator("success", "Created new task");
    }

    // task ended
    if (status == "cancel" || status == "finish" || status == "error") {
      if (data.status == "cancel")
        notificator("warn", "Canceled task with id: " + data.task_id);
      if (data.status == "finish")
        notificator("success", "Finished task with id: " + data.task_id);
      setTasks(tasks.filter((t) => t.id !== data.task_id));
      cleanupProgress();
      return;
    }

    setTasksProgress(data.task_id, data.progress);
  }

  let sse = new EventSource(MEDIA_SERVER_URL + "/api/tasks/progress");
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
  let notificator = useNotifications();
  let context = createServerStatusContext(notificator);
  return (
    <ServerStatusContext.Provider value={context}>
      {props.children}
    </ServerStatusContext.Provider>
  );
}
