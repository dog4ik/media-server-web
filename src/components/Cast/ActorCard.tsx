import FallbackImage from "../FallbackImage";
import { Show } from "solid-js";
import { ExtendedActor } from "@/utils/library";

type Props = {
  actor: ExtendedActor;
};

export function ActorCard(props: Props) {
  return (
    <div class="group relative w-28 shrink-0 sm:w-36 lg:w-44">
      <div class="aspect-square overflow-hidden rounded-full group-hover:opacity-75">
        <FallbackImage
          fluid
          alt={props.actor.name}
          srcList={props.actor.posterList()}
          class="rounded-full"
          width={192}
          height={192}
        />
      </div>
      <div class="mt-3 flex justify-between">
        <div class="w-full min-w-0">
          <h3 class="text-primary-foreground text-md">
            <span class="text-foreground block truncate" title={props.actor.name}>
              <span aria-hidden="true" class="absolute inset-0" />
              {props.actor.name}
            </span>
          </h3>
          <Show when={props.actor.character}>
            {(character) => (
              <p title={character()} class="text-muted-foreground mt-1 truncate text-sm">
                Role: {character()}
              </p>
            )}
          </Show>
        </div>
      </div>
    </div>
  );
}
