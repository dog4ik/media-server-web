import { Schemas } from "./serverApi";

export function formatDuration(duration: Schemas["SerdeDuration"]) {
  let str = "";
  let durationInSeconds = duration.secs;
  let hours = Math.floor(durationInSeconds / 3600);
  let minutes = Math.floor((durationInSeconds % 3600) / 60);
  let remainingSeconds = durationInSeconds % 60;

  if (hours > 0) {
    str += hours + ":";
    str += String(minutes).padStart(2, "0") + ":";
  } else {
    str += String(minutes) + ":";
  }
  str += String(remainingSeconds).padStart(2, "0");

  return str;
}

export function formatTimeBeforeRelease(input: string) {
  let targetDate = new Date(input);
  let now = new Date();
  let timeDifference = targetDate.getTime() - now.getTime();
  if (timeDifference <= 0) {
    return undefined;
  }

  let seconds = Math.floor(timeDifference / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  let days = Math.floor(hours / 24);

  let rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (days < 1) {
    return capitalize(rtf.format(hours, "hour"));
  } else {
    return capitalize(rtf.format(days, "day"));
  }
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatSize(bytes: number) {
  let kb = bytes / 1024;
  let mb = kb / 1024;
  let gb = mb / 1024;

  if (gb > 1) {
    return `${gb.toFixed(2)} Gb`;
  }

  if (mb > 1) {
    return `${mb.toFixed(2)} Mb`;
  }

  if (kb > 1) {
    return `${mb.toFixed(2)} Kb`;
  }

  return `${bytes} B`;
}

export function formatSE(number: number) {
  return number.toString().padStart(2, "0");
}

export function formatResolution(resolution: Schemas["Resolution"]) {
  return `${resolution.width}x${resolution.height}`;
}
