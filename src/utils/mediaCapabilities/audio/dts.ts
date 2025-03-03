const MP4_TABLE = {
  20: "mp4a.A9",
  30: "mp4a.A9",
  40: "mp4a.A9",
  50: "mp4a.AA",
  60: "mp4a.AB",
  70: "mp4a.AC",
  61: "mp4a.AD",
  62: "mp4a.AE",
} as const;

const DTS_TABLE = {
  20: "dtsc",
  30: "dtsc",
  40: "dtsc",
  50: "dtsh",
  60: "dtsl",
  70: "dtse",
  61: "dtsx",
  62: "dtsx",
} as const;

export const COMMON_DTS = 20;

export function getDTSAudio(profile_idc: number = COMMON_DTS) {
  return DTS_TABLE[profile_idc as keyof typeof DTS_TABLE] ?? "dtsc";
}

//FF_PROFILE_DTS_ES           : "mp4a.A9",
//FF_PROFILE_DTS_96_24        : "mp4a.A9",
//FF_PROFILE_DTS_HD_HRA       : "mp4a.AA",
//FF_PROFILE_DTS_HD_MA        : "mp4a.AB",
//FF_PROFILE_DTS_EXPRESS      : "mp4a.AC",
//FF_PROFILE_DTS_HD_MA_X      : "mp4a.AD",
//FF_PROFILE_DTS_HD_MA_X_IMAX : "mp4a.AE",
