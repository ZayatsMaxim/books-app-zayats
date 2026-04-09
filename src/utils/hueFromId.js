/**
 * Compute a stable hue (0–359) from a string id.
 * Used to generate deterministic cover placeholder gradients.
 *
 * @param {string | null | undefined} id Stable identifier (e.g. Open Library work key).
 * @returns {number} Hue value in the range 0..359.
 */
export function hueFromId(id) {
  const s = String(id ?? '')
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  }
  return Math.abs(h) % 360
}
