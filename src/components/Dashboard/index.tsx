import PageTitle from "../PageTitle";
import { TranscodeTasks } from "./TranscodeTasks";
import { PreviewsTasks } from "./PreviewsTasks";
import { useServerStatus } from "@/context/ServerStatusContext";
import { WatchSessions } from "./WatchSessions";
import { ErrorBoundary } from "solid-js";
import { errorBoundaryFallback } from "../Error";

export default function Activity() {
  let [{ tasks }] = useServerStatus();

  return (
    <>
      <PageTitle>Activity</PageTitle>
      <ErrorBoundary fallback={errorBoundaryFallback()}>
        <div class="w-full space-y-8 lg:w-5/6">
          <WatchSessions tasks={tasks.watch_sessions} />
          <TranscodeTasks tasks={tasks.transcode_tasks} />
          <PreviewsTasks tasks={tasks.previews_tasks} />
        </div>
      </ErrorBoundary>
    </>
  );
}
