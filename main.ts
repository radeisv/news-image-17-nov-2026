// News-image entry for make.fun "Sum up 17 November's world news in one
// image" (competition news-image-20261117, Node 22, standard library only).
//
// Round 2: a dense newspaper front page for Tuesday 17 November 2026 —
// 35 stories in one picture. Three illustrated hero panels (the Crimean
// Bridge, the Iran–Bahrain drones, the Manila Quad summit), ten illustrated
// cards, a small world map with numbered pins, and a 22-item "also on
// Tuesday" list. The finished page is the entry.png beside this file.
//
// This program draws nothing at run time: it validates the shipped page
// against the competition's limits and copies it to the grader's output
// directory, so both runs write the same bytes. Written as plain JavaScript
// syntax on purpose, so it runs under any Node 22 without type stripping.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const LIMIT_BYTES = 1048576;
const LIMIT_PX = 1024;
const MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const IEND = Buffer.from([0x49, 0x45, 0x4e, 0x44]);

const here = new URL('.', import.meta.url).pathname;
const source = join(here, 'entry.png');
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const target = join(outDir, 'entry.png');

if (!existsSync(source)) {
  throw new Error('entry.png is missing next to main.ts');
}
const bytes = readFileSync(source);
if (bytes.length > LIMIT_BYTES) {
  throw new Error(`entry.png is ${bytes.length} bytes, over the 1 MiB limit`);
}
if (bytes.length < 24 || !bytes.subarray(0, 8).equals(MAGIC)) {
  throw new Error('entry.png is not a PNG file (bad magic bytes)');
}
if (bytes.toString('ascii', 12, 16) !== 'IHDR') {
  throw new Error('entry.png has no IHDR chunk where one is expected');
}
const width = bytes.readUInt32BE(16);
const height = bytes.readUInt32BE(20);
if (width > LIMIT_PX || height > LIMIT_PX) {
  throw new Error(`entry.png is ${width}x${height}, over the 1024x1024 limit`);
}
// A whole PNG ends with its IEND chunk: the last 12 bytes are its length
// (0), the letters IEND, and its checksum.
if (!bytes.subarray(bytes.length - 8, bytes.length - 4).equals(IEND)) {
  throw new Error('entry.png is truncated: no IEND chunk at the end');
}

mkdirSync(outDir, { recursive: true });
copyFileSync(source, target);
const written = statSync(target).size;
if (written !== bytes.length) {
  throw new Error(`copied ${written} bytes, expected ${bytes.length}`);
}
const sha = createHash('sha256').update(bytes).digest('hex');
console.log(`news-image-20261117: front page, 35 stories, ${width}x${height} PNG, ` +
  `${bytes.length} bytes, sha256 ${sha.slice(0, 12)}... -> ${target}`);
