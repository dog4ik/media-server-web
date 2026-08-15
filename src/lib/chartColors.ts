// Fixed hex values instead of theme tokens because themes are runtime-swappable:
// this palette is validated for CVD separation and contrast against both dark
// (#262626) and light (#fcfcfb) card surfaces.
export const CHART_COLORS = [
  "#3987e5",
  "#d95926",
  "#199e70",
  "#c98500",
  "#d55181",
  "#008300",
  "#9085e9",
  "#e66767",
] as const;

// Clamped instead of cycled: generated/repeating hues become indistinguishable,
// so callers are expected to cap series at CHART_COLORS.length and aggregate the rest.
export function chartColor(index: number): string {
  return CHART_COLORS[Math.min(index, CHART_COLORS.length - 1)];
}

export const OTHER_COLOR = "#6b6b66";
export const OVERHEAD_COLOR = "#8f8f88";
