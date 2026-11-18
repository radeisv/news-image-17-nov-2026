// News-image entry for make.fun "Sum up 17 November's world news in one image"
// (competition news-image-20261117, Node 22, standard library only).
//
// The entry is the finished world-map image beside this file: a stylised map
// of Tuesday 17 November 2026's news under the masthead "TUESDAY 17 NOVEMBER
// 2026", with seven numbered pins (1 Kerch Bridge, 2 Bahrain, 3 Hormuz,
// 4 Manila, 5 Gaza, 6 Rwanda, 7 Tokyo) and a legend matching them. This
// program does not draw anything at run time: it validates the shipped image
// against the competition's limits and copies it to the grader's output
// directory, so both runs write the same bytes. Written as plain JavaScript
// syntax on purpose, so it runs under any Node 22 without type stripping.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MAX_BYTES = 1048576;
const MAX_DIMENSION = 1024;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// Read the PNG's width and height straight out of its IHDR chunk: bytes 16-23
// hold width then height as big-endian uint32, right after the 8-byte magic
// and the 8-byte chunk-length/type header.
function pngDimensions(buf) {
  if (buf.length < 24 || !buf.subarray(0, 8).equals(PNG_MAGIC)) {
    throw new Error('entry.png is not a PNG file (bad magic bytes)');
  }
  if (buf.toString('ascii', 12, 16) !== 'IHDR') {
    throw new Error('entry.png has no IHDR chunk where one is expected');
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function main() {
  const here = new URL('.', import.meta.url).pathname;
  const source = join(here, 'entry.png');
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  const dest = join(outDir, 'entry.png');

  if (!existsSync(source)) {
    throw new Error(`missing entry.png beside main.ts (looked in ${here})`);
  }
  const bytes = readFileSync(source);
  if (bytes.length > MAX_BYTES) {
    throw new Error(`entry.png is ${bytes.length} bytes, over the 1 MiB limit`);
  }
  const { width, height } = pngDimensions(bytes);
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    throw new Error(`entry.png is ${width}x${height}, over the 1024x1024 limit`);
  }
  // A whole PNG ends with its IEND chunk: 4 zero length bytes, the letters
  // IEND, and its CRC. A file cut short fails here instead of shipping.
  const tail = bytes.subarray(bytes.length - 12);
  if (tail.readUInt32BE(0) !== 0 || tail.toString('ascii', 4, 8) !== 'IEND') {
    throw new Error('entry.png is truncated (no trailing IEND chunk)');
  }

  copyFileSync(source, dest);
  const written = statSync(dest).size;
  if (written !== bytes.length) {
    throw new Error(`copied ${written} bytes, expected ${bytes.length}`);
  }
  console.log(
    `news-image-20261117: wrote ${width}x${height} PNG, ${written} bytes -> ${dest}`,
  );
}

main();
