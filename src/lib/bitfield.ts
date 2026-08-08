// popcount of every possible byte value.
const POPCNT = new Uint8Array(256);
for (let i = 0; i < 256; ++i) {
  POPCNT[i] = (i & 1) + POPCNT[i >> 1];
}

export class BitField {
  constructor(public bytes: Uint8Array) {}

  static empty(size: number) {
    return new BitField(Uint8Array.from([...Array(Math.ceil(size / 8))].map(() => 0)));
  }

  static fromBase64(data: string) {
    return new BitField(Uint8Array.fromBase64(data));
  }

  isEmpty() {
    return this.bytes.every((el) => el === 0);
  }

  has(idx: number): boolean {
    let byte = Math.floor(idx / 8);
    let block = this.bytes[byte];
    if (block === undefined) {
      return false;
    }

    return (block & this.mask(idx)) !== 0;
  }

  totalCount() {
    return this._rangeCountNaive(0);
  }

  static countOnes(num: number) {
    let count = 0;
    while (num != 0) {
      count += 1;
      num = num & (num - 1);
    }
    return count;
  }

  _rangeCountNaive(start: number, end?: number) {
    end = end ?? this.bytes.length * 8;
    end = Math.min(end, this.bytes.length * 8);
    start = Math.max(0, start);
    if (start >= end) return 0;
    let count = 0;
    for (let i = start; i < end; ++i) {
      if (this.has(i)) {
        count += 1;
      }
    }
    return count;
  }

  rangeCount(start: number, end?: number): number {
    end = end ?? this.bytes.length * 8;
    end = Math.min(end, this.bytes.length * 8);
    start = Math.max(0, start);
    if (start >= end) return 0;
    let count = 0;

    let firstFullByte = Math.ceil(start / 8);
    let lastFullByte = Math.floor(end / 8);

    if (firstFullByte >= lastFullByte) {
      for (let i = start; i < end; ++i) {
        if (this.has(i)) {
          count += 1;
        }
      }
      return count;
    }

    for (let i = start; i < firstFullByte * 8; ++i) {
      if (this.has(i)) {
        count += 1;
      }
    }

    for (let i = firstFullByte; i < lastFullByte; ++i) {
      count += POPCNT[this.bytes[i]];
    }

    let endOffset = end % 8;
    for (let i = end - endOffset; i < end; ++i) {
      if (this.has(i)) {
        count += 1;
      }
    }

    return count;
  }

  set(idx: number): boolean {
    let byte = Math.floor(idx / 8);
    let block = this.bytes[byte];
    if (block === undefined) {
      return false;
    }

    this.bytes[byte] = block | this.mask(idx);
    return true;
  }

  unset(idx: number): boolean {
    let byte = Math.floor(idx / 8);
    let block = this.bytes[byte];
    if (block === undefined) {
      return false;
    }

    let mask = ~this.mask(idx);
    this.bytes[byte] = block & mask;
    return true;
  }

  mask(idx: number) {
    // return 1 << (7 - (idx % 8));
    return 1 << (idx % 8);
  }
}

if (import.meta.vitest) {
  const { describe, test, assert } = import.meta.vitest;
  describe("bitfield tests", () => {
    test("bitfield set/get", () => {
      let bf = BitField.empty(16);
      bf.set(9);
      bf.unset(9);
      assert.strictEqual(bf.isEmpty(), true);
    });

    test("total count", () => {
      let bf = BitField.empty(16);
      bf.set(0);
      bf.set(1);
      bf.set(2);
      bf.set(4);
      bf.set(15);
      assert.strictEqual(bf.totalCount(), 5);
    });

    test("ranged count", () => {
      let size = 8 * 3;
      let bf = BitField.empty(size);
      [...Array(size)].map((_, i) => bf.set(i));
      assert.strictEqual(bf.rangeCount(2, 18), bf._rangeCountNaive(2, 18));
      assert.strictEqual(bf.rangeCount(0, 0), 0);
      assert.strictEqual(bf.rangeCount(0, 1), 1);
      assert.strictEqual(bf.rangeCount(0, 2), 2);
      assert.strictEqual(bf.rangeCount(8, 8), 0);
      assert.strictEqual(bf.rangeCount(8, 9), 1);
      assert.strictEqual(bf.rangeCount(8, 16), 8);
      assert.strictEqual(bf.rangeCount(8, 17), 9);
      assert.strictEqual(bf.rangeCount(8, 20), 12);
    });

    test("out of bounds access returns false", () => {
      let bf = BitField.empty(10);
      assert.strictEqual(bf.has(16), false);
    });
  });
}
