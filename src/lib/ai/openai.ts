import OpenAI from "openai";
import type { AspectRatio } from "@/lib/ai/promptEngine";

let client: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

const SIZE_MAP: Record<AspectRatio, "1024x1024" | "1024x1536" | "1536x1024"> = {
  "1:1": "1024x1024",
  "4:5": "1024x1536",
  "9:16": "1024x1536",
  "16:9": "1536x1024",
};

export interface GenerateImageInput {
  prompt: string;
  aspectRatio: AspectRatio;
}

export interface GenerateImageResult {
  buffer: Buffer;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 800;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generates a single image via OpenAI's image API with exponential-backoff
 * retry on transient failures (rate limits, 5xx, timeouts).
 */
export async function generateImage({ prompt, aspectRatio }: GenerateImageInput): Promise<GenerateImageResult> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // gpt-image-1 supports size/quality values ("1024x1536", "1536x1024", "high") that
      // predate this pinned SDK version's TypeScript definitions, even though the live
      // API accepts them. The `any` cast is scoped to this call only; drop it once the
      // installed `openai` package's types catch up with the gpt-image-1 model.
      const params = {
        model: "gpt-image-1",
        prompt,
        size: SIZE_MAP[aspectRatio],
        quality: "high",
        n: 1,
      };
      const response = await getOpenAI().images.generate(
        params as unknown as Parameters<OpenAI["images"]["generate"]>[0]
      );

      const b64 = response.data[0]?.b64_json;
      if (!b64) throw new Error("No image data returned from provider");

      return { buffer: Buffer.from(b64, "base64") };
    } catch (error) {
      lastError = error;
      const retryable = isRetryableError(error);
      if (!retryable || attempt === MAX_RETRIES - 1) break;
      await sleep(BASE_DELAY_MS * 2 ** attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Image generation failed");
}

export async function generateImageVariations(
  input: GenerateImageInput,
  count: number
): Promise<GenerateImageResult[]> {
  const jobs = Array.from({ length: count }, () => generateImage(input));
  const settled = await Promise.allSettled(jobs);

  const results = settled
    .filter((r): r is PromiseFulfilledResult<GenerateImageResult> => r.status === "fulfilled")
    .map((r) => r.value);

  if (results.length === 0) {
    throw new Error("All image generation attempts failed");
  }

  return results;
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof OpenAI.APIError) {
    return error.status === 429 || (error.status ?? 0) >= 500;
  }
  return true;
}
