import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { pandaIconSvg } from "./panda-icon.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");

const variants = [
  { id: "a-shadow", variant: "shadow", label: "方案A：加强阴影" },
  { id: "b-tinted", variant: "tinted", label: "方案B：浅灰底色" },
];

for (const { id, variant } of variants) {
  const out = path.join(publicDir, `panda-icon-preview-${id}.png`);
  await sharp(Buffer.from(pandaIconSvg(512, variant))).png().toFile(out);
  console.log(`Saved ${out}`);
}
