import { formatSE } from "@/utils/formats";
import type { Schemas } from "@/utils/serverApi";
import { assertNever } from "./assert";
import { cn } from "./cn";

export type QualityTier = "great" | "good" | "questionable" | "bad";

export function resolutionTier(
  resolution: Schemas["ResolutionAttr"],
): QualityTier {
  if (resolution === "2160p") return "great";
  if (resolution === "1080p") return "good";
  if (resolution === "720p") return "questionable";
  if (resolution === "480p") return "bad";
  return assertNever(resolution);
}

export function sourceTier(
  source: Schemas["SourceAttr"],
): QualityTier | undefined {
  if (source === "blu_ray" || source === "web_dl") return "good";
  if (source === "dvd") return "questionable";
  if (source === "telesync") return "bad";
  // web / web_rip are unremarkable
  if (source === "web" || source === "web_rip") return undefined;
  return assertNever(source);
}

export function sourceLabel(source: Schemas["SourceAttr"]): string {
  if (source === "web") return "WEB";
  if (source === "web_dl") return "WEB-DL";
  if (source === "web_rip") return "WEBRip";
  if (source === "blu_ray") return "BluRay";
  if (source === "dvd") return "DVD";
  if (source === "telesync") return "TELESYNC";
  return assertNever(source);
}

export function tagLabel(tag: Schemas["Tag"]): string {
  if (tag === "dubbed") return "Dubbed";
  if (tag === "subbed") return "Subbed";
  if (tag === "dual_audio") return "Dual Audio";
  if (tag === "multi_audio") return "Multi Audio";
  if (tag === "multi_subs") return "Multi Subs";
  if (tag === "uncensored") return "Uncensored";
  if (tag === "hdr") return "HDR";
  if (tag === "extended") return "Extended";
  if (tag === "remastered") return "Remastered";
  return assertNever(tag);
}

export function tierClass(tier: QualityTier | undefined): string {
  if (tier === "great")
    return cn("border-violet-500/50 bg-violet-500/15 text-violet-300");
  if (tier === "good")
    return cn("border-green-500/50 bg-green-500/15 text-green-300");
  if (tier === "questionable")
    return cn("border-orange-500/50 bg-orange-500/15 text-orange-300");
  if (tier === "bad") return cn("border-red-500/50 bg-red-500/15 text-red-400");
  return "";
}

export function identifierTitle(
  identifier: Schemas["ContentIdentifier"],
): string {
  let title = identifier.title;
  if (identifier.media_type === "show") {
    title += ` S${formatSE(identifier.season)}E${formatSE(identifier.episode)}`;
  }
  if (identifier.year) {
    title += ` (${identifier.year})`;
  }
  return title;
}
