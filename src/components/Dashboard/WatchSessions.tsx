import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Progress } from "@/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { extendEpisode, extendMovie, extendShow } from "@/utils/library";
import { queryApi } from "@/utils/queryApi";
import { Schemas, server } from "@/utils/serverApi";
import { Link } from "@tanstack/solid-router";
import { For, Show } from "solid-js";

type RowProps = {
  task: Schemas["Task_WatchTask"];
};

function TaskRow(props: RowProps) {
  let onCancel = () => {
    server.DELETE("/api/tasks/watch_session/{id}", {
      params: { path: { id: props.task.id } },
    });
  };
  let currentTime = () => props.task.latest_progress?.current_time ?? 0;

  let media = queryApi.useQuery(
    "get",
    "/api/video/{id}/metadata",
    () => ({ params: { path: { id: props.task.kind.video_id } } }),
    () => ({
      select: (metadata) => {
        if (metadata?.content_type == "movie") {
          let movie = extendMovie(metadata.movie);
          return { title: movie.friendlyTitle(), url: movie.url() };
        }
        if (metadata?.content_type == "episode") {
          let show = extendShow(metadata.show);
          let episode = extendEpisode(metadata.episode, show.provider_id);
          return {
            title: `${show.friendlyTitle()}: ${episode.friendlyTitle()}`,
            url: episode.url(),
          };
        }
      },
    }),
  );
  return (
    <TableRow>
      <TableCell class="font-medium">
        <Show when={media.data}>{(m) => <Link {...m().url}>{m().title}</Link>}</Show>
      </TableCell>
      <TableCell>
        <span class="font-mono">{props.task.kind.method}</span>
      </TableCell>
      <TableCell>
        {props.task.kind.client_type} ({props.task.kind.client_agent})
      </TableCell>
      <TableCell>
        <Progress value={(currentTime() / props.task.kind.total_duration) * 100} />
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
  tasks: readonly Schemas["Task_WatchTask"][];
};

export function WatchSessions(props: Props) {
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
                <For each={props.tasks}>{(task) => <TaskRow task={task} />}</For>
              </TableBody>
            </Table>
          </Show>
        </CardContent>
      </Card>
    </div>
  );
}
