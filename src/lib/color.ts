// Color math for the theme. Pure, so it is tested without React or Paper.

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function channels(hex: string): number[] {
  if (!HEX_COLOR.test(hex)) throw new Error(`Expected a #RRGGBB color: ${hex}`);
  return [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
}

/** Paints `overlay` at `opacity` (0–1) over `base` and returns the opaque result as #RRGGBB. */
export function mixColors(base: string, overlay: string, opacity: number): string {
  // Written as a positive range check so that NaN is rejected too.
  if (!(opacity >= 0 && opacity <= 1)) throw new Error(`Opacity must be between 0 and 1: ${opacity}`);
  const top = channels(overlay);
  const mixed = channels(base).map((value, i) => Math.round(value + (top[i] - value) * opacity));
  return `#${mixed.map((value) => value.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}
