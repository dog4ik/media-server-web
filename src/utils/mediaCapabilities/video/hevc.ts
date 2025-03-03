import { Schemas } from "../../serverApi";

const HEVC_PROFILES_DESC = {
  1: "Main",
  2: "Main 10",
  3: "Main Still Picture",
  4: "Range extensions profiles",
  5: "High throughput profiles",
  6: "Multiview Main profile",
  7: "Scalable Main profile",
  8: "3D Main profile",
  9: "Screen content coding extensions profiles",
  10: "Scalable format range extensions profile",
} as const;

// NOTE: figure out constraints and what does weird number means
export function getHevcVideo(idc: number, level: number) {
  let base = "hev1";
  let constraints = "b0";
  // idc 1 == Main
  let weirdNumber = idc == 1 ? 6 : 4;
  return `${base}.${idc}.${weirdNumber}.L${level}.${constraints}`;
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

export function profileDescription(idc: number) {
  return HEVC_PROFILES_DESC[idc as keyof typeof HEVC_PROFILES_DESC];
}

export function getMaxHEVCLevel(
  resolution: Schemas["Resolution"],
  framerate: number,
) {
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
