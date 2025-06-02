import { useServerStatus } from "@/context/ServerStatusContext";
import { Button } from "@/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import { Progress } from "@/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { extendEpisode, extendMovie, extendShow } from "@/utils/library";
import { Schemas, server } from "@/utils/serverApi";
import { createAsync } from "@solidjs/router";
import { For, Show } from "solid-js";
import { createStore } from "solid-js/store";

type RowProps = {
  task: Schemas["Task_WatchTask"];
};

function TaskRow(props: RowProps) {
  let onCancel = () => {
    server.DELETE("/api/tasks/watch_session/{id}", {
      params: { path: { id: props.task.id } },
    });
  };
  let progress = (): Schemas["SerdeDuration"] => {
    let progress = props.task.latest_progress.status;
    if (progress.progress_type == "pending") {
      return progress.progress.current_time;
    }
    if (progress.progress_type == "start") {
      return { secs: 0, nanos: 0 };
    }
    return { secs: 0, nanos: 0 };
  };

  let media = createAsync<{ title: string; url: string } | undefined>(
    async () => {
      let metadata = await server
        .GET("/api/video/{id}/metadata", {
          params: { path: { id: props.task.kind.video_id } },
        })
        .then((d) => d.data);
      if (metadata?.content_type == "movie") {
        let movie = extendMovie(metadata.movie);
        return { title: movie.friendlyTitle(), url: movie.url() };
      }
      if (metadata?.content_type == "episode") {
        let show = extendShow(metadata.show);
        let episode = extendEpisode(metadata.episode, show.metadata_id);
        return {
          title: `${show.friendlyTitle()}: ${episode.friendlyTitle()}`,
          url: episode.url(),
        };
      }
    },
  );
  return (
    <TableRow>
      <TableCell class="font-medium">
        <Show when={media()}>
          {(m) => (
            <Button href={m().url} as="a" variant="link">
              {m().title}
            </Button>
          )}
        </Show>
      </TableCell>
      <TableCell>
        <span class="font-mono">{props.task.kind.method}</span>
      </TableCell>
      <TableCell>
        {props.task.kind.client_type} ({props.task.kind.client_agent})
      </TableCell>
      <TableCell>
        <Progress
          value={(progress().secs / props.task.kind.total_duration.secs) * 100}
        />
      </TableCell>
      <TableCell class="text-right">
        <Button onClick={onCancel} variant="destructive">
          Cancel
        </Button>
      </TableCell>
    </TableRow>
  );
}

function NoItems() {
  return <div>No items</div>;
}

type Props = {
  tasks: Schemas["Task_WatchTask"][];
};

export function WatchSessions(props: Props) {
  let [{ serverStatus }] = useServerStatus();
  let [tasks, setTasks] = createStore(props.tasks);
  serverStatus.addProgressHandler("watchsession", (progress) => {
    if (progress.status.progress_type == "pending") {
      let taskIdx = tasks.findIndex((v) => v.id == progress.activity_id);
      setTasks(taskIdx, "latest_progress", progress);
    }
  });
  return (
    <div class="flex-1">
      <Card>
        <CardHeader>
          <CardTitle>Watch sessions</CardTitle>
          <CardDescription>Server watch activity</CardDescription>
        </CardHeader>
        <CardContent>
          <Show when={props.tasks.length} fallback={<NoItems />}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Stream type</TableHead>
                  <TableHead>User agent</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead class="text-right">Cancel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <For each={tasks}>{(task) => <TaskRow task={task} />}</For>
              </TableBody>
            </Table>
          </Show>
        </CardContent>
      </Card>
    </div>
  );
}
