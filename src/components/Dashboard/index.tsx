import PageTitle from "../PageTitle";
import { revalidatePath } from "@/utils/serverApi";
import { TranscodeTasks } from "./TranscodeTasks";
import { PreviewsTasks } from "./PreviewsTasks";
import Showspense from "@/utils/Showspense";
import { useServerStatus } from "@/context/ServerStatusContext";
import { WatchSessions } from "./WatchSessions";
import { queryApi } from "@/utils/queryApi";

export default function Activity() {
  let transcodeTasks = queryApi.useQuery("get", "/api/tasks/transcode");

  let previewsTasks = queryApi.useQuery("get", "/api/tasks/previews");

  let watchSessions = queryApi.useQuery("get", "/api/tasks/watch_sessions");

  let [{ serverStatus }] = useServerStatus();
  serverStatus.addProgressHandler("transcode", (progress) => {
    if (
      progress.status.progress_type == "finish" ||
      progress.status.progress_type == "start" ||
      progress.status.progress_type == "error" ||
      progress.status.progress_type == "cancel"
    ) {
      revalidatePath("/api/tasks/transcode");
      return;
    }
    let task = transcodeTasks.data?.find((t) => t.id == progress.activity_id);
    if (task?.latest_progress) {
      task.latest_progress = progress;
    }
  });

  serverStatus.addProgressHandler("previews", (progress) => {
    if (
      progress.status.progress_type == "finish" ||
      progress.status.progress_type == "start" ||
      progress.status.progress_type == "error" ||
      progress.status.progress_type == "cancel"
    ) {
      revalidatePath("/api/tasks/previews");
      return;
    }
    let task = transcodeTasks.data?.find((t) => t.id == progress.activity_id);
    if (task?.latest_progress) {
      task.latest_progress = progress;
    }
  });

  serverStatus.addProgressHandler("watchsession", (progress) => {
    if (
      progress.status.progress_type == "finish" ||
      progress.status.progress_type == "start" ||
      progress.status.progress_type == "error" ||
      progress.status.progress_type == "cancel"
    ) {
      revalidatePath("/api/tasks/watch_sessions");
      return;
    }
    let task = watchSessions.data?.find((t) => t.id == progress.activity_id);
    if (task?.latest_progress) {
      task.latest_progress = progress;
    }
  });

  return (
    <>
      <PageTitle>Activity</PageTitle>
      <div class="w-5/6 space-y-8">
        <Showspense
          when={watchSessions.data}
          fallback={<div>Loading watch sessions</div>}
        >
          {(tasks) => <WatchSessions tasks={tasks()} />}
        </Showspense>
        <Showspense
          when={transcodeTasks.data}
          fallback={<div>Loading transcode tasks</div>}
        >
          {(tasks) => <TranscodeTasks tasks={tasks()} />}
        </Showspense>
        <Showspense
          when={previewsTasks.data}
          fallback={<div>Loading previews tasks</div>}
        >
          {(tasks) => <PreviewsTasks tasks={tasks()} />}
        </Showspense>
      </div>
    </>
  );
}
