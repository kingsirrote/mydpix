import OpenAI from "openai";

let client: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export interface ModerationResult {
  allowed: boolean;
  flaggedCategories: string[];
}

/**
 * Runs the user's prompt through OpenAI's moderation endpoint before
 * spending an image-generation call on it.
 */
export async function moderatePrompt(prompt: string): Promise<ModerationResult> {
  const result = await getOpenAI().moderations.create({
    model: "omni-moderation-latest",
    input: prompt,
  });

  const flagged = result.results[0];
  if (!flagged) {
    // Fail closed: if the moderation API returns nothing usable, don't spend a
    // generation call on an unchecked prompt.
    return { allowed: false, flaggedCategories: ["moderation_unavailable"] };
  }

  const flaggedCategories = Object.entries(flagged.categories)
    .filter(([, isFlagged]) => isFlagged)
    .map(([category]) => category);

  return {
    allowed: !flagged.flagged,
    flaggedCategories,
  };
}

// Deliberately conservative denylist for named real public figures / hate terms
// is enforced primarily by the moderation API above; this is a lightweight
// supplementary check for platform-specific policy terms.
const BLOCKED_TERMS: string[] = [];

export function containsBlockedTerm(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return BLOCKED_TERMS.some((term) => lower.includes(term));
}
