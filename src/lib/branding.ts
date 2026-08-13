/** Uploaded brand artwork, served from the project asset CDN. */
export const DEFAULT_LOGO_URL =
  "/__l5e/assets-v1/87e5db52-957f-4385-90ab-f60f258ced91/owais-logo.png";

/** Background-removed signature (transparent PNG). */
export const DEFAULT_SIGNATURE_URL =
  "/__l5e/assets-v1/048dd0c5-e397-440a-84e0-82523e973be5/owais-signature.png";

/**
 * Print palette for the A4 documents.
 * Blue + white identity with a teal accent as the third brand colour.
 */
export const DOC = {
  primary: "#123A70",
  primaryText: "#FFFFFF",
  accent: "#0E8F8C",
  tint: "#EEF4FB",
  tintAlt: "#F7FAFD",
  border: "#CBD9EA",
  text: "#12233A",
  muted: "#5A6B80",
} as const;
