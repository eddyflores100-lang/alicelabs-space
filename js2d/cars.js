// ============================================================
// ALICE CITY v5 — TRÁFICO
// Coches por carriles definidos, frenan ante peatones,
// respetan semáforos y mantienen distancia entre sí.
// ============================================================
import { G, dist2 } from './engine.js';
import { isCross, onRoad, lightPhase } from './city.js';
import { drawCarBody } from './draw.js';
import { isoX, isoY } from './engine.js';

// rutas cerradas sobre los carriles (centros de carril)
export const ROUTES = [
  { pts: [[3.5, 3.5], [3.5, 12.5], [12.5, 12.5], [12.5, 3.5]], cols: ['#e63946', '#00b4d8'] },
  { pts: [[11.5, 3.5], [11.5, 12.5], [20.5, 12.5], [20.5, 3.5]], cols: ['#ffd23f', '#6a3a8a'] },
  { pts: [[3.5, 11.5], [3.5, 20.5], [12.5, 20.5], [12.5, 11.5]], cols: ['#2a9d8f', '#e76f51'] },
  { pts: [[11.5, 11.5], [11.5, 20.5], [20.5, 20.5], [20.5, 11.5]], cols: ['#8a9bff', '#ff2fb3'] },
  { pts: [[3.5, 3.5], [3.5, 20.5], [20.5, 20.5], [20.5, 3.5]], cols: ['#c0c8d8', '#39ff88', '#ff9a3d'] }
];

export const cars = [];
export function spawnCars() {
  const plan = [[0, 0.0], [0, 0.5], [1, 0.2], [2, 0.0], [3, 0.4], [4, 0.1], [4, 0.6]];
  plan.forEach((p, i) => {
    cars.push({
      route: p[0], seg: 0, t: p[1],
      gx: ROUTES[p[0]].pts[0][0], gy: ROUTES[p[0]].pts[0][1],
      speed: 1.5 + (i % 3) * 0.12, curSpeed: 0,
      dir: 0, color: ROUTES[p[0]].cols[i % ROUTES[p[0]].cols.length],
      honkT: 0
    });
    // adelantar posición inicial según fase
    advanceCar(cars[i], p[1] * routeLen(ROUTES[p[0]]));
  });
}
function routeLen(r) {
  let L = 0;
  for (let i = 0; i < r.pts.length; i++) {
    const a = r.pts[i], b = r.pts[(i + 1) % r.pts.length];
    L += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return L;
}
function advanceCar(c, dist) {
  const pts = ROUTES[c.route].pts;
  let seg = c.seg, rest = dist;
  let guard = 0;
  while (rest > 0 && guard++ < 400) {
    const a = pts[seg], b = pts[(seg + 1) % pts.length];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const inSeg = ((c.t || 0) * L);
    const remain = L - inSeg;
    if (rest < remain) { c.t = (inSeg + rest) / L; c.gx = a[0] + (b[0] - a[0]) * c.t; c.gy = a[1] + (b[1] - a[1]) * c.t; return; }
    rest -= remain; c.t = 0; seg = (seg + 1) % pts.length;
  }
  c.seg = seg;
}

const pedBlockers = { list: [] };   // main lo llena cada frame: npcs + player
export function setPedList(list) { pedBlockers.list = list; }

export function updateCars(dt) {
  const ph = lightPhase(G.tiempo);
  for (const c of cars) {
    const pts = ROUTES[c.route].pts;
    const a = pts[c.seg], b = pts[(c.seg + 1) % pts.length];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const L = Math.hypot(dx, dy);
    const ux = dx / L, uy = dy / L;
    c.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3);
    const axis = Math.abs(dx) > Math.abs(dy) ? 'H' : 'V';

    // --- decisión de velocidad objetivo ---
    let target = c.speed;

    // 1) peatón en la calzada por delante → FRENAR SIEMPRE
    for (const p of pedBlockers.list) {
      const rx = p.gx - c.gx, ry = p.gy - c.gy;
      const along = rx * ux + ry * uy;
      const perp = Math.abs(rx * -uy + ry * ux);
      if (along > 0.12 && along < 1.35 && perp < 0.5 && (onRoad(p.gx, p.gy) || isCross(p.gx, p.gy))) {
        if (along < 0.95) target = 0; else target = Math.min(target, 0.4);
      }
      // colisión dura inmediata
      if (along > -0.1 && along < 0.55 && perp < 0.4) { target = 0; c.honkT = 0.6; }
    }

    // 2) semáforo rojo en cruce central por delante
    const inters = [[4, 4], [12, 4], [4, 12], [12, 12]];
    for (const it of inters) {
      const rx = it[0] - c.gx, ry = it[1] - c.gy;
      const along = rx * ux + ry * uy;
      const perp = Math.abs(rx * -uy + ry * ux);
      if (along > 0.3 && along < 1.7 && perp < 0.75 && ph[axis] === 0) {
        if (along < 1.15) target = 0; else target = Math.min(target, 0.5);
      }
    }

    // 3) coche delante por la misma ruta
    for (const o of cars) {
      if (o === c || o.route !== c.route) continue;
      const rx = o.gx - c.gx, ry = o.gy - c.gy;
      const along = rx * ux + ry * uy;
      const perp = Math.abs(rx * -uy + ry * ux);
      if (along > 0 && along < 1.3 && perp < 0.45) {
        target = Math.min(target, along < 0.8 ? 0 : o.curSpeed * 0.9);
      }
    }

    // claxon si bloqueado por peatón mucho tiempo
    if (c.honkT > 0) c.honkT -= dt;

    // aceleración / frenado suaves
    if (c.curSpeed < target) c.curSpeed = Math.min(target, c.curSpeed + dt * 2.4);
    else c.curSpeed = Math.max(target, c.curSpeed - dt * 5.0);

    // avanzar
    if (c.curSpeed > 0.001) {
      let remain = c.curSpeed * dt;
      let guard = 0;
      while (remain > 0 && guard++ < 8) {
        const aa = pts[c.seg], bb = pts[(c.seg + 1) % pts.length];
        const LL = Math.hypot(bb[0] - aa[0], bb[1] - aa[1]);
        const inSeg = (c.t || 0) * LL;
        const r2 = LL - inSeg;
        if (remain < r2) {
          c.t = (inSeg + remain) / LL;
          c.gx = aa[0] + (bb[0] - aa[0]) * c.t;
          c.gy = aa[1] + (bb[1] - aa[1]) * c.t;
          remain = 0;
        } else {
          remain -= r2; c.t = 0;
          c.seg = (c.seg + 1) % pts.length;
        }
      }
    }
  }
}

// bloqueo físico del jugador contra coches (círculo r 0.5)
export function carBlock(gx, gy) {
  for (const c of cars) {
    if (dist2(gx, gy, c.gx, c.gy) < 0.30) return true;
  }
  return false;
}

export function drawCars(t) {
  // orden de pintado por profundidad
  const sorted = [...cars].sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy));
  for (const c of sorted) drawCarBody(c.gx, c.gy, c.dir, c.color, t, false);
}
