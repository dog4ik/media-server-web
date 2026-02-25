import { Button } from "@/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/ui/card";
import { Skeleton } from "@/ui/skeleton";
import { Slider, SliderFill, SliderThumb, SliderTrack } from "@/ui/slider";
import { TextFieldInput } from "@/ui/textfield";
import { TextField } from "@kobalte/core/text-field";

type CssColorVar = keyof typeof CssColorVarNameMap;
const CssColorVarNameMap = {
  "--background": { name: "background" },
  "--foreground": { name: "foreground" },
  "--card": { name: "card" },
  "--card-foreground": { name: "card foreground" },
  "--popover": { name: "popover" },
  "--popover-foreground": { name: "popover foreground" },
  "--primary": { name: "primary" },
  "--primary-foreground": { name: "primary foreground" },
  "--secondary": { name: "secondary" },
  "--secondary-foreground": { name: "secondary foreground" },
  "--muted": { name: "muted" },
  "--muted-foreground": { name: "muted foreground" },
  "--accent": { name: "accent" },
  "--accent-foreground": { name: "accent-foreground" },
  "--destructive": { name: "descrictive" },
  "--border": { name: "border" },
  "--input": { name: "input" },
  "--ring": { name: "ring" },
  "--chart-1": { name: "chart 1" },
  "--chart-2": { name: "chart 2" },
  "--chart-3": { name: "chart 3" },
  "--chart-4": { name: "chart 4" },
  "--chart-5": { name: "chart 5" },
  "--sidebar": { name: "chart 6" },
  "--sidebar-foreground": { name: "sidebar foreground" },
  "--sidebar-primary": { name: "sidebar primary" },
  "--sidebar-primary-foreground": { name: "sidebar primary foreground" },
  "--sidebar-accent": { name: "sidebar accent" },
  "--sidebar-accent-foreground": { name: "sidebar accent foreground" },
  "--sidebar-border": { name: "sidebar boder" },
  "--sidebar-ring": { name: "sidebar ring" },
};

function setCssProprety(name: string, value: string) {
  document.documentElement.style.setProperty(name, value);
}

function getCssProperty(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name);
}

type ColorSettingProps = {
  name: CssColorVar;
};

function ColorSetting(props: ColorSettingProps) {
  let variable = CssColorVarNameMap[props.name];
  return (
    <div class="flex items-center justify-between">
      <span>{variable.name}</span>
      <input
        type="color"
        value={getCssProperty(props.name)}
        onInput={(e) => setCssProprety(props.name, e.currentTarget.value)}
      />
    </div>
  );
}

export function ColorSettingsPage() {
  return (
    <div class="grid grid-cols-2">
      <div class="grid grid-cols-2 gap-2 rounded p-4">
        {Object.keys(CssColorVarNameMap).map((k) => (
          <ColorSetting name={k as CssColorVar} />
        ))}
        <div>
          <span>Radius</span>
          <Slider
            onChange={([v]) => setCssProprety("--radius", `${v}rem`)}
            defaultValue={[1]}
            step={0.01}
            maxValue={2}
            class="w-[60%]"
          >
            <SliderTrack>
              <SliderFill />
              <SliderThumb />
            </SliderTrack>
          </Slider>
        </div>
      </div>
      <Card>
        <CardHeader>Examples:</CardHeader>
        <CardContent class="grid grid-cols-3 place-content-start gap-4">
          <Button>Primary</Button>
          <Button variant="secondary">Secordary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button disabled>Disabled</Button>
          <TextField>
            <TextFieldInput placeholder="Text input example" />
          </TextField>
          <div class="flex gap-2 items-center">
            <Skeleton class="rounded-full size-8" />
            <Skeleton class="h-4 w-60" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
