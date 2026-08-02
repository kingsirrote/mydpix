"use client";

/**
 * Shares an image using the OS-level share sheet where supported (mobile
 * Safari/Chrome — this is what lets someone pick WhatsApp, Instagram,
 * Messages, etc. and send the actual image file). Falls back gracefully
 * on desktop browsers that don't support sharing files.
 */
export async function shareImage(imageUrl: string, title: string): Promise<"shared" | "copied" | "unsupported"> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const file = new File([blob], "mydpix-meme.png", { type: blob.type || "image/png" });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title, text: title });
      return "shared";
    }
  } catch (error) {
    // Fall through to text/url sharing or clipboard fallback below.
    if (error instanceof Error && error.name === "AbortError") {
      // User canceled the native share sheet — not an error worth surfacing.
      return "shared";
    }
  }

  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title, url: imageUrl });
      return "shared";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return "shared";
    }
  }

  if (navigator.clipboard) {
    await navigator.clipboard.writeText(imageUrl);
    return "copied";
  }

  return "unsupported";
}
