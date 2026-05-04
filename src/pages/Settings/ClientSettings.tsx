import { createEffect, createMemo, createSignal, For, on, Show } from "solid-js";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Skeleton } from "@/ui/skeleton";
import { cx } from "cva";
import Palette from "lucide-solid/icons/palette";
import X from "lucide-solid/icons/x";
import Search from "lucide-solid/icons/search";
import {
  applyTheme,
  loadCustomThemes,
  loadSavedTheme,
  PRESET_THEMES,
  saveCustomThemes,
  saveTheme,
  type Theme,
  type ThemeVars,
} from "@/lib/themes";

const CUSTOM_VAR_GROUPS: { label: string; vars: (keyof ThemeVars)[] }[] = [
  {
    label: "core",
    vars: ["--background", "--foreground"],
  },
  {
    label: "card",
    vars: ["--card", "--card-foreground"],
  },
  {
    label: "primary",
    vars: ["--primary", "--primary-foreground"],
  },
  {
    label: "secondary",
    vars: ["--secondary", "--secondary-foreground"],
  },
  {
    label: "accent",
    vars: ["--accent", "--accent-foreground"],
  },
  {
    label: "muted",
    vars: ["--muted", "--muted-foreground"],
  },
  {
    label: "state",
    vars: ["--destructive", "--border", "--input", "--ring"],
  },
  {
    label: "sidebar",
    vars: [
      "--sidebar",
      "--sidebar-foreground",
      "--sidebar-primary",
      "--sidebar-primary-foreground",
      "--sidebar-accent",
      "--sidebar-accent-foreground",
      "--sidebar-border",
      "--sidebar-ring",
    ],
  },
];

const VAR_LABELS: Partial<Record<keyof ThemeVars, string>> = {
  "--background": "background",
  "--foreground": "foreground",
  "--card": "card",
  "--card-foreground": "card foreground",
  "--popover": "popover",
  "--popover-foreground": "popover foreground",
  "--primary": "primary",
  "--primary-foreground": "primary foreground",
  "--secondary": "secondary",
  "--secondary-foreground": "secondary foreground",
  "--muted": "muted",
  "--muted-foreground": "muted foreground",
  "--accent": "accent",
  "--accent-foreground": "accent foreground",
  "--destructive": "destructive",
  "--border": "border",
  "--input": "input",
  "--ring": "ring",
  "--sidebar": "sidebar",
  "--sidebar-foreground": "sidebar foreground",
  "--sidebar-primary": "sidebar primary",
  "--sidebar-primary-foreground": "sidebar primary foreground",
  "--sidebar-accent": "sidebar accent",
  "--sidebar-accent-foreground": "sidebar accent foreground",
  "--sidebar-border": "sidebar border",
  "--sidebar-ring": "sidebar ring",
  "--radius": "radius",
};


type ThemeCardProps = {
  theme: Theme;
  active: boolean;
  onSelect: () => void;
  onDelete?: () => void;
};

function ThemeCard(props: ThemeCardProps) {
  return (
    <button
      onClick={props.onSelect}
      class="group relative rounded border text-left transition-all focus:outline-none"
      style={{
        background: props.theme.vars["--background"],
        "border-color": props.active ? props.theme.vars["--primary"] : props.theme.vars["--border"],
        "border-width": props.active ? "2px" : "1px",
      }}
    >
      <div class="p-3 space-y-1.5">
        <div class="flex items-center justify-between gap-2">
          <span
            class="text-sm font-medium truncate"
            style={{ color: props.theme.vars["--foreground"] }}
          >
            {props.theme.name}
          </span>
          <div class="flex gap-1 shrink-0">
            <div
              class="size-3 rounded-full"
              style={{ background: props.theme.vars["--primary"] }}
            />
            <div class="size-3 rounded-full" style={{ background: props.theme.vars["--accent"] }} />
            <div
              class="size-3 rounded-full"
              style={{ background: props.theme.vars["--destructive"] }}
            />
          </div>
        </div>
        <div
          class="h-1.5 w-full rounded-full overflow-hidden"
          style={{ background: props.theme.vars["--muted"] }}
        >
          <div
            class="h-full rounded-full"
            style={{
              background: props.theme.vars["--primary"],
              width: "55%",
            }}
          />
        </div>
      </div>
      <Show when={props.onDelete}>
        <button
          class="absolute top-1 right-1 size-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: props.theme.vars["--destructive"],
            color: "#fff",
          }}
          onClick={(e) => {
            e.stopPropagation();
            props.onDelete?.();
          }}
          title="Delete theme"
        >
          <X class="size-3" />
        </button>
      </Show>
    </button>
  );
}

