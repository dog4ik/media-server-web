import FallbackImage from "../FallbackImage";
import { Show } from "solid-js";
import { ExtendedActor } from "@/utils/library";

type Props = {
  actor: ExtendedActor;
};

export function ActorCard(props: Props) {
  return (
    <div class="group relative shrink-0">
      <FallbackImage
        alt={props.actor.name}
        srcList={props.actor.posterList()}
        class="aspect-square w-full overflow-hidden rounded-full object-cover group-hover:opacity-75 lg:aspect-auto lg:h-80"
        width={192}
        height={192}
      />
      <div class="mt-4 flex justify-between">
        <div>
          <h3 class="text-primary-foreground text-md">
            <span class="text-foreground">
              <span aria-hidden="true" class="absolute inset-0" />
              {props.actor.name}
            </span>
          </h3>
          <Show when={props.actor.character}>
            {(character) => (
              <p title={character()} class="text-muted-foreground truncate max-w-40 mt-1 text-sm">
                Role: {character()}
              </p>
            )}
          </Show>
        </div>
      </div>
    </div>
  );
}
