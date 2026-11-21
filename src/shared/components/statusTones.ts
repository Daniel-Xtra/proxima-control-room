export type StatusTone = "success" | "warning" | "danger" | "info" | "locked" | "neutral";

export const toneClasses: Record<StatusTone, string> = {
  success: "bg-success-bg text-success-text",
  warning: "bg-warning-bg text-warning-text",
  danger: "bg-danger-bg text-danger-text",
  info: "bg-info-bg text-info-text",
  locked: "bg-locked-bg text-locked",
  neutral: "bg-neutral-bg text-neutral-text",
};

/** The round dot before the label. The label always says what the status is, so colour is never the only signal. */
export const toneDots: Record<StatusTone, string> = {
  success: "bg-success-solid",
  danger: "bg-danger",
  warning: "bg-warning-solid",
  info: "bg-info-text",
  locked: "bg-locked",
  neutral: "bg-neutral-text",
};
