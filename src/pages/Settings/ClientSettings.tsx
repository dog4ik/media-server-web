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
      class="group relative rounded border-2 text-left transition-all focus:outline-none"
      style={{
        background: props.theme.vars["--background"],
        "border-color": props.active ? props.theme.vars["--primary"] : props.theme.vars["--border"],
      }}
    >
      <div class="space-y-1.5 p-3">
        <div class="flex items-center justify-between gap-2">
          <span
            class="truncate text-sm font-medium"
            style={{ color: props.theme.vars["--foreground"] }}
          >
            {props.theme.name}
          </span>
          <div class="flex shrink-0 gap-1">
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
          class="h-1.5 w-full overflow-hidden rounded-full"
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
          class="absolute top-1 right-1 flex size-5 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100"
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
        <div class="bg-primary h-2 w-2 rounded-full" />
        <span class="text-muted-foreground text-xs font-medium tracking-widest uppercase">
          ui preview
        </span>
      </div>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="bg-card border-border space-y-3 rounded-lg border p-4">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="text-card-foreground font-semibold">Media Server</h3>
              <p class="text-muted-foreground mt-0.5 text-sm">Manage your media library</p>
            </div>
            <Badge>active</Badge>
          </div>
          <div class="flex flex-wrap gap-2">
            <Button size="sm">Browse</Button>
            <Button size="sm" variant="secondary">
              Settings
            </Button>
            <Button size="sm" variant="destructive">
              Remove
            </Button>
          </div>
          <div class="space-y-1.5">
            <div class="text-muted-foreground flex justify-between text-xs">
              <span>Storage used</span>
              <span>62%</span>
            </div>
            <div class="bg-muted h-2 overflow-hidden rounded-full">
              <div class="bg-primary h-full w-[62%] rounded-full" />
            </div>
          </div>
        </div>

        <div class="bg-card border-border space-y-3 rounded-lg border p-4">
          <h3 class="text-card-foreground font-semibold">Quick search</h3>
          <div class="border-input bg-background flex items-center gap-2 rounded-md border px-3">
            <Search class="text-muted-foreground size-4 shrink-0" />
            <input
              class="text-foreground placeholder:text-muted-foreground w-full bg-transparent py-2 text-sm outline-none"
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
                    <Skeleton class="size-6 shrink-0 rounded" />
                    <span class="text-foreground text-sm">{item.title}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-muted-foreground text-xs">{item.year}</span>
                    <Badge variant="outline">{item.type}</Badge>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>

        <div class="bg-card border-border space-y-3 rounded-lg border p-4 sm:col-span-2">
          <div class="flex items-center justify-between">
            <h3 class="text-card-foreground font-semibold">Typography & colors</h3>
            <Badge variant="secondary">preview</Badge>
          </div>
          <div class="flex flex-wrap gap-2">
            <span class="text-foreground text-sm font-medium">foreground</span>
            <span class="text-muted-foreground text-sm">muted foreground</span>
            <span class="text-primary text-sm font-medium">primary</span>
            <span class="text-destructive text-sm font-medium">destructive</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <div class="bg-background border-border size-6 rounded border" title="background" />
            <div class="bg-card border-border size-6 rounded border" title="card" />
            <div class="bg-primary size-6 rounded" title="primary" />
            <div class="bg-secondary border-border size-6 rounded border" title="secondary" />
            <div class="bg-accent size-6 rounded" title="accent" />
            <div class="bg-muted size-6 rounded" title="muted" />
            <div class="bg-destructive size-6 rounded" title="destructive" />
          </div>
          <div class="flex flex-wrap gap-2">
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
    <div class="flex max-w-5xl flex-col gap-8 p-5">
      <div class="space-y-1">
        <div class="text-muted-foreground flex items-center gap-2">
          <Palette class="size-4" />
          <span class="text-xs font-medium tracking-widest uppercase">theme</span>
        </div>
        <div class="flex items-center gap-0">
          <button
            onClick={() => setTab("preset")}
            class={cx(
              "border px-4 py-1.5 text-sm transition-all",
              tab() === "preset"
                ? "bg-foreground text-background border-foreground"
                : "text-muted-foreground border-border hover:text-foreground bg-transparent",
            )}
          >
            preset
          </button>
          <button
            onClick={() => setTab("custom")}
            class={cx(
              "border px-4 py-1.5 text-sm transition-all",
              tab() === "custom"
                ? "bg-foreground text-background border-foreground"
                : "text-muted-foreground border-border hover:text-foreground bg-transparent",
            )}
          >
            custom
          </button>
        </div>
      </div>

      <Show when={tab() === "preset"}>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-muted-foreground text-sm">load from preset:</span>
            <For each={PRESET_THEMES}>
              {(theme) => (
                <button
                  onClick={() => loadPresetIntoEditor(theme)}
                  class="border-border hover:border-primary text-muted-foreground hover:text-foreground border px-3 py-1 text-xs transition-all"
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
                  <span class="text-muted-foreground text-xs font-medium tracking-widest uppercase">
                    {group.label}
                  </span>
                  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    <For each={group.vars}>
                      {(varKey) => (
                        <div class="border-border bg-card flex items-center gap-2 border px-3 py-2">
                          <input
                            type="color"
                            value={editVars()[varKey]}
                            onInput={(e) => handleCustomVarChange(varKey, e.currentTarget.value)}
                            class="size-7 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                          />
                          <div class="min-w-0">
                            <div class="text-muted-foreground truncate text-xs">
                              {VAR_LABELS[varKey]}
                            </div>
                            <div class="text-foreground truncate font-mono text-xs">
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
              <span class="text-muted-foreground text-xs font-medium tracking-widest uppercase">
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
                <span class="text-muted-foreground font-mono text-sm">
                  {editVars()["--radius"]}
                </span>
              </div>
            </div>
          </div>

          <div class="border-border flex items-center gap-3 border-t pt-2">
            <div class="border-border bg-card flex items-center gap-2 border px-3 py-1.5">
              <input
                type="text"
                value={customName()}
                onInput={(e) => setCustomName(e.currentTarget.value)}
                class="text-foreground placeholder:text-muted-foreground w-36 bg-transparent text-sm outline-none"
                placeholder="theme name"
              />
            </div>
            <Button onClick={saveCustomTheme} size="sm">
              save theme
            </Button>
            <span class="text-muted-foreground text-xs">
              saved themes appear in the preset grid
            </span>
          </div>
        </div>
      </Show>

      <div class="border-border border-t pt-6">
        <UIPreview />
      </div>
    </div>
  );
}
