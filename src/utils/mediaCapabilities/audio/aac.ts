const AAC_AUDIO_CODECS = {
  "": "mp4a.40",
  main: "mp4a.40.1",
  lc: "mp4a.40.2",
  ssr: "mp4a.40.3",
  ltp: "mp4a.40.4",
  sbr: "mp4a.40.5",
  "he-aac": "mp4a.40.5",
  scalable: "mp4a.40.6",
  "twin vq": "mp4a.40.7",
  celp: "mp4a.40.8",
  hvcx: "mp4a.40.9",
  ttsi: "mp4a.40.12",
  "main synthetic": "mp4a.40.13",
  "wavetable synthetis": "mp4a.40.14",
  "general midi": "mp4a.40.15",
  algo_synth_audio_fx: "mp4a.40.16",
  er_aac_lc: "mp4a.40.17",
  er_aac_ltp: "mp4a.40.19",
  er_aac_scalable: "mp4a.40.20",
  er_twinvq: "mp4a.40.21",
  er_bsac: "mp4a.40.22",
  er_aac_ld: "mp4a.40.23",
  er_celp: "mp4a.40.24",
  er_hvxc: "mp4a.40.25",
  er_hiln: "mp4a.40.26",
  er_parametric: "mp4a.40.27",
  ssc: "mp4a.40.28",
  aac_ps: "mp4a.40.29",
  layer1: "mp4a.40.32",
  layer2: "mp4a.40.33",
  layer3: "mp4a.40.34",
  dst: "mp4a.40.35",
  also: "mp4a.40.36",
} as const;

export function getAACAudio(profile_idc: number) {
  return `mp4a.40.${profile_idc}`;
}

export function commonAACProfile() {
  // We are assuming LC profile
  return AAC_AUDIO_CODECS["lc"];
}
