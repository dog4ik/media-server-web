import {
  Combobox,
  ComboboxContent,
  ComboboxControl,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemLabel,
  ComboboxPortal,
  ComboboxTrigger,
} from "@/ui/combobox";
import { queryApi } from "@/utils/queryApi";
import { For, Show, Suspense } from "solid-js";
import FallbackImage from "../FallbackImage";
import { extendActor } from "@/utils/library";
import { Badge } from "@/ui/badge";
import X from "lucide-solid/icons/x";
import { Schemas } from "@/utils/serverApi";

type Props = {
  onFilter: (actors: number[] | undefined) => void;
};

export function ActorsCombobox(props: Props) {
  let actors = queryApi.useQuery(
    "get",
    "/api/actor/list",
    () => ({
      params: { query: { take: 200, search: "" } },
    }),
    () => ({
      placeholderData: (previousData, _) => previousData,
    }),
  );
  return (
    <Suspense>
      <Show when={actors.data}>
        {(res) => (
          <Combobox
            options={res().data}
            multiple
            onChange={(v) => props.onFilter(v.map((v) => v.local!.id!))}
            optionValue={(v) => v.local!.id!}
            optionTextValue="name"
            triggerMode="focus"
            placeholder="Actors filter"
            itemComponent={(props) => (
              <ComboboxItem item={props.item}>
                <FallbackImage
                  alt="Actor mini poster"
                  srcList={extendActor(props.item.rawValue).posterList()}
                  width={50}
                  height={50}
                  class="rounded-full overflow-hidden object-cover"
                />
                <ComboboxItemLabel>{props.item.rawValue.name}</ComboboxItemLabel>
              </ComboboxItem>
            )}
          >
            <ComboboxControl<Schemas["Actor"]> class="h-full min-h-9 w-full max-w-sm">
              {(state) => (
                <>
                  <div class="flex flex-wrap items-center gap-1">
                    <For each={state.selectedOptions()}>
                      {(option) => (
                        <Badge class="rounded-sm">
                          {option.name}
                          <button
                            type="button"
                            class="rounded-full"
                            onClick={() => {
                              state.remove(option);
                            }}
                          >
                            <X size={15} />
                          </button>
                        </Badge>
                      )}
                    </For>
                    <ComboboxInput />
                  </div>
                  <ComboboxTrigger />
                </>
              )}
            </ComboboxControl>
            <ComboboxPortal>
              <ComboboxContent class="h-96" />
            </ComboboxPortal>
          </Combobox>
        )}
      </Show>
    </Suspense>
  );
}
