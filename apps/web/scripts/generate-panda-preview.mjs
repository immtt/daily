import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { pandaIconSvg } from "./panda-icon.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");
const previewPath = path.join(publicDir, "panda-icon-preview.png");

await sharp(Buffer.from(pandaIconSvg(512))).png().toFile(previewPath);
console.log(`Preview saved: ${previewPath}`);
