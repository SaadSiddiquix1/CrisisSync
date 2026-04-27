export type TouchFeedbackPattern = "tap" | "success" | "warning";

const feedbackPatterns: Record<TouchFeedbackPattern, number | number[]> = {
  tap: 10,
  success: [12, 28, 18],
  warning: [16, 40, 22],
};

function isTouchCapable() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const coarsePointer =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;

  return coarsePointer || navigator.maxTouchPoints > 0;
}

export function triggerTouchFeedback(pattern: TouchFeedbackPattern = "tap") {
  if (!isTouchCapable() || typeof navigator.vibrate !== "function") {
    return;
  }

  navigator.vibrate(feedbackPatterns[pattern]);
}
