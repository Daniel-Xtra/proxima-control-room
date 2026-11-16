export type StatusTone = "success" | "warning" | "danger" | "info" | "locked" | "neutral";

export const toneClasses: Record<StatusTone, string> = {
  success: "bg-success-bg text-success-text",
  warning: "bg-warning-bg text-warning-text",
  danger: "bg-danger-bg text-danger-text",
  info: "bg-info-bg text-info-text",
  locked: "bg-locked-bg text-locked",
  neutral: "bg-neutral-bg text-neutral-text",
};

/** Colour is never the only signal: each tone has its own glyph. */
export const toneGlyphs: Record<StatusTone, string> = {
  success: "✓",
  danger: "!",
  warning: "◐",
  info: "●",
  locked: "■",
  neutral: "○",
};
