const AAC_AUDIO_CODECS = {
  "": "mp4a.40",
  Main: "mp4a.40.1",
  LC: "mp4a.40.2",
  SSR: "mp4a.40.3",
  LTP: "mp4a.40.4",
  SBR: "mp4a.40.5",
  "HE-AAC": "mp4a.40.5",
  Scalable: "mp4a.40.6",
  "TWIN VQ": "mp4a.40.7",
  CELP: "mp4a.40.8",
  HVCX: "mp4a.40.9",
  TTSI: "mp4a.40.12",
  "Main Synthetic": "mp4a.40.13",
  "Wavetable Synthetis": "mp4a.40.14",
  "General Midi": "mp4a.40.15",
  ALGO_SYNTH_AUDIO_FX: "mp4a.40.16",
  ER_AAC_LC: "mp4a.40.17",
  ER_AAC_LTP: "mp4a.40.19",
  ER_AAC_SCALABLE: "mp4a.40.20",
  ER_TWINVQ: "mp4a.40.21",
  ER_BSAC: "mp4a.40.22",
  ER_AAC_LD: "mp4a.40.23",
  ER_CELP: "mp4a.40.24",
  ER_HVXC: "mp4a.40.25",
  ER_HILN: "mp4a.40.26",
  ER_PARAMETRIC: "mp4a.40.27",
  SSC: "mp4a.40.28",
  AAC_PS: "mp4a.40.29",
  LAYER1: "mp4a.40.32",
  LAYER2: "mp4a.40.33",
  LAYER3: "mp4a.40.34",
  DST: "mp4a.40.35",
  ALSO: "mp4a.40.36",
} as const;

export function getAACAudio(profile: string | keyof typeof AAC_AUDIO_CODECS) {
  if (profile in AAC_AUDIO_CODECS) {
    return AAC_AUDIO_CODECS[profile as keyof typeof AAC_AUDIO_CODECS];
  }
}

export function commonAACProfile() {
  // We are assuming LC profile
  return AAC_AUDIO_CODECS["LC"];
}
