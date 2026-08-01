/**
 * Prompt optimization engine.
 *
 * Turns a plain-language situation ("my salary disappeared after paying rent")
 * into an image-generation prompt that produces an authentic, shareable meme —
 * grounded in internet meme formats, reaction culture, and Nigerian internet humor.
 */

export type MemeStyle =
  | "classic-macro" // top/bottom bold caption format
  | "reaction-face" // exaggerated reaction expression
  | "drake-format" // two-panel approve/disapprove
  | "distracted-format" // three-subject comparison
  | "naija-skit" // Nigerian skit-house style, exaggerated expressions, bold colors
  | "office-meme" // corporate/office humor, muted palette, exhausted expressions
  | "wholesome-poster"; // inspirational quote-card style

export type AspectRatio = "1:1" | "4:5" | "16:9" | "9:16";

const STYLE_DIRECTIVES: Record<MemeStyle, string> = {
  "classic-macro":
    "classic internet meme macro format, bold white Impact-style font with black outline, top and bottom caption placement, high contrast, slightly worn JPEG-compression look for authenticity",
  "reaction-face":
    "exaggerated reaction-face meme, close crop on facial expression, high emotion, punchy saturated colors, the kind of image people screenshot to reply in a group chat",
  "drake-format":
    "two-panel comparison meme layout, left panel rejecting/disapproving pose, right panel approving/celebrating pose, consistent character across both panels",
  "distracted-format":
    "three-subject comparison meme, one subject visibly distracted by a second thing while ignoring a third, exaggerated comedic body language",
  "naija-skit":
    "Nigerian comedy-skit aesthetic, bold saturated colors, exaggerated expressive faces, energetic composition reminiscent of Lagos skit-house content and Afrobeats visual culture",
  "office-meme":
    "corporate office humor aesthetic, fluorescent-lit setting, muted beige and gray palette, deadpan exhausted expression, relatable 9-to-5 fatigue",
  "wholesome-poster":
    "clean inspirational poster composition, generous negative space for a quote, warm gentle lighting, uplifting color palette",
};

const CULTURAL_LEXICON: Record<string, string> = {
  salary: "payday relief followed immediately by financial despair",
  rent: "landlord pressure and the Lagos rent-is-due-again feeling",
  japa: "the 'japa' emigration ambition and visa-interview anxiety",
  soft: "soft life aspiration versus hard reality contrast",
  banter: "football rivalry trash-talk energy",
  ex: "situationship and messy-relationship comedy",
  boss: "overbearing Monday-morning office-boss energy",
  network: "Nigerian network/data/light (NEPA) frustration humor",
  traffic: "Lagos go-slow traffic exhaustion",
};

function detectCulturalContext(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  return Object.entries(CULTURAL_LEXICON)
    .filter(([key]) => lower.includes(key))
    .map(([, context]) => context);
}

export function suggestStyle(prompt: string): MemeStyle {
  const lower = prompt.toLowerCase();
  if (/(office|boss|salary|meeting|monday|\bwork\b)/.test(lower)) return "office-meme";
  if (/(naija|lagos|pidgin|nepa|japa|owambe)/.test(lower)) return "naija-skit";
  if (/(vs|versus|prefer|rather|choice)/.test(lower)) return "drake-format";
  if (/(motivat|inspir|grind|hustle|grateful)/.test(lower)) return "wholesome-poster";
  if (/(distract|ignore|cheat|new phone)/.test(lower)) return "distracted-format";
  if (/(shock|crying|screaming|when|pov)/.test(lower)) return "reaction-face";
  return "classic-macro";
}

export interface BuildPromptInput {
  situation: string;
  style: MemeStyle;
  aspectRatio: AspectRatio;
  variationSeed?: number;
}

export function buildImagePrompt({ situation, style, variationSeed = 0 }: BuildPromptInput): string {
  const culturalNotes = detectCulturalContext(situation);
  const styleDirective = STYLE_DIRECTIVES[style];

  const variationFlavors = [
    "deadpan comedic timing",
    "over-the-top theatrical exaggeration",
    "dry understated irony",
    "chaotic maximalist energy",
  ];
  const flavor = variationFlavors[variationSeed % variationFlavors.length];

  const culturalLine = culturalNotes.length
    ? `Lean into: ${culturalNotes.join("; ")}.`
    : "";

  return [
    `Create a single shareable internet meme image about: "${situation}".`,
    `Visual style: ${styleDirective}.`,
    `Comedic tone: ${flavor}, understood the way a native internet meme scroller would get the joke instantly.`,
    culturalLine,
    "No real, named public figures. No brand logos. No offensive, hateful, or NSFW content.",
    "Leave clean, uncluttered space near the bottom-right corner suitable for a small watermark.",
    "The final image should look like something a person would actually screenshot and send in a group chat — not a polished stock illustration.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function captionSuggestion(situation: string): { top: string; bottom: string } {
  // Lightweight local caption fallback if the model doesn't return text overlays natively.
  const clean = situation.trim().replace(/\.$/, "");
  return {
    top: "ME:",
    bottom: clean.length > 60 ? clean.slice(0, 57) + "..." : clean,
  };
}
