export type ThemeVars = {
  "--background": string;
  "--foreground": string;
  "--card": string;
  "--card-foreground": string;
  "--popover": string;
  "--popover-foreground": string;
  "--primary": string;
  "--primary-foreground": string;
  "--secondary": string;
  "--secondary-foreground": string;
  "--muted": string;
  "--muted-foreground": string;
  "--accent": string;
  "--accent-foreground": string;
  "--destructive": string;
  "--border": string;
  "--input": string;
  "--ring": string;
  "--sidebar": string;
  "--sidebar-foreground": string;
  "--sidebar-primary": string;
  "--sidebar-primary-foreground": string;
  "--sidebar-accent": string;
  "--sidebar-accent-foreground": string;
  "--sidebar-border": string;
  "--sidebar-ring": string;
  "--radius": string;
};

export type Theme = {
  id: string;
  name: string;
  vars: ThemeVars;
};

export const THEME_STORAGE_KEY = "mediaserver-theme";
export const CUSTOM_THEMES_STORAGE_KEY = "mediaserver-custom-themes";

export function applyTheme(vars: ThemeVars) {
  let root = document.documentElement;
  for (let [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

export function loadSavedTheme(): Theme | null {
  try {
    let saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (!saved) return null;
    return JSON.parse(saved) as Theme;
  } catch {
    return null;
  }
}

export function saveTheme(theme: Theme) {
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
}

export function loadCustomThemes(): Theme[] {
  try {
    let saved = localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
    if (!saved) return [];
    return JSON.parse(saved) as Theme[];
  } catch {
    return [];
  }
}

export function saveCustomThemes(themes: Theme[]) {
  localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(themes));
}

export const PRESET_THEMES: Theme[] = [
  {
    id: "default-dark",
    name: "default dark",
    vars: {
      "--background": "#161616",
      "--foreground": "#e4e4e4",
      "--card": "#262626",
      "--card-foreground": "#e4e4e4",
      "--popover": "#262626",
      "--popover-foreground": "#e4e4e4",
      "--primary": "#3981f6",
      "--primary-foreground": "#ffffff",
      "--secondary": "#262626",
      "--secondary-foreground": "#e4e4e4",
      "--muted": "#262626",
      "--muted-foreground": "#a4a4a4",
      "--accent": "#1e3a8b",
      "--accent-foreground": "#bddaff",
      "--destructive": "#f14444",
      "--border": "#404040",
      "--input": "#404040",
      "--ring": "#3981f6",
      "--sidebar": "#18181d",
      "--sidebar-foreground": "#fcfcfc",
      "--sidebar-primary": "#1649e5",
      "--sidebar-primary-foreground": "#fcfcfc",
      "--sidebar-accent": "#26262b",
      "--sidebar-accent-foreground": "#fcfcfc",
      "--sidebar-border": "#ffffff1a",
      "--sidebar-ring": "#70707d",
      "--radius": "0rem",
    },
  },
  {
    id: "light",
    name: "light",
    vars: {
      "--background": "#ffffff",
      "--foreground": "#0a0a0a",
      "--card": "#ffffff",
      "--card-foreground": "#0a0a0a",
      "--popover": "#ffffff",
      "--popover-foreground": "#0a0a0a",
      "--primary": "#2563eb",
      "--primary-foreground": "#ffffff",
      "--secondary": "#f4f4f5",
      "--secondary-foreground": "#18181b",
      "--muted": "#f4f4f5",
      "--muted-foreground": "#71717a",
      "--accent": "#eff6ff",
      "--accent-foreground": "#1e3a8b",
      "--destructive": "#ef4444",
      "--border": "#e4e4e7",
      "--input": "#e4e4e7",
      "--ring": "#2563eb",
      "--sidebar": "#f8fafc",
      "--sidebar-foreground": "#0a0a0a",
      "--sidebar-primary": "#2563eb",
      "--sidebar-primary-foreground": "#ffffff",
      "--sidebar-accent": "#eff6ff",
      "--sidebar-accent-foreground": "#1e3a8b",
      "--sidebar-border": "#e4e4e7",
      "--sidebar-ring": "#2563eb",
      "--radius": "0.5rem",
    },
  },
  {
    id: "dracula",
    name: "dracula",
    vars: {
      "--background": "#282a36",
      "--foreground": "#f8f8f2",
      "--card": "#44475a",
      "--card-foreground": "#f8f8f2",
      "--popover": "#44475a",
      "--popover-foreground": "#f8f8f2",
      "--primary": "#bd93f9",
      "--primary-foreground": "#282a36",
      "--secondary": "#44475a",
      "--secondary-foreground": "#f8f8f2",
      "--muted": "#44475a",
      "--muted-foreground": "#6272a4",
      "--accent": "#ff79c6",
      "--accent-foreground": "#282a36",
      "--destructive": "#ff5555",
      "--border": "#6272a4",
      "--input": "#44475a",
      "--ring": "#bd93f9",
      "--sidebar": "#21222c",
      "--sidebar-foreground": "#f8f8f2",
      "--sidebar-primary": "#bd93f9",
      "--sidebar-primary-foreground": "#282a36",
      "--sidebar-accent": "#44475a",
      "--sidebar-accent-foreground": "#f8f8f2",
      "--sidebar-border": "#6272a4",
      "--sidebar-ring": "#bd93f9",
      "--radius": "0.5rem",
    },
  },
  {
    id: "nord",
    name: "nord",
    vars: {
      "--background": "#2e3440",
      "--foreground": "#eceff4",
      "--card": "#3b4252",
      "--card-foreground": "#eceff4",
      "--popover": "#3b4252",
      "--popover-foreground": "#eceff4",
      "--primary": "#88c0d0",
      "--primary-foreground": "#2e3440",
      "--secondary": "#3b4252",
      "--secondary-foreground": "#eceff4",
      "--muted": "#4c566a",
      "--muted-foreground": "#d8dee9",
      "--accent": "#81a1c1",
      "--accent-foreground": "#2e3440",
      "--destructive": "#bf616a",
      "--border": "#4c566a",
      "--input": "#4c566a",
      "--ring": "#88c0d0",
      "--sidebar": "#242933",
      "--sidebar-foreground": "#eceff4",
      "--sidebar-primary": "#88c0d0",
      "--sidebar-primary-foreground": "#2e3440",
      "--sidebar-accent": "#3b4252",
      "--sidebar-accent-foreground": "#eceff4",
      "--sidebar-border": "#4c566a",
      "--sidebar-ring": "#88c0d0",
      "--radius": "0.25rem",
    },
  },
  {
    id: "catppuccin",
    name: "catppuccin",
    vars: {
      "--background": "#1e1e2e",
      "--foreground": "#cdd6f4",
      "--card": "#313244",
      "--card-foreground": "#cdd6f4",
      "--popover": "#313244",
      "--popover-foreground": "#cdd6f4",
      "--primary": "#cba6f7",
      "--primary-foreground": "#1e1e2e",
      "--secondary": "#313244",
      "--secondary-foreground": "#cdd6f4",
      "--muted": "#45475a",
      "--muted-foreground": "#a6adc8",
      "--accent": "#89b4fa",
      "--accent-foreground": "#1e1e2e",
      "--destructive": "#f38ba8",
      "--border": "#45475a",
      "--input": "#45475a",
      "--ring": "#cba6f7",
      "--sidebar": "#181825",
      "--sidebar-foreground": "#cdd6f4",
      "--sidebar-primary": "#cba6f7",
      "--sidebar-primary-foreground": "#1e1e2e",
      "--sidebar-accent": "#313244",
      "--sidebar-accent-foreground": "#cdd6f4",
      "--sidebar-border": "#45475a",
      "--sidebar-ring": "#cba6f7",
      "--radius": "0.5rem",
    },
  },
  {
    id: "rose-pine",
    name: "rosé pine",
    vars: {
      "--background": "#191724",
      "--foreground": "#e0def4",
      "--card": "#1f1d2e",
      "--card-foreground": "#e0def4",
      "--popover": "#1f1d2e",
      "--popover-foreground": "#e0def4",
      "--primary": "#c4a7e7",
      "--primary-foreground": "#191724",
      "--secondary": "#26233a",
      "--secondary-foreground": "#e0def4",
      "--muted": "#26233a",
      "--muted-foreground": "#6e6a86",
      "--accent": "#ebbcba",
      "--accent-foreground": "#191724",
      "--destructive": "#eb6f92",
      "--border": "#403d52",
      "--input": "#26233a",
      "--ring": "#c4a7e7",
      "--sidebar": "#12101e",
      "--sidebar-foreground": "#e0def4",
      "--sidebar-primary": "#c4a7e7",
      "--sidebar-primary-foreground": "#191724",
      "--sidebar-accent": "#26233a",
      "--sidebar-accent-foreground": "#e0def4",
      "--sidebar-border": "#403d52",
      "--sidebar-ring": "#c4a7e7",
      "--radius": "0.5rem",
    },
  },
  {
    id: "rose-pine-dawn",
    name: "rosé pine dawn",
    vars: {
      "--background": "#faf4ed",
      "--foreground": "#575279",
      "--card": "#fffaf3",
      "--card-foreground": "#575279",
      "--popover": "#fffaf3",
      "--popover-foreground": "#575279",
      "--primary": "#907aa9",
      "--primary-foreground": "#faf4ed",
      "--secondary": "#f2e9e1",
      "--secondary-foreground": "#575279",
      "--muted": "#f2e9e1",
      "--muted-foreground": "#9893a5",
      "--accent": "#d7827e",
      "--accent-foreground": "#faf4ed",
      "--destructive": "#b4637a",
      "--border": "#dfdad9",
      "--input": "#f2e9e1",
      "--ring": "#907aa9",
      "--sidebar": "#f2e9e1",
      "--sidebar-foreground": "#575279",
      "--sidebar-primary": "#907aa9",
      "--sidebar-primary-foreground": "#faf4ed",
      "--sidebar-accent": "#fffaf3",
      "--sidebar-accent-foreground": "#575279",
      "--sidebar-border": "#dfdad9",
      "--sidebar-ring": "#907aa9",
      "--radius": "0.5rem",
    },
  },
  {
    id: "gruvbox",
    name: "gruvbox",
    vars: {
      "--background": "#282828",
      "--foreground": "#ebdbb2",
      "--card": "#3c3836",
      "--card-foreground": "#ebdbb2",
      "--popover": "#3c3836",
      "--popover-foreground": "#ebdbb2",
      "--primary": "#d79921",
      "--primary-foreground": "#282828",
      "--secondary": "#3c3836",
      "--secondary-foreground": "#ebdbb2",
      "--muted": "#504945",
      "--muted-foreground": "#a89984",
      "--accent": "#689d6a",
      "--accent-foreground": "#282828",
      "--destructive": "#cc241d",
      "--border": "#504945",
      "--input": "#3c3836",
      "--ring": "#d79921",
      "--sidebar": "#1d2021",
      "--sidebar-foreground": "#ebdbb2",
      "--sidebar-primary": "#d79921",
      "--sidebar-primary-foreground": "#282828",
      "--sidebar-accent": "#3c3836",
      "--sidebar-accent-foreground": "#ebdbb2",
      "--sidebar-border": "#504945",
      "--sidebar-ring": "#d79921",
      "--radius": "0rem",
    },
  },
  {
    id: "tokyo-night",
    name: "tokyo night",
    vars: {
      "--background": "#1a1b26",
      "--foreground": "#c0caf5",
      "--card": "#24283b",
      "--card-foreground": "#c0caf5",
      "--popover": "#24283b",
      "--popover-foreground": "#c0caf5",
      "--primary": "#7aa2f7",
      "--primary-foreground": "#1a1b26",
      "--secondary": "#24283b",
      "--secondary-foreground": "#c0caf5",
      "--muted": "#292e42",
      "--muted-foreground": "#565f89",
      "--accent": "#bb9af7",
      "--accent-foreground": "#1a1b26",
      "--destructive": "#f7768e",
      "--border": "#292e42",
      "--input": "#24283b",
      "--ring": "#7aa2f7",
      "--sidebar": "#16161e",
      "--sidebar-foreground": "#c0caf5",
      "--sidebar-primary": "#7aa2f7",
      "--sidebar-primary-foreground": "#1a1b26",
      "--sidebar-accent": "#24283b",
      "--sidebar-accent-foreground": "#c0caf5",
      "--sidebar-border": "#292e42",
      "--sidebar-ring": "#7aa2f7",
      "--radius": "0.25rem",
    },
  },
  {
    id: "one-dark",
    name: "one dark",
    vars: {
      "--background": "#282c34",
      "--foreground": "#abb2bf",
      "--card": "#21252b",
      "--card-foreground": "#abb2bf",
      "--popover": "#21252b",
      "--popover-foreground": "#abb2bf",
      "--primary": "#61afef",
      "--primary-foreground": "#282c34",
      "--secondary": "#2c313a",
      "--secondary-foreground": "#abb2bf",
      "--muted": "#2c313a",
      "--muted-foreground": "#5c6370",
      "--accent": "#c678dd",
      "--accent-foreground": "#282c34",
      "--destructive": "#e06c75",
      "--border": "#3e4451",
      "--input": "#2c313a",
      "--ring": "#61afef",
      "--sidebar": "#21252b",
      "--sidebar-foreground": "#abb2bf",
      "--sidebar-primary": "#61afef",
      "--sidebar-primary-foreground": "#282c34",
      "--sidebar-accent": "#2c313a",
      "--sidebar-accent-foreground": "#abb2bf",
      "--sidebar-border": "#3e4451",
      "--sidebar-ring": "#61afef",
      "--radius": "0.25rem",
    },
  },
  {
    id: "solarized-dark",
    name: "solarized dark",
    vars: {
      "--background": "#002b36",
      "--foreground": "#839496",
      "--card": "#073642",
      "--card-foreground": "#93a1a1",
      "--popover": "#073642",
      "--popover-foreground": "#93a1a1",
      "--primary": "#268bd2",
      "--primary-foreground": "#002b36",
      "--secondary": "#073642",
      "--secondary-foreground": "#93a1a1",
      "--muted": "#073642",
      "--muted-foreground": "#586e75",
      "--accent": "#2aa198",
      "--accent-foreground": "#002b36",
      "--destructive": "#dc322f",
      "--border": "#073642",
      "--input": "#073642",
      "--ring": "#268bd2",
      "--sidebar": "#001e26",
      "--sidebar-foreground": "#839496",
      "--sidebar-primary": "#268bd2",
      "--sidebar-primary-foreground": "#002b36",
      "--sidebar-accent": "#073642",
      "--sidebar-accent-foreground": "#93a1a1",
      "--sidebar-border": "#073642",
      "--sidebar-ring": "#268bd2",
      "--radius": "0rem",
    },
  },
];