function UIPreview() {
  return (
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 rounded-full bg-primary" />
        <span class="text-xs text-muted-foreground font-medium uppercase tracking-widest">
          ui preview
        </span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="bg-card border border-border rounded-lg p-4 space-y-3">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-semibold text-card-foreground">Media Server</h3>
              <p class="text-sm text-muted-foreground mt-0.5">Manage your media library</p>
            </div>
            <Badge>active</Badge>
          </div>
          <div class="flex gap-2 flex-wrap">
            <Button size="sm">Browse</Button>
            <Button size="sm" variant="secondary">
              Settings
            </Button>
            <Button size="sm" variant="destructive">
              Remove
            </Button>
          </div>
          <div class="space-y-1.5">
            <div class="flex justify-between text-xs text-muted-foreground">
              <span>Storage used</span>
              <span>62%</span>
            </div>
            <div class="h-2 bg-muted rounded-full overflow-hidden">
              <div class="h-full bg-primary rounded-full w-[62%]" />
            </div>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg p-4 space-y-3">
          <h3 class="font-semibold text-card-foreground">Quick search</h3>
          <div class="border border-input bg-background rounded-md flex items-center px-3 gap-2">
            <Search class="size-4 text-muted-foreground shrink-0" />
            <input
              class="bg-transparent text-sm py-2 text-foreground placeholder:text-muted-foreground outline-none w-full"
              placeholder="Search movies, shows..."
              disabled
            />
          </div>
          <div class="space-y-2">
            <For
              each={[
                { title: "Inception", type: "movie", year: "2010" },
                { title: "Breaking Bad", type: "show", year: "2008" },
                { title: "Interstellar", type: "movie", year: "2014" },
              ]}
            >
              {(item) => (
                <div class="flex items-center justify-between py-1">
                  <div class="flex items-center gap-2">
                    <Skeleton class="size-6 rounded shrink-0" />
                    <span class="text-sm text-foreground">{item.title}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-muted-foreground">{item.year}</span>
                    <Badge variant="outline">{item.type}</Badge>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg p-4 space-y-3 sm:col-span-2">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-card-foreground">Typography & colors</h3>
            <Badge variant="secondary">preview</Badge>
          </div>
          <div class="flex flex-wrap gap-2">
            <span class="text-foreground text-sm font-medium">foreground</span>
            <span class="text-muted-foreground text-sm">muted foreground</span>
            <span class="text-primary text-sm font-medium">primary</span>
            <span class="text-destructive text-sm font-medium">destructive</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <div class="size-6 rounded bg-background border border-border" title="background" />
            <div class="size-6 rounded bg-card border border-border" title="card" />
            <div class="size-6 rounded bg-primary" title="primary" />
            <div class="size-6 rounded bg-secondary border border-border" title="secondary" />
            <div class="size-6 rounded bg-accent" title="accent" />
            <div class="size-6 rounded bg-muted" title="muted" />
            <div class="size-6 rounded bg-destructive" title="destructive" />
          </div>
          <div class="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm">
              outline
            </Button>
            <Button variant="ghost" size="sm">
              ghost
            </Button>
            <Button variant="link" size="sm">
              link
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ColorSettingsPage() {
  const savedTheme = loadSavedTheme();

  const [tab, setTab] = createSignal<"preset" | "custom">("preset");
  const [activeTheme, setActiveTheme] = createSignal<Theme>(savedTheme ?? PRESET_THEMES[0]);
  const [customThemes, setCustomThemes] = createSignal<Theme[]>(loadCustomThemes());
  const [editVars, setEditVars] = createSignal<ThemeVars>(
    savedTheme?.vars ?? PRESET_THEMES[0].vars,
  );
  const [customName, setCustomName] = createSignal("my theme");

  createEffect(
    on(activeTheme, (theme) => {
      applyTheme(theme.vars);
      saveTheme(theme);
    }),
  );



  function selectTheme(theme: Theme) {
    setActiveTheme(theme);
    setEditVars({ ...theme.vars });
  }

  function handleCustomVarChange(key: keyof ThemeVars, value: string) {
    setEditVars((prev) => ({ ...prev, [key]: value }));
    document.documentElement.style.setProperty(key, value);
  }

  function saveCustomTheme() {
    const name = customName().trim() || "custom theme";
    const newTheme: Theme = {
      id: `custom-${Date.now()}`,
      name,
      vars: { ...editVars() },
    };
    const updated = [...customThemes(), newTheme];
    setCustomThemes(updated);
    saveCustomThemes(updated);
    setActiveTheme(newTheme);
    saveTheme(newTheme);
  }

  function deleteCustomTheme(id: string) {
    const updated = customThemes().filter((t) => t.id !== id);
    setCustomThemes(updated);
    saveCustomThemes(updated);
    if (activeTheme().id === id) {
      selectTheme(PRESET_THEMES[0]);
    }
  }

  function loadPresetIntoEditor(theme: Theme) {
    setEditVars({ ...theme.vars });
    document.documentElement.style.setProperty("--radius", theme.vars["--radius"]);
    for (const [k, v] of Object.entries(theme.vars)) {
      document.documentElement.style.setProperty(k, v);
    }
  }

  const allThemes = createMemo(() => [...PRESET_THEMES, ...customThemes()]);

  return (
    <div class="flex flex-col gap-8 p-5 max-w-5xl">
      <div class="space-y-1">
        <div class="flex items-center gap-2 text-muted-foreground">
          <Palette class="size-4" />
          <span class="text-xs uppercase tracking-widest font-medium">theme</span>
        </div>
        <div class="flex gap-0 items-center">
          <button
            onClick={() => setTab("preset")}
            class={cx(
              "px-4 py-1.5 text-sm border transition-all",
              tab() === "preset"
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-muted-foreground border-border hover:text-foreground",
            )}
          >
            preset
          </button>
          <button
            onClick={() => setTab("custom")}
            class={cx(
              "px-4 py-1.5 text-sm border transition-all",
              tab() === "custom"
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-muted-foreground border-border hover:text-foreground",
            )}
          >
            custom
          </button>
        </div>
      </div>

      <Show when={tab() === "preset"}>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          <For each={allThemes()}>
            {(theme) => (
              <ThemeCard
                theme={theme}
                active={activeTheme().id === theme.id}
                onSelect={() => selectTheme(theme)}
                onDelete={
                  customThemes().some((c) => c.id === theme.id)
                    ? () => deleteCustomTheme(theme.id)
                    : undefined
                }
              />
            )}
          </For>
        </div>
      </Show>

      <Show when={tab() === "custom"}>
        <div class="space-y-6">
          <div class="flex flex-wrap gap-2 items-center">
            <span class="text-sm text-muted-foreground">load from preset:</span>
            <For each={PRESET_THEMES}>
              {(theme) => (
                <button
                  onClick={() => loadPresetIntoEditor(theme)}
                  class="px-3 py-1 text-xs border border-border hover:border-primary text-muted-foreground hover:text-foreground transition-all"
                >
                  {theme.name}
                </button>
              )}
            </For>
          </div>

          <div class="grid grid-cols-1 gap-6">
            <For each={CUSTOM_VAR_GROUPS}>
              {(group) => (
                <div class="space-y-2">
                  <span class="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                    {group.label}
                  </span>
                  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    <For each={group.vars}>
                      {(varKey) => (
                        <div class="flex items-center gap-2 border border-border bg-card px-3 py-2">
                          <input
                            type="color"
                            value={editVars()[varKey]}
                            onInput={(e) => handleCustomVarChange(varKey, e.currentTarget.value)}
                            class="size-7 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0"
                          />
                          <div class="min-w-0">
                            <div class="text-xs text-muted-foreground truncate">
                              {VAR_LABELS[varKey]}
                            </div>
                            <div class="text-xs text-foreground font-mono truncate">
                              {editVars()[varKey]}
                            </div>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              )}
            </For>

            <div class="space-y-2">
              <span class="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                radius
              </span>
              <div class="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.125"
                  value={parseFloat(editVars()["--radius"]) || 0}
                  onInput={(e) => {
                    const val = `${e.currentTarget.value}rem`;
                    handleCustomVarChange("--radius", val);
                  }}
                  class="w-40"
                />
                <span class="text-sm font-mono text-muted-foreground">
                  {editVars()["--radius"]}
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3 pt-2 border-t border-border">
            <div class="flex items-center gap-2 border border-border bg-card px-3 py-1.5">
              <input
                type="text"
                value={customName()}
                onInput={(e) => setCustomName(e.currentTarget.value)}
                class="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-36"
                placeholder="theme name"
              />
            </div>
            <Button onClick={saveCustomTheme} size="sm">
              save theme
            </Button>
            <span class="text-xs text-muted-foreground">
              saved themes appear in the preset grid
            </span>
          </div>
        </div>
      </Show>

      <div class="border-t border-border pt-6">
        <UIPreview />
      </div>
    </div>
  );
}
