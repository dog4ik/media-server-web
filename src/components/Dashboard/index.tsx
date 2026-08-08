import { ErrorBoundary } from "solid-js";
import { useServerStatus } from "@/context/ServerStatusContext";
import { errorBoundaryFallback } from "../Error";
import PageTitle from "../PageTitle";
import { PreviewsTasks } from "./PreviewsTasks";
import { TranscodeTasks } from "./TranscodeTasks";
import { WatchSessions } from "./WatchSessions";

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
