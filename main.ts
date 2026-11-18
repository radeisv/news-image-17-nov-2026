// News-image entry for make.fun "Sum up 17 November's world news in one
// image" (competition news-image-20261117, Node 22, standard library only).
// Round 3: a dense newspaper front page — dark navy masthead, 12 illustrated
// cards in a uniform 4x3 grid, a theme-coloured world map with numbered
// pins, and a 28-item "also on Tuesday" list: 40 stories from Tuesday
// 17 November 2026 in one 1024x1024 picture. The finished image is the
// entry.png beside this file; the program verifies it and copies it to
// /output/entry.png, exactly the bytes the judge sees.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, 'entry.png');
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const dst = join(outDir, 'entry.png');

if (!existsSync(src)) {
  throw new Error(`entry.png missing next to main.ts (${src})`);
}
const bytes = readFileSync(src);
if (bytes.length < 8 || bytes[0] !== 0x89 || bytes[1] !== 0x50 ||
    bytes[2] !== 0x4e || bytes[3] !== 0x47) {
  throw new Error('entry.png is not a PNG (bad magic bytes)');
}
const width = bytes.readUInt32BE(16);
const height = bytes.readUInt32BE(20);
if (width > 1024 || height > 1024) {
  throw new Error(`image is ${width}x${height}, over the 1024x1024 limit`);
}
if (bytes.length > 1024 * 1024) {
  throw new Error(`image is ${bytes.length} bytes, over the 1 MiB limit`);
}
// The file must end with a complete IEND chunk: 4 zero length bytes,
// the letters IEND, then the 4-byte CRC.
if (bytes.readUInt32BE(bytes.length - 12) !== 0 ||
    bytes.subarray(bytes.length - 8, bytes.length - 4).toString('latin1') !== 'IEND') {
  throw new Error('image is truncated: no trailing IEND chunk');
}

mkdirSync(outDir, { recursive: true });
copyFileSync(src, dst);
const copied = statSync(dst).size;
if (copied !== bytes.length) {
  throw new Error(`copy mismatch: wrote ${copied} bytes, expected ${bytes.length}`);
}
const sha = createHash('sha256').update(bytes).digest('hex');
console.log(
  `news-image-20261117: front page, 40 stories, ${width}x${height} PNG, ` +
  `${bytes.length} bytes, sha256 ${sha.slice(0, 12)}... -> ${dst}`,
);
