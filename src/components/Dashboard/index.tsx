import PageTitle from "../PageTitle";
import { createAsyncStore } from "@solidjs/router";
import { revalidatePath, server } from "@/utils/serverApi";
import { throwResponseErrors } from "@/utils/errors";
import { TranscodeTasks } from "./TranscodeTasks";
import { PreviewsTasks } from "./PreviewsTasks";
import Showspense from "@/utils/Showspense";
import { useServerStatus } from "@/context/ServerStatusContext";
import { WatchSessions } from "./WatchSessions";

export default function Activity() {
  let transcodeTasks = createAsyncStore(() =>
    server.GET("/api/tasks/transcode").then(throwResponseErrors),
  );

  let previewsTasks = createAsyncStore(() =>
    server.GET("/api/tasks/previews").then(throwResponseErrors),
  );

  let watchSessions = createAsyncStore(() =>
    server.GET("/api/tasks/watch_sessions").then(throwResponseErrors),
  );

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
    let task = transcodeTasks.latest?.find((t) => t.id == progress.activity_id);
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
    let task = transcodeTasks.latest?.find((t) => t.id == progress.activity_id);
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
    let task = watchSessions.latest?.find((t) => t.id == progress.activity_id);
    if (task?.latest_progress) {
      task.latest_progress = progress;
    }
  });

  return (
    <>
      <PageTitle>Activity</PageTitle>
      <div class="w-5/6 space-y-8">
        <Showspense
          when={watchSessions()}
          fallback={<div>Loading watch sessions</div>}
        >
          {(tasks) => <WatchSessions tasks={tasks()} />}
        </Showspense>
        <Showspense
          when={transcodeTasks()}
          fallback={<div>Loading transcode tasks</div>}
        >
          {(tasks) => <TranscodeTasks tasks={tasks()} />}
        </Showspense>
        <Showspense
          when={previewsTasks()}
          fallback={<div>Loading previews tasks</div>}
        >
          {(tasks) => <PreviewsTasks tasks={tasks()} />}
        </Showspense>
      </div>
    </>
  );
}
