import { Schemas } from "@/utils/serverApi";
import { For } from "solid-js";
import { ActorCard } from "./ActorCard";
import { extendActor } from "@/utils/library";

type Props = {
  actors: Schemas["Actor"][];
};

export function ActorSection(props: Props) {
  return (
    <div class="px-4 py-8 sm:px-6 lg:px-8">
      <h2 class="text-foreground text-2xl font-bold">Cast</h2>
      <div class="mt-6 flex gap-2 overflow-x-auto pb-6">
        <For each={props.actors}>{(actor) => <ActorCard actor={extendActor(actor)} />}</For>
      </div>
    </div>
  );
}
