/**
 * Стабильный hue 0–359 для градиента плейсхолдера обложки.
 * @param {string | null | undefined} id
 */
export function hueFromId(id) {
  const s = String(id ?? '')
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  }
  return Math.abs(h) % 360
}
