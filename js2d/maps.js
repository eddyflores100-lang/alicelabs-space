// ============================================================
// ALICE CITY v6 — REGISTRO MULTI-MAPA
// La ciudad es el mapa principal; cada puerta lleva a un
// interior (casa, tienda, laboratorio…) con su propia
// rejilla, props, NPCs e interacciones. Como en un juego completo.
// ============================================================
import { isSolid as citySolid } from './city.js';

export const MAPS = {};          // id -> mapa
export let current = null;       // mapa interior actual (null = ciudad)

export function registerMap(m) { MAPS[m.id] = m; return m; }
export function setCurrent(id) {
  current = id ? (MAPS[id] || null) : null;
  return current;
}
export function getCurrent() { return current; }
export function isCity() { return !current; }

// ¿ posición bloqueada en el mapa ACTIVO (ciudad o interior) ?
export function blockedAt(gx, gy) {
  if (!current) return citySolid(gx, gy);
  const m = current;
  if (gx < 0.3 || gy < 0.3 || gx >= m.w - 0.3 || gy >= m.h - 0.3) return true;
  return m.solid[(gy | 0) * m.w + (gx | 0)] === 1;
}

// tile de suelo del mapa activo (para minimapa / lógica)
export function tileAt(gx, gy) {
  if (!current) return -1;
  const m = current;
  if (gx < 0 || gy < 0 || gx >= m.w || gy >= m.h) return -1;
  return m.tiles[(gy | 0) * m.w + (gx | 0)];
}

// centro libre más cercano (desatasco: nunca más jugadores atrapados)
export function nearestFree(gx, gy, radio = 5) {
  const cx = gx | 0, cy = gy | 0;
  for (let r = 0; r <= radio; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = cx + dx, y = cy + dy;
        if (!blockedAt(x + 0.5, y + 0.5)) return [x + 0.5, y + 0.5];
      }
    }
  }
  return null;
}
