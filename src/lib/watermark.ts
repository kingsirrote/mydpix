import sharp from "sharp";

const DEFAULT_WATERMARK_TEXT = "Generated with MyDpix AI  ·  www.mydpix.com";

export interface WatermarkOptions {
  text?: string;
  /** Skip entirely for premium users who've paid to remove it. */
  skip?: boolean;
}

/**
 * Composites a small, semi-transparent watermark in the bottom-right corner
 * of a generated meme. The watermark height scales with the image so it stays
 * legible without overpowering the artwork, and sits inside a safe margin so
 * it doesn't crop into corner content.
 */
export async function applyWatermark(
  imageBuffer: Buffer,
  { text = DEFAULT_WATERMARK_TEXT, skip = false }: WatermarkOptions = {}
): Promise<Buffer> {
  if (skip) return imageBuffer;

  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width ?? 1024;
  const height = metadata.height ?? 1024;

  const fontSize = Math.max(14, Math.round(width * 0.018));
  const paddingX = Math.round(width * 0.02);
  const paddingY = Math.round(height * 0.02);
  const estCharWidth = fontSize * 0.56;
  const boxWidth = Math.min(width * 0.42, text.length * estCharWidth + 24);
  const boxHeight = fontSize + 16;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-opacity="0.45"/>
        </filter>
      </defs>
      <g filter="url(#soft-shadow)">
        <rect
          x="${width - boxWidth - paddingX}"
          y="${height - boxHeight - paddingY}"
          width="${boxWidth}"
          height="${boxHeight}"
          rx="${boxHeight / 2}"
          fill="black"
          fill-opacity="0.32"
        />
        <text
          x="${width - paddingX - boxWidth / 2}"
          y="${height - paddingY - boxHeight / 2 + fontSize * 0.32}"
          text-anchor="middle"
          font-family="Helvetica, Arial, sans-serif"
          font-size="${fontSize}"
          fill="white"
          fill-opacity="0.82"
          font-weight="600"
        >${escapeXml(text)}</text>
      </g>
    </svg>
  `;

  return image
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .toBuffer();
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Generates a resized, web-optimized thumbnail alongside the full-resolution asset.
 */
export async function generateThumbnail(imageBuffer: Buffer, maxWidth = 480): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer();
}

export async function toFormat(imageBuffer: Buffer, format: "png" | "jpg"): Promise<Buffer> {
  const image = sharp(imageBuffer);
  return format === "jpg" ? image.jpeg({ quality: 92 }).toBuffer() : image.png().toBuffer();
}

/**
 * Converts an image into the sticker format used by WhatsApp, Telegram, and
 * most third-party sticker-maker apps: 512x512 WebP, contained (not cropped)
 * on a transparent canvas. Note: this produces a correctly-formatted sticker
 * file for the user to add via a sticker-pack app — there is no way for a
 * website to push a sticker directly into WhatsApp's official sticker tray,
 * since that requires a native app using WhatsApp's dedicated Android/iOS API.
 */
export async function toStickerFormat(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(512, 512, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality: 85 })
    .toBuffer();
}
