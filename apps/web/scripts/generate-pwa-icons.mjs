import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { pandaIconSvg } from "./panda-icon.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");
const iconsDir = path.join(publicDir, "pwa-icons");

const THEME_IDS = [
  "inkgold",
  "festive",
  "ocean",
  "forest",
  "dark",
  "minimal",
  "lavender",
  "tech",
];

async function writePng(size, outPath) {
  await sharp(Buffer.from(pandaIconSvg(size))).png().toFile(outPath);
}

await mkdir(iconsDir, { recursive: true });

for (const id of THEME_IDS) {
  for (const size of [180, 192, 512]) {
    const name = size === 180 ? `${id}-180.png` : `${id}-${size}.png`;
    await writePng(size, path.join(iconsDir, name));
  }
}

await writePng(192, path.join(publicDir, "pwa-192.png"));
await writePng(512, path.join(publicDir, "pwa-512.png"));
await writePng(512, path.join(publicDir, "panda-icon-preview.png"));

console.log(`Generated panda PWA icons in ${iconsDir}`);
