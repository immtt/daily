import sharp from "sharp";

const THUMB_MAX = 256;
const THUMB_QUALITY = 78;

/** 保存原图并生成 WebP 缩略图，返回缩略图文件名 */
export async function writeImageWithThumb(
  buf: Buffer,
  destPath: string,
  thumbPath: string
) {
  const image = sharp(buf, { failOn: "none" }).rotate();
  await image.toFile(destPath);
  await image
    .clone()
    .resize(THUMB_MAX, THUMB_MAX, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: THUMB_QUALITY })
    .toFile(thumbPath);
}

export function thumbFilename(baseId: string) {
  return `${baseId}_t.webp`;
}
