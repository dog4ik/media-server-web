import {
  ParentProps,
  createContext,
  createResource,
  createSignal,
  onCleanup,
  useContext,
} from "solid-js";
import { cancelTaskMutation, getActiveTasks } from "../utils/ServerApi";
import { useNotifications } from "./NotificationContext";

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

type TasksContextType = ReturnType<typeof createTaskContext>;

export const TasksContext = createContext<TasksContextType>();

export const useTasksContext = () => useContext(TasksContext)!;

function createTaskContext(notificator: ReturnType<typeof useNotifications>) {
  let [serverTasks, { refetch, mutate }] = createResource(getActiveTasks);
  // Record<task_id, progress%>
  let [tasksProgress, setTasksProgress] = createSignal<Map<string, number>>(
    new Map(),
  );

  function getTaskWithProgress(task_id: string) {
    let task = (serverTasks() ?? []).find((task) => task.id == task_id);

    if (task) {
      return { ...task, progress: tasksProgress().get(task_id) };
    } else {
      return undefined;
    }
  }

  function cleanupProgress() {
    let cleanProgress = new Map();
    for (let task of serverTasks() ?? []) {
      let taskProgress = tasksProgress().get(task.id);
      if (taskProgress === undefined) {
        continue;
      }
      if (taskProgress === 100) {
        mutate(serverTasks()?.filter((t) => t.id != task.id));
      } else {
        cleanProgress.set(task.id, taskProgress);
      }
    }
    setTasksProgress(cleanProgress);
  }

  async function cancelTask(task_id: string) {
    await cancelTaskMutation(task_id).then(() => {
      mutate(serverTasks()?.filter((t) => t.id !== task_id));
      cleanupProgress();
      console.log(tasksProgress());
    });
  }

  async function handleProgressEvent(event: MessageEvent<string>) {
    let data = JSON.parse(event.data) as EventType;
    let currentTasks = serverTasks() ?? [];

    // task is new
    if (data.status == "start") {
      refetch();
      console.log("refetching cause: new task");
      notificator("success", "Created new task");
    }

    if (data.status == "cancel" || data.status == "finish") {
      if (data.status == "cancel")
        notificator("warn", "Canceled task with id: " + data.task_id);
      if (data.status == "finish")
        notificator("success", "Finished task with id: " + data.task_id);
      mutate(currentTasks.filter((task) => task.id !== data.task_id));
    }

    let updatedTasks = new Map(tasksProgress());
    updatedTasks.set(data.task_id, data.progress);
    setTasksProgress(updatedTasks);
    cleanupProgress();
  }

  let sse = new EventSource(
    import.meta.env.VITE_MEDIA_SERVER_URL + "/admin/progress",
  );
  sse.addEventListener("message", handleProgressEvent);
  onCleanup(() => {
    sse.removeEventListener("message", handleProgressEvent);
    sse.close();
  });

  return [
    { serverTasks, tasksProgress, getTaskWithProgress },
    { setTasksProgress, cancelTask },
  ] as const;
}

export default function TaskContextProvider(props: ParentProps) {
  let notificator = useNotifications();
  let context = createTaskContext(notificator);
  return (
    <TasksContext.Provider value={context}>
      {props.children}
    </TasksContext.Provider>
  );
}
