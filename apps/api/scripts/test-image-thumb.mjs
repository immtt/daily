/**
 * Sharp / 缩略图 smoke test。
 * 本地: node apps/api/scripts/test-image-thumb.mjs
 * Docker build 阶段会在 Alpine 内自动执行。
 */
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

const THUMB_MAX = 256;

async function writeImageWithThumb(buf, destPath, thumbPath) {
  const image = sharp(buf, { failOn: "none" }).rotate();
  await image.toFile(destPath);
  await image
    .clone()
    .resize(THUMB_MAX, THUMB_MAX, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 78 })
    .toFile(thumbPath);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  console.log("[sharp-smoke] platform:", process.platform, process.arch);
  console.log("[sharp-smoke] sharp:", sharp.versions?.sharp, "vips:", sharp.versions?.vips);

  const sample = await sharp({
    create: {
      width: 1200,
      height: 900,
      channels: 3,
      background: { r: 40, g: 120, b: 200 },
    },
  })
    .jpeg({ quality: 90 })
    .toBuffer();

  const dir = await mkdtemp(join(tmpdir(), "sharp-smoke-"));
  const original = join(dir, "sample.jpg");
  const thumb = join(dir, "sample_t.webp");

  await writeImageWithThumb(sample, original, thumb);

  const origMeta = await sharp(original).metadata();
  const thumbMeta = await sharp(thumb).metadata();
  const origStat = await stat(original);
  const thumbStat = await stat(thumb);
  const thumbBytes = await readFile(thumb);

  assert(origMeta.width === 1200, `原图宽度应为 1200，实际 ${origMeta.width}`);
  assert(origMeta.height === 900, `原图高度应为 900，实际 ${origMeta.height}`);
  assert(thumbMeta.format === "webp", `缩略图格式应为 webp，实际 ${thumbMeta.format}`);
  assert(
    (thumbMeta.width ?? 0) <= THUMB_MAX && (thumbMeta.height ?? 0) <= THUMB_MAX,
    `缩略图尺寸超限: ${thumbMeta.width}x${thumbMeta.height}`
  );
  assert(thumbStat.size < origStat.size, "缩略图应小于原图");
  assert(thumbBytes.length > 32, "缩略图文件过小");

  console.log(
    `[sharp-smoke] OK original=${origMeta.width}x${origMeta.height} (${origStat.size}B) thumb=${thumbMeta.width}x${thumbMeta.height} (${thumbStat.size}B)`
  );
}

main().catch((err) => {
  console.error("[sharp-smoke] FAILED:", err);
  process.exit(1);
});
