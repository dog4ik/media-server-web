import { Resolution } from "../../serverApi";

const HEVC_PROFILES_DESC = [
  { profile_idc: 1, profile: "Main" },
  { profile_idc: 2, profile: "Main 10" },
  { profile_idc: 3, profile: "Main Still Picture" },
  { profile_idc: 4, profile: "Range extensions profiles" },
  { profile_idc: 5, profile: "High throughput profiles" },
  { profile_idc: 6, profile: "Multiview Main profile" },
  { profile_idc: 7, profile: "Scalable Main profile" },
  { profile_idc: 8, profile: "3D Main profile" },
  { profile_idc: 9, profile: "Screen content coding extensions profiles" },
  { profile_idc: 10, profile: "Scalable format range extensions profile" },
];

// NOTE: figure out constraints and what does weird number means
export function getHevcVideo(profile: string, level: number) {
  let base = "hev1";
  let profileIdc = HEVC_PROFILES_DESC.find((p) => p.profile)?.profile_idc;
  if (!profile) return undefined;
  let constraints = "b0";
  let weirdNumber = profile == "Main" ? 6 : 4;
  return `${base}.${profileIdc}.${weirdNumber}.L${level}.${constraints}`;
}
const HVEC_LEVEL_TO_LUMA = {
  1: 552_960,
  2: 3_686_400,
  2.1: 7_372_800,
  3: 16_588_800,
  3.1: 33_177_600,
  4: 66_846_720,
  4.1: 133_693_440,
  5: 267_386_880,
  5.1: 534_773_760,
  5.2: 1_069_547_520,
  6: 1_069_547_520,
  6.1: 2_139_095_040,
  6.2: 4_278_190_080,
};

export function getMaxHEVCLevel(resolution: Resolution, framerate: number) {
  let { width, height } = resolution;
  let sum = width * height * framerate;
  let maxLumaSampleRate = sum + sum / 15;
  let level = HVEC_LEVEL_TO_LUMA[1];
  for (let [key, value] of Object.entries(HVEC_LEVEL_TO_LUMA)) {
    if (!level || maxLumaSampleRate < value) {
      level = +key;
    }
  }
  return level * 3 * 10;
}
