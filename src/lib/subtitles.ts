export type Cue = { startMs: number; endMs: number; text: string };

export class Subtitle {
  cues: Cue[];
  constructor() {
    this.cues = [];
  }

  parse(raw: string) {
    let text = raw.split("\n");
    let pos = 0;
    while (pos < text.length) {
      if (text[pos] === "") {
        pos += 1;
        continue;
      }
      pos += 1; // skip index line
      let timestamp = text[pos].split(" --> ");
      if (timestamp.length !== 2) {
        throw Error("Failed to split timestamp");
      }
      let [startMs, endMs] = [
        this.parseTimestamp(timestamp[0]),
        this.parseTimestamp(timestamp[1]),
      ];
      pos += 1;
      let out = "";
      while (text[pos] !== undefined && text[pos] !== "") {
        if (out.length > 0) out += "\n";
        out += text[pos];
        pos += 1;
      }
      pos += 1;
      this.cues.push({ text: out, startMs, endMs });
    }
  }

  parseTimestamp(s: string) {
    let parts = s.split(":");
    if (parts.length !== 3) {
      throw Error("Failed to split parts");
    }
    let [hh, mm, [ss, ms]] = [
      this.parseNumber(parts[0]),
      this.parseNumber(parts[1]),
      this.parseSeconds(parts[2]),
    ];
    ms += ss * 1000;
    ms += mm * 60 * 1000;
    ms += hh * 60 * 60 * 1000;
    return ms;
  }

  parseSeconds(s: string) {
    let parts = s.split(",");

    if (parts.length !== 2) {
      throw Error("Failed to split timestamp seconds");
    }

    return [this.parseNumber(parts[0]), this.parseNumber(parts[1])];
  }

  parseNumber(s: string) {
    let n = parseInt(s, 10);
    if (Number.isNaN(n)) {
      throw Error("Failed to parse number");
    }
    return n;
  }

  seek(timestamp: number) {
    let idx = this.seekIdx(timestamp);
    if (idx !== undefined) {
      return this.cues[idx];
    }
  }

  seekIdx(timestamp: number) {
    if (this.cues.length === 0) return;

    let lo = 0;
    let hi = this.cues.length - 1;
    let ans = 0;
    while (lo <= hi) {
      let mid = Math.floor((lo + hi) / 2);
      if (this.cues[mid].startMs <= timestamp) {
        ans = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return ans;
  }
}

if (import.meta.vitest) {
  const { describe, test, assert } = import.meta.vitest;
  describe("subtitles tests", () => {
    const TEXT = `1
00:02:16,612 --> 00:02:19,376
Senator, we're making
our final approach into Coruscant.

2
00:02:19,482 --> 00:02:21,609
Very good, Lieutenant.

3
00:03:13,336 --> 00:03:15,167
We made it.

4
00:03:18,608 --> 00:03:20,371
I guess I was wrong.

5
00:03:20,476 --> 00:03:22,671
There was no danger at all.

`;
    const CUES: Cue[] = [
      {
        startMs: 136612,
        endMs: 139376,
        text: "Senator, we're making\nour final approach into Coruscant.",
      },
      { startMs: 139482, endMs: 141609, text: "Very good, Lieutenant." },
      { startMs: 193336, endMs: 195167, text: "We made it." },
      { startMs: 198608, endMs: 200371, text: "I guess I was wrong." },
      { startMs: 200476, endMs: 202671, text: "There was no danger at all." },
    ];

    test("parse start wars", () => {
      let subs = new Subtitle();
      subs.parse(TEXT);
      assert.deepEqual(subs.cues, CUES);
    });

    test("seek start wars", () => {
      let subs = new Subtitle();
      subs.parse(TEXT);

      assert.deepEqual(subs.seek(100), CUES[0]);
      assert.deepEqual(subs.seek(139482), CUES[1]);
      assert.deepEqual(subs.seek(139483), CUES[1]);
      assert.deepEqual(subs.seek(198608), CUES[3]);
      assert.deepEqual(subs.seek(999999999), CUES[4]);
    });
  });
}
