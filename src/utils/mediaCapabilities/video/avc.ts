import { Resolution } from "../../serverApi";

const AVC_PROFILES_DESC = [
  { profile_idc: 66, profile: "Baseline", constraintFlag: 0 },
  {
    profile_idc: 66,
    profile: "Constrained Baseline",
    constraintFlag: 1 << 6,
  },
  { profile_idc: 77, profile: "Main", constraintFlag: 0 },
  {
    profile_idc: 77,
    profile: "Constrained Main",
    constraintFlag: 1 << 6,
  },
  { profile_idc: 88, profile: "Extended", constraintFlag: 0 },
  { profile_idc: 100, profile: "High", constraintFlag: 0 },
  {
    profile_idc: 100,
    profile: "High Progressive",
    constraintFlag: 1 << 3,
  },
  {
    profile_idc: 100,
    profile: "Constrained High",
    constraintFlag: (1 << 3) + (1 << 2),
  },
  { profile_idc: 110, profile: "High 10", constraintFlag: 0 },
  {
    profile_idc: 110,
    profile: "High 10 Intra",
    constraintFlag: 1 << 4,
  },
  { profile_idc: 122, profile: "High 4:2:2", constraintFlag: 0 },
  {
    profile_idc: 122,
    profile: "High 4:2:2 Intra",
    constraintFlag: 1 << 4,
  },
  { profile_idc: 244, profile: "High 4:4:4 Predictive", constraintFlag: 0 },
  {
    profile_idc: 244,
    profile: "High 4:4:4 Intra",
    constraintFlag: 1 << 4,
  },
  { profile_idc: 44, profile: "CAVLC 4:4:4 Intra", constraintFlag: 0 },
] as const;

const levels = {
  10: 1485,
  11: 3000,
  12: 6000,
  13: 11880,
  20: 11880,
  21: 19800,
  22: 20250,
  30: 40500,
  31: 108000,
  32: 216000,
  40: 245760,
  41: 245760,
  42: 522240,
  50: 589824,
  51: 983040,
} as const;

export function getAVCCodec(profile: string, level: number) {
  let description = AVC_PROFILES_DESC.find((d) => d.profile == profile);
  if (!description) return undefined;
  let encodedLevel = level.toString(16).padStart(2, "0");
  let encodedFlag = description.constraintFlag.toString(16).padStart(2, "0");
  let encodedProfile = description.profile_idc.toString(16).padStart(2, "0");
  let codec = "avc1." + encodedProfile + encodedFlag + encodedLevel;

  return codec;
}

export function getMaxAVCLevel(resolution: Resolution, framerate: number) {
  let { width, height } = resolution;
  let macroblocks = Math.ceil(width / 16) * Math.ceil(height / 16) * framerate;
  let level: keyof typeof levels | undefined = undefined;
  for (let [levelName, levelMacroblocks] of Object.entries(levels)) {
    if (levelMacroblocks > macroblocks) {
      if (!level || (level && levelMacroblocks < levels[level])) {
        level = +levelName as keyof typeof levels;
      }
    }
  }
  return level;
}
