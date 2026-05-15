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
  task: Schemas["Task_PreviewsJob"];
};

function TaskRow(props: RowProps) {
  let onCancel = () => {
    server.DELETE("/api/tasks/previews/{id}", {
      params: { path: { id: props.task.id } },
    });
  };
  let progress = () => props.task.latest_progress ?? { percent: 0, relative_speed: 0 };

  let media = queryApi.useQuery(
    "get",
    "/api/video/{id}/metadata",
    () => ({
      params: { path: { id: props.task.kind.video_id } },
    }),
    () => ({
      select: (metadata) => {
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
    }),
  );
  return (
    <TableRow>
      <TableCell class="font-medium">
        <Show when={media.data}>{(m) => <Link {...m().url}>{m().title}</Link>}</Show>
      </TableCell>
      <TableCell>
        <span class="font-mono">{progress().relative_speed.toFixed(2)}x</span>
      </TableCell>
      <TableCell>
        <Progress value={progress().percent} />
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
  tasks: readonly Schemas["Task_PreviewsJob"][];
};

export function PreviewsTasks(props: Props) {
  return (
    <div class="flex-1">
      <Card>
        <CardHeader>
          <CardTitle>Pending Previews Jobs</CardTitle>
          <CardDescription>Videos that are currently being processed</CardDescription>
        </CardHeader>
        <CardContent>
          <Show when={props.tasks.length} fallback={<NoItems />}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Speed</TableHead>
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
