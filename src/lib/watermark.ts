import sharp from "sharp";

const DEFAULT_WATERMARK_TEXT = "Generated with MyDpix AI  ·  www.mydpix.com";

export interface WatermarkOptions {
  text?: string;
  /** Skip entirely for users who've paid to remove it. */
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
 * Burns classic meme-format top/bottom captions into an uploaded image —
 * bold white text with a black outline, matching the impact-font look people
 * expect from a "real" meme. Either field can be omitted. Applied before
 * watermarking so the watermark stays a small corner mark regardless of
 * caption length.
 */
export async function applyMemeCaption(
  imageBuffer: Buffer,
  { topText, bottomText }: { topText?: string; bottomText?: string }
): Promise<Buffer> {
  if (!topText && !bottomText) return imageBuffer;

  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width ?? 1024;
  const height = metadata.height ?? 1024;

  const fontSize = Math.round(width * 0.09);
  const lineHeight = fontSize * 1.15;
  const strokeWidth = Math.max(2, Math.round(fontSize * 0.06));
  const margin = Math.round(height * 0.04);
  const maxCharsPerLine = Math.max(8, Math.floor(width / (fontSize * 0.6)));

  function renderLines(text: string, startY: number, anchorTop: boolean): string {
    const lines = wrapText(text.toUpperCase(), maxCharsPerLine);
    return lines
      .map((line, i) => {
        const y = anchorTop ? startY + i * lineHeight : startY + (i - (lines.length - 1)) * lineHeight;
        return `<text x="${width / 2}" y="${y}" text-anchor="middle"
          font-family="Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif"
          font-size="${fontSize}" font-weight="900"
          fill="white" stroke="black" stroke-width="${strokeWidth}" paint-order="stroke"
        >${escapeXml(line)}</text>`;
      })
      .join("\n");
  }

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${topText ? renderLines(topText, margin + fontSize, true) : ""}
      ${bottomText ? renderLines(bottomText, height - margin, false) : ""}
    </svg>
  `;

  return image.composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).toBuffer();
}

export function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 4); // cap runaway captions at 4 lines
}

/**
 * Composites a Tier 3 user's own uploaded watermark image in the bottom-right
 * corner, scaled to a sensible max size (~22% of canvas width) so a
 * user-uploaded logo can't dominate the meme. Used in place of the default
 * text badge whenever the user has one configured and hasn't opted to remove
 * watermarking entirely.
 */
export async function applyCustomWatermark(imageBuffer: Buffer, watermarkBuffer: Buffer): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width ?? 1024;
  const height = metadata.height ?? 1024;

  const targetWidth = Math.round(width * 0.22);
  const padding = Math.round(width * 0.02);

  const resizedWatermark = await sharp(watermarkBuffer)
    .resize({ width: targetWidth, withoutEnlargement: true })
    .ensureAlpha()
    .png()
    .toBuffer();
  const watermarkMeta = await sharp(resizedWatermark).metadata();
  const watermarkHeight = watermarkMeta.height ?? targetWidth;

  return image
    .composite([
      {
        input: resizedWatermark,
        top: Math.max(height - watermarkHeight - padding, 0),
        left: Math.max(width - targetWidth - padding, 0),
      },
    ])
    .toBuffer();
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
