import { Tooltip, TooltipContent, TooltipTrigger } from "@/ui/tooltip";
import { Compatibility } from "@/utils/mediaCapabilities";
import clsx from "clsx";
import { FiHeadphones, FiInfo, FiVideo } from "solid-icons/fi";
import { ParentProps, Show } from "solid-js";
import { JSX } from "solid-js/h/jsx-runtime";

type CompatibilityIconProps = {
  compatibiily: MediaCapabilitiesInfo;
} & ParentProps;

function CompatibilityIcon(props: CompatibilityIconProps) {
  let text = () =>
    props.compatibiily.supported
      ? `Supported, ${props.compatibiily.smooth ? "smooth" : "Not smoth"} and ${props.compatibiily.powerEfficient ? "power efficient" : "not power efficient"}`
      : "Not supported";
  return (
    <Tooltip>
      <TooltipTrigger>
        <div
          class={clsx(
            "flex h-10 w-10 items-center justify-center rounded-md",
            props.compatibiily.supported ? "bg-green-500" : "bg-red-500",
          )}
        >
          {props.children}
        </div>
      </TooltipTrigger>
      <TooltipContent>{text()}</TooltipContent>
    </Tooltip>
  );
}

type CompatibilityIconsProps = {
  compatibiily?: Partial<Compatibility>;
};

const ICON_SIZE = 20;

function CompatibilityIcons(props: CompatibilityIconsProps) {
  return (
    <div class="flex items-center justify-center">
      <Show when={props.compatibiily}>
        {(compatibility) => (
          <>
            <Show when={compatibility().audio}>
              {(audio) => (
                <CompatibilityIcon compatibiily={audio()}>
                  <FiHeadphones size={ICON_SIZE} />
                </CompatibilityIcon>
              )}
            </Show>
            <Show when={compatibility().video}>
              {(video) => (
                <CompatibilityIcon compatibiily={video()}>
                  <FiVideo size={ICON_SIZE} />
                </CompatibilityIcon>
              )}
            </Show>
          </>
        )}
      </Show>
    </div>
  );
}

type InfoProps = {
  icon?: JSX.Element;
  key: string;
  value: string | number;
};

export function Info(props: InfoProps & ParentProps) {
  return (
    <div class="flex flex-col gap-3">
      <div class="flex items-center gap-3">
        <div>
          <Show fallback={<FiInfo size={20} />} when={props.children}>
            {props.children}
          </Show>
        </div>
        <span class="text-sm">{props.key}</span>
      </div>
      <span class="text-sm font-bold">{props.value}</span>
    </div>
  );
}
