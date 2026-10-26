// ============================================================
// ALICE CITY v8 — RENDER DE CALIDAD (gradientes, sombras, luz)
// Paleta diurna brillante · suelo pre-renderizado con detalle ·
// edificios con caras en gradiente y sombra proyectada ·
// nubes al viento, pájaros de día y luciérnagas de noche.
// ALICELABS · ZOLO · Task 263
// ============================================================
import { isoX, isoY, hash2, ctx, VW, VH, faseDia } from './engine.js';
import { MAPC, MAPR, T, tile, buildings, props, lightsPos, ROADC, ROADR } from './city.js';
import { lightPhase } from './city.js';

const P = (gx, gy) => ({ x: isoX(gx, gy), y: isoY(gx, gy) });

// ---------- utilidades de dibujo ----------
function diamondPath(c, gx, gy) {
  const n = P(gx, gy), e = P(gx + 1, gy), s = P(gx + 1, gy + 1), w = P(gx, gy + 1);
  c.beginPath();
  c.moveTo(n.x, n.y); c.lineTo(e.x, e.y); c.lineTo(s.x, s.y); c.lineTo(w.x, w.y);
  c.closePath();
}

// rombo con gradiente vertical (más luz arriba) — usado por el suelo
function diamondG(c, gx, gy, colTop, colBot, stroke) {
  const n = P(gx, gy), s = P(gx + 1, gy + 1);
  diamondPath(c, gx, gy);
  const g = c.createLinearGradient(0, n.y, 0, s.y);
  g.addColorStop(0, colTop); g.addColorStop(1, colBot);
  c.fillStyle = g; c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1; c.stroke(); }
}

// sombra elíptica suave proyectada al SE (luz del NW)
function sombraElipse(c, gx, gy, rx, ry, a = 0.22) {
  const g = P(gx + 0.35, gy + 0.28);
  c.fillStyle = `rgba(12,20,40,${a})`;
  c.beginPath(); c.ellipse(g.x, g.y + 2, rx, ry, 0, 0, 7); c.fill();
}

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 255) * f) | 0, g2 = Math.min(255, ((n >> 8) & 255) * f) | 0, b2 = Math.min(255, (n & 255) * f) | 0;
  return `rgb(${r},${g2},${b2})`;
}

// ============================================================
// SUELO PRE-RENDERIZADO (caché estática: gradiente + textura por tile)
// ============================================================
let sueloCanvas = null;
const SUELO_OX = -656, SUELO_OY = -8;

export function buildGroundCache() {
  const W = 1330, H = 690;
  sueloCanvas = document.createElement('canvas');
  sueloCanvas.width = W; sueloCanvas.height = H;
  const c = sueloCanvas.getContext('2d');
  c.translate(-SUELO_OX, -SUELO_OY);   // mundo → píxeles del caché (drawImage luego resta el offset)

  for (let gy = 0; gy < MAPR; gy++) {
    for (let gx = 0; gx < MAPC; gx++) {
      const tt = tile[gy * MAPC + gx];
      const h = hash2(gx, gy), h2 = hash2(gx * 3 + 11, gy * 7 + 5);
      switch (tt) {
        case T.GRASS: {
          diamondG(c, gx, gy, '#57b063', '#3f8f4c');
          // briznas y motas de césped
          const n = P(gx, gy);
          for (let k = 0; k < 5; k++) {
            const rx = n.x - 8 + hash2(gx * 5 + k, gy * 9) * 16;
            const ry = n.y + 4 + hash2(gx * 9 + k, gy * 5) * 8;
            c.fillStyle = hash2(gx + k, gy - k) > 0.5 ? 'rgba(112,196,122,0.8)' : 'rgba(64,146,76,0.9)';
            c.fillRect(rx, ry, 1.6, 2.6);
          }
          // florecillas
          if (h > 0.86) {
            c.fillStyle = ['#ffffff', '#ffe36e', '#ff9ac2', '#9ad8ff'][Math.floor(h2 * 4)];
            c.beginPath(); c.arc(n.x + (h * 20 % 14) - 7, n.y + 9, 1.4, 0, 7); c.fill();
          }
          break;
        }
        case T.ROAD: {
          diamondG(c, gx, gy, '#5f667a', '#515868');
          // grano del asfalto
          const n = P(gx, gy);
          for (let k = 0; k < 4; k++) {
            const rx = n.x - 6 + hash2(gx * 7 + k, gy * 3) * 14;
            const ry = n.y + 5 + hash2(gx * 3 + k, gy * 7) * 7;
            c.fillStyle = hash2(gx - k, gy + k) > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';
            c.fillRect(rx, ry, 2, 1.4);
          }
          // línea central amarilla entre carriles + borde blanco
          const e = P(gx + 1, gy), s = P(gx + 1, gy + 1), w = P(gx, gy + 1);
          c.strokeStyle = 'rgba(244,211,110,0.85)'; c.lineWidth = 1.4;
          const dashV = ROADC.includes(gx);
          const dashH = ROADR.includes(gy);
          c.beginPath();
          if (dashV && (gy + gx) % 3 !== 2) { c.moveTo(n.x + 6, n.y + 3); c.lineTo(n.x + 12.5, n.y + 6.3); }
          else if (dashH && (gx + gy) % 3 !== 2) { c.moveTo(w.x + 10, w.y + 5); c.lineTo(w.x + 14.5, w.y + 7.3); }
          c.stroke();
          break;
        }
        case T.SIDE: {
          diamondG(c, gx, gy, '#b6bfd2', '#9ba5bb');
          // juntas de losas
          const n = P(gx, gy), e = P(gx + 1, gy), s = P(gx + 1, gy + 1), w = P(gx, gy + 1);
          c.strokeStyle = 'rgba(126,136,158,0.65)'; c.lineWidth = 1;
          c.beginPath();
          c.moveTo(n.x, n.y); c.lineTo(s.x, s.y);
          const mx = (n.x + e.x) / 2, my = (n.y + e.y) / 2;
          c.moveTo(mx, my); c.lineTo(w.x + (e.x - s.x) / 2, w.y + (e.y - s.y) / 2);
          c.stroke();
          // canto iluminado hacia la calle
          c.strokeStyle = 'rgba(232,238,250,0.7)';
          c.beginPath(); c.moveTo(n.x, n.y); c.lineTo(e.x, e.y); c.stroke();
          break;
        }
        case T.PLAZA: {
          const par = (gx + gy) % 2;
          diamondG(c, gx, gy, par ? '#cdc3ac' : '#c2b89f', par ? '#b7ad96' : '#aca289');
          if (h > 0.94) {
            const n = P(gx, gy);
            c.fillStyle = 'rgba(0,190,230,0.35)';
            c.fillRect(n.x - 2, n.y + 7, 4, 1.6);
          }
          break;
        }
        case T.CROSS: {
          diamondG(c, gx, gy, '#5f667a', '#515868');
          // cebras blancas bien visibles
          c.strokeStyle = 'rgba(248,250,255,0.88)'; c.lineWidth = 2.4;
          const vert = ROADC.includes(gx);
          const n = P(gx, gy);
          c.beginPath();
          for (let k = -1; k <= 1; k++) {
            if (vert) {
              const bx = n.x + k * 5.5 + 2, by = n.y + k * 2.7 + 2;
              c.moveTo(bx, by + 4); c.lineTo(bx + 10, by + 9);
            } else {
              const bx = n.x + k * 5.5 + 2, by = n.y - k * 2.7 + 8;
              c.moveTo(bx, by); c.lineTo(bx + 10, by - 5);
            }
          }
          c.stroke();
          break;
        }
      }
    }
  }
  // valla perimetral con postes luminosos
  const c0 = P(0, 0), c1 = P(MAPC, 0), c2 = P(MAPC, MAPR), c3 = P(0, MAPR);
  c.strokeStyle = 'rgba(0,220,255,0.5)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(c0.x, c0.y); c.lineTo(c1.x, c1.y); c.lineTo(c2.x, c2.y); c.lineTo(c3.x, c3.y); c.closePath(); c.stroke();
}

export function drawGround(t) {
  if (sueloCanvas) ctx.drawImage(sueloCanvas, SUELO_OX, SUELO_OY);
}

// fondo de cielo con gradiente según la hora (visible en bordes/vista aérea)
export function drawCielo() {
  const f = faseDia();
  let top = '#7ec2ea', bot = '#c8e6f8';
  if (f.nombre === 'AMANECER') { top = '#f8c890'; bot = '#a8d0f0'; }
  else if (f.nombre === 'ATARDECER') { top = '#f8a06a'; bot = '#9a8ac8'; }
  else if (f.noche) { top = '#182650'; bot = '#3a4a80'; }
  const g = ctx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, top); g.addColorStop(1, bot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VW, VH);
  // estrellas de noche (solo en el cielo lejano)
  if (f.noche) {
    for (let i = 0; i < 46; i++) {
      const sx = hash2(i * 13, 7) * VW, sy = hash2(i * 7, 3) * VH * 0.5;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(f.hora + i));
      ctx.fillStyle = `rgba(255,255,255,${tw * 0.8})`;
      ctx.fillRect(sx, sy, 1.6, 1.6);
    }
  }
}

// ============================================================
// CAJA ISOMÉTRICA CON GRADIENTES Y LUZ (misma firma que v5)
// ============================================================
export function isoBox(gx, gy, w, d, h, pal, line = 'rgba(10,14,30,0.55)') {
  const N = P(gx, gy), E = P(gx + w, gy), S = P(gx + w, gy + d), W = P(gx, gy + d);
  // cara SO (izquierda, en sombra) con gradiente vertical
  let g = ctx.createLinearGradient(0, W.y - h, 0, W.y);
  g.addColorStop(0, pal.l); g.addColorStop(1, shade(pal.l.startsWith('#') ? pal.l : '#888888', 0.72));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(W.x, W.y); ctx.lineTo(S.x, S.y); ctx.lineTo(S.x, S.y - h); ctx.lineTo(W.x, W.y - h); ctx.closePath(); ctx.fill();
  // brillo superior de la cara izquierda
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.beginPath(); ctx.moveTo(W.x, W.y - h); ctx.lineTo(S.x, S.y - h); ctx.lineTo(S.x, S.y - h + Math.min(3, h * 0.18)); ctx.lineTo(W.x, W.y - h + Math.min(3, h * 0.18)); ctx.closePath(); ctx.fill();
  // cara SE (derecha, iluminada)
  g = ctx.createLinearGradient(0, S.y - h, 0, S.y);
  g.addColorStop(0, shade(pal.r, 1.12)); g.addColorStop(1, pal.r);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(S.x, S.y); ctx.lineTo(E.x, E.y); ctx.lineTo(E.x, E.y - h); ctx.lineTo(S.x, S.y - h); ctx.closePath(); ctx.fill();
  // techo con gradiente
  g = ctx.createLinearGradient(0, N.y - h, 0, S.y - h);
  g.addColorStop(0, shade(pal.t, 1.15)); g.addColorStop(1, pal.t);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(N.x, N.y - h); ctx.lineTo(E.x, E.y - h); ctx.lineTo(S.x, S.y - h); ctx.lineTo(W.x, W.y - h); ctx.closePath(); ctx.fill();
  // contorno suave
  ctx.strokeStyle = line; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(N.x, N.y - h); ctx.lineTo(E.x, E.y - h); ctx.lineTo(S.x, S.y - h); ctx.lineTo(W.x, W.y - h); ctx.closePath();
  ctx.moveTo(W.x, W.y); ctx.lineTo(W.x, W.y - h); ctx.moveTo(S.x, S.y); ctx.lineTo(S.x, S.y - h); ctx.moveTo(E.x, E.y); ctx.lineTo(E.x, E.y - h);
  ctx.stroke();
}

// ============================================================
// EDIFICIOS: paletas claras, sombra proyectada, ventanas de cristal
// de día y cálidas de noche, letreros de neón, puertas con luz.
// ============================================================
const ESTILOS = [
  { l: '#7186b8', r: '#93a7d6', t: '#b9c8ea' },   // azul acero
  { l: '#88a8b8', r: '#a8c4d2', t: '#cfe3ec' },   // celeste vidrio
  { l: '#a88bc0', r: '#c3aadb', t: '#ddd0ee' },   // lavanda
  { l: '#8a95a8', r: '#a8b2c4', t: '#c8d0de' },   // hormigón claro
  { l: '#c49aa8', r: '#dcb4c0', t: '#eecfd8' },   // rosa palo
  { l: '#d8b48a', r: '#e8caa4', t: '#f4dfc0' },   // casas crema
  { l: '#9ec4a8', r: '#bcdcc6', t: '#d8eede' }    // menta
];

export function drawBuilding(b, t) {
  const f = faseDia();
  const pal = ESTILOS[b.estilo % ESTILOS.length];
  const E = P(b.gx + b.w, b.gy), S = P(b.gx + b.w, b.gy + b.d), W = P(b.gx, b.gy + b.d), N = P(b.gx, b.gy);

  // sombra proyectada al SE (más suave de noche)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W.x + 6, W.y + 3); ctx.lineTo(S.x + 8, S.y + 4); ctx.lineTo(E.x + 5, E.y + 2);
  ctx.lineTo(S.x + 2, S.y - b.h * 0.35); ctx.lineTo(W.x, W.y - b.h * 0.3);
  ctx.closePath();
  ctx.fillStyle = `rgba(14,22,46,${f.noche ? 0.16 : 0.26})`;
  ctx.fill();
  ctx.restore();

  isoBox(b.gx, b.gy, b.w, b.d, b.h, pal);

  // ventanas cara SE
  const rnd = mulberry32x(b.seed);
  const cols = b.d * 2, floors = Math.floor((b.h - 18) / 9);
  for (let j = 0; j < cols; j++) {
    const gpos = b.gy + (j + 0.5) * (b.d / cols);
    const base = P(b.gx + b.w, gpos);
    for (let i = 0; i < floors; i++) {
      const wy = base.y - b.h + 8 + i * 9;
      const r = rnd();
      // marco
      ctx.fillStyle = 'rgba(20,28,52,0.7)';
      ctx.fillRect(base.x - 2, wy - 1, 6, 7);
      if (f.noche) {
        // de noche: mayormente encendidas, luz cálida con halo
        if (r < 0.12) { ctx.fillStyle = '#2c3a58'; ctx.fillRect(base.x - 1, wy, 4, 5); continue; }
        const flick = hash2(b.seed + j * 17, i * 7 + Math.floor(t * 0.7)) > 0.985;
        const col = flick ? '#ffffff' : (r < 0.5 ? '#ffd97a' : (r < 0.78 ? '#ffb36b' : '#7ae7ff'));
        ctx.fillStyle = col;
        ctx.shadowColor = col; ctx.shadowBlur = 5;
        ctx.fillRect(base.x - 1, wy, 4, 5);
        ctx.shadowBlur = 0;
      } else {
        // de día: cristal celeste con reflejo, algunas encendidas
        const g = ctx.createLinearGradient(0, wy, 0, wy + 5);
        g.addColorStop(0, '#d6ecff'); g.addColorStop(1, '#8fb8d8');
        ctx.fillStyle = g;
        ctx.fillRect(base.x - 1, wy, 4, 5);
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.fillRect(base.x - 1, wy, 4, 1.4);
        if (r > 0.9) { ctx.fillStyle = '#ffd97a'; ctx.globalAlpha = 0.8; ctx.fillRect(base.x - 1, wy + 1.5, 4, 3.5); ctx.globalAlpha = 1; }
      }
    }
  }
  // ventanas cara SO (más tenues)
  const cols2 = b.w * 2;
  for (let j = 0; j < cols2; j++) {
    const gpos = b.gx + (j + 0.5) * (b.w / cols2);
    const base = P(gpos, b.gy + b.d);
    for (let i = 0; i < Math.floor(floors * 0.7); i++) {
      if (rnd() < 0.6) continue;
      const wy = base.y - b.h + 10 + i * 9;
      if (f.noche) { ctx.fillStyle = '#b8925a'; ctx.shadowColor = '#ffd97a'; ctx.shadowBlur = 3; }
      else ctx.fillStyle = '#6f87a8';
      ctx.fillRect(base.x - 2, wy, 3, 4);
      ctx.shadowBlur = 0;
    }
  }
  // líneas de piso
  ctx.strokeStyle = 'rgba(20,28,54,0.28)';
  for (let i = 1; i < floors; i++) {
    const y = S.y - b.h + 8 + i * 9;
    ctx.beginPath(); ctx.moveTo(W.x, W.y - b.h + 8 + i * 9); ctx.lineTo(S.x, y); ctx.lineTo(E.x, E.y - b.h + 8 + i * 9); ctx.stroke();
  }

  // letrero de neón en cara SE
  const txt = b.sign;
  ctx.font = 'bold 9px monospace';
  const tw = ctx.measureText(txt).width;
  const cx = (S.x + E.x) / 2, cyTop = S.y - b.h + 4;
  // placa con gradiente
  const pg = ctx.createLinearGradient(0, cyTop, 0, cyTop + 13);
  pg.addColorStop(0, 'rgba(16,22,44,0.96)'); pg.addColorStop(1, 'rgba(8,12,26,0.96)');
  ctx.fillStyle = pg;
  ctx.fillRect(cx - tw / 2 - 5, cyTop, tw + 10, 13);
  ctx.strokeStyle = b.color; ctx.lineWidth = 1;
  ctx.strokeRect(cx - tw / 2 - 4.5, cyTop + 0.5, tw + 9, 12);
  const pulse = 0.65 + 0.35 * Math.sin(t * 2.4 + b.seed);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = b.color;
  ctx.shadowColor = b.color; ctx.shadowBlur = 8;
  ctx.fillText(txt, cx - tw / 2, cyTop + 10);
  ctx.shadowBlur = 0; ctx.globalAlpha = 1;

  // puerta con marco luminoso + escalón
  const dgx = b.gx + b.w, dgy = b.gy + b.d / 2;
  const dp = P(dgx, dgy);
  ctx.fillStyle = 'rgba(10,14,30,0.9)';
  ctx.fillRect(dp.x - 4, dp.y - 12, 8, 12);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(dp.x - 5, dp.y + 1, 10, 2);
  const doorPulse = 0.5 + 0.5 * Math.sin(t * 3 + b.seed);
  ctx.strokeStyle = b.color; ctx.globalAlpha = 0.45 + 0.5 * doorPulse;
  ctx.shadowColor = b.color; ctx.shadowBlur = 5;
  ctx.strokeRect(dp.x - 4.5, dp.y - 12.5, 9, 12);
  ctx.shadowBlur = 0; ctx.globalAlpha = 1;

  // azotea: parapeto + AC + antena
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath(); ctx.moveTo(N.x, N.y - b.h); ctx.lineTo(E.x, E.y - b.h); ctx.lineTo(S.x, S.y - b.h); ctx.lineTo(W.x, W.y - b.h); ctx.closePath(); ctx.stroke();
  if (b.h > 40) {
    const acx = P(b.gx + 0.5, b.gy + 0.5);
    ctx.fillStyle = '#aab4c8'; ctx.fillRect(acx.x - 3, acx.y - b.h - 5, 6, 5);
    ctx.fillStyle = '#8a94a8'; ctx.fillRect(acx.x - 3, acx.y - b.h - 5, 6, 1.4);
  }
  // antena con luz roja intermitente
  const anx = P(b.gx + b.w * 0.3, b.gy + b.d * 0.3);
  ctx.strokeStyle = '#5a6488'; ctx.beginPath(); ctx.moveTo(anx.x, anx.y - b.h); ctx.lineTo(anx.x, anx.y - b.h - 12); ctx.stroke();
  if (Math.sin(t * 4 + b.seed) > 0) {
    ctx.fillStyle = '#ff5566'; ctx.shadowColor = '#ff5566'; ctx.shadowBlur = 5;
    ctx.fillRect(anx.x - 1, anx.y - b.h - 14, 2, 2);
    ctx.shadowBlur = 0;
  }
  // Torre Alice: aguja + baliza orbital
  if (b.sign === 'ALICE') {
    const sx = (N.x + S.x) / 2, sy = (N.y + S.y) / 2 - b.h;
    ctx.strokeStyle = '#7a8ab8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx, sy - 16); ctx.stroke(); ctx.lineWidth = 1;
    const oa = t * 2.2;
    ctx.fillStyle = '#00e8ff'; ctx.shadowColor = '#00e8ff'; ctx.shadowBlur = 7;
    ctx.fillRect(sx + Math.cos(oa) * 5 - 1, sy - 18 + Math.sin(oa) * 2, 2, 2);
    ctx.shadowBlur = 0;
  }
}
function mulberry32x(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ 0;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ============================================================
// PROPS con sombras y gradiente (misma firma que v5)
// ============================================================
export function drawProp(p, t) {
  const f = faseDia();
  const g = P(p.gx, p.gy);
  const gx = g.x, gy = g.y;
  switch (p.tipo) {
    case 'farola': {
      // charco de luz: mucho más presente de noche
      const la = f.noche ? 0.22 : 0.08;
      const lg = ctx.createRadialGradient(gx, gy + 2, 2, gx, gy + 2, 20);
      lg.addColorStop(0, `rgba(255,226,150,${la})`); lg.addColorStop(1, 'rgba(255,226,150,0)');
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.ellipse(gx, gy + 2, 20, 10, 0, 0, 7); ctx.fill();
      // sombra del poste
      ctx.fillStyle = `rgba(12,20,40,${f.noche ? 0.14 : 0.22})`;
      ctx.beginPath(); ctx.ellipse(gx + 3, gy + 2, 6, 2.4, 0, 0, 7); ctx.fill();
      // poste con gradiente
      const pg = ctx.createLinearGradient(gx - 1.5, 0, gx + 1.5, 0);
      pg.addColorStop(0, '#8a94ac'); pg.addColorStop(0.5, '#5a6478'); pg.addColorStop(1, '#3e465c');
      ctx.strokeStyle = pg; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy - 24); ctx.stroke();
      ctx.lineWidth = 1;
      // lámpara
      ctx.fillStyle = '#3e465c'; ctx.fillRect(gx - 3.5, gy - 28, 7, 4.5);
      const lampOn = f.noche || f.nombre === 'ATARDECER';
      ctx.fillStyle = lampOn ? '#ffe9b0' : '#dfe8f4';
      if (lampOn) { ctx.shadowColor = '#ffdf9a'; ctx.shadowBlur = 8; }
      ctx.fillRect(gx - 2.5, gy - 26, 5, 2.2);
      ctx.shadowBlur = 0;
      break;
    }
    case 'banco': {
      const d = p.data && p.data.dir ? 1 : 0;
      sombraElipse(ctx, p.gx, p.gy, 9, 3.4, 0.2);
      // patas
      ctx.fillStyle = '#3a3e50';
      if (!d) { ctx.fillRect(gx - 6, gy - 2, 2, 3); ctx.fillRect(gx + 4, gy - 2, 2, 3); }
      else { ctx.fillRect(gx - 1, gy + 2, 2, 3); ctx.fillRect(gx + 1, gy - 4, 2, 3); }
      // listones de madera con gradiente
      const wg = ctx.createLinearGradient(gx - 8, 0, gx + 8, 0);
      wg.addColorStop(0, '#b98a56'); wg.addColorStop(0.5, '#d8a86a'); wg.addColorStop(1, '#b98a56');
      ctx.fillStyle = wg;
      if (!d) ctx.fillRect(gx - 7, gy - 6, 14, 4); else ctx.fillRect(gx - 1, gy - 7, 4, 12);
      ctx.fillStyle = '#a87848';
      if (!d) ctx.fillRect(gx - 7, gy - 9, 14, 2.4); else ctx.fillRect(gx - 1, gy - 10, 2.4, 13);
      break;
    }
    case 'papelera':
      sombraElipse(ctx, p.gx, p.gy, 5, 2, 0.2);
      ctx.fillStyle = '#4a6a58'; ctx.fillRect(gx - 3, gy - 9, 6, 9);
      ctx.fillStyle = '#5f8a70'; ctx.fillRect(gx - 3, gy - 10.5, 6, 2.2);
      ctx.strokeStyle = 'rgba(16,26,20,0.6)'; ctx.strokeRect(gx - 3.5, gy - 10.5, 7, 10.5);
      break;
    case 'vending': {
      const cols = ['#22b8e6', '#e6495a', '#ffa04d'];
      const c = cols[(p.data && p.data.c || 0) % 3];
      sombraElipse(ctx, p.gx, p.gy, 6, 2.4, 0.22);
      isoBox(p.gx - 0.18, p.gy - 0.18, 0.4, 0.4, 15, { l: '#5a6480', r: '#7a84a0', t: c });
      // pantalla luminosa con gradiente
      const sg = ctx.createLinearGradient(0, gy - 13, 0, gy - 7);
      sg.addColorStop(0, 'rgba(255,255,255,0.95)'); sg.addColorStop(1, 'rgba(255,255,255,0.55)');
      ctx.fillStyle = sg;
      ctx.fillRect(gx + 1, gy - 13, 4, 6);
      ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 5;
      ctx.fillRect(gx + 1, gy - 6, 4, 2);
      ctx.shadowBlur = 0;
      break;
    }
    case 'kiosco': {
      sombraElipse(ctx, p.gx, p.gy, 12, 4, 0.22);
      isoBox(p.gx - 0.35, p.gy - 0.3, 0.75, 0.6, 14, { l: '#7a6a90', r: '#9484ac', t: '#b0a0c4' });
      // toldo a rayas con sombra
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 ? '#e6495a' : '#f6f4ee';
        ctx.fillRect(gx - 11 + i * 6, gy - 21, 6, 7);
      }
      ctx.fillStyle = 'rgba(20,16,32,0.75)'; ctx.fillRect(gx - 11, gy - 14, 23, 1.4);
      ctx.font = 'bold 7px monospace'; ctx.fillStyle = '#ffd97a';
      ctx.shadowColor = '#ffb347'; ctx.shadowBlur = 4;
      ctx.fillText(p.data && p.data.c ? 'TACOS' : 'SNACKS', gx - 10, gy - 23);
      ctx.shadowBlur = 0;
      break;
    }
    case 'arbol': {
      const big = p.data && p.data.big;
      const hgt = big ? 20 : 13;
      // sombra proyectada (crece al mediodía, se alivia de noche)
      const sa = f.noche ? 0.14 : 0.26;
      const sg2 = P(p.gx + 0.4, p.gy + 0.3);
      ctx.fillStyle = `rgba(12,20,40,${sa})`;
      ctx.beginPath(); ctx.ellipse(sg2.x, sg2.y + 2, big ? 11 : 7.5, big ? 4.4 : 3, 0, 0, 7); ctx.fill();
      // tronco con gradiente
      const tg = ctx.createLinearGradient(gx - 1.5, 0, gx + 1.5, 0);
      tg.addColorStop(0, '#7a5a36'); tg.addColorStop(0.5, '#9a7444'); tg.addColorStop(1, '#6a4c2c');
      ctx.fillStyle = tg;
      ctx.fillRect(gx - 1.5, gy - hgt * 0.42, 3, hgt * 0.42);
      // copa: 3 niveles con gradiente radial + vaivén suave
      const sway = Math.sin(t * 1.2 + p.gx * 3) * (big ? 1.4 : 1);
      const r1 = big ? 10 : 6.6;
      let cg = ctx.createRadialGradient(gx - 3 + sway, gy - hgt * 0.62 - 3, 1, gx + sway, gy - hgt * 0.6, r1 + 3);
      cg.addColorStop(0, '#7ad08a'); cg.addColorStop(0.55, '#3f9e58'); cg.addColorStop(1, '#2a7a42');
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.ellipse(gx + sway, gy - hgt * 0.6, r1, r1 * 0.78, 0, 0, 7); ctx.fill();
      cg = ctx.createRadialGradient(gx - 2 + sway * 1.2, gy - hgt * 0.78 - 2, 1, gx + sway * 1.2, gy - hgt * 0.75, r1 * 0.62);
      cg.addColorStop(0, '#8adf9a'); cg.addColorStop(1, '#3f9e58');
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.ellipse(gx - 2 + sway * 1.2, gy - hgt * 0.75, r1 * 0.62, r1 * 0.5, 0, 0, 7); ctx.fill();
      break;
    }
    case 'fuente': {
      // pileta con gradiente de piedra
      const c = P(p.gx - 1, p.gy - 1), e2 = P(p.gx + 1, p.gy - 1), s2 = P(p.gx + 1, p.gy + 1), w2 = P(p.gx - 1, p.gy + 1);
      const fg = ctx.createLinearGradient(0, c.y, 0, s2.y);
      fg.addColorStop(0, '#c8ccd8'); fg.addColorStop(1, '#9aa0b4');
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(e2.x, e2.y); ctx.lineTo(s2.x, s2.y); ctx.lineTo(w2.x, w2.y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#7a8094'; ctx.stroke();
      // agua con gradiente azul
      const w1 = P(p.gx - 0.55, p.gy - 0.55), e1 = P(p.gx + 0.55, p.gy - 0.55), s1 = P(p.gx + 0.55, p.gy + 0.55), ww = P(p.gx - 0.55, p.gy + 0.55);
      const ag = ctx.createLinearGradient(0, w1.y, 0, s1.y);
      ag.addColorStop(0, 'rgba(120,220,255,0.85)'); ag.addColorStop(1, 'rgba(0,150,220,0.8)');
      ctx.fillStyle = ag;
      ctx.beginPath(); ctx.moveTo(w1.x, w1.y); ctx.lineTo(e1.x, e1.y); ctx.lineTo(s1.x, s1.y); ctx.lineTo(ww.x, ww.y); ctx.closePath(); ctx.fill();
      // ondas
      const ph = (t * 1.4) % 1;
      ctx.strokeStyle = `rgba(220,248,255,${0.6 - ph * 0.5})`;
      const r0 = 0.2 + ph * 0.5;
      const a1 = P(p.gx - r0, p.gy - r0), b1 = P(p.gx + r0, p.gy - r0), c1 = P(p.gx + r0, p.gy + r0), d1 = P(p.gx - r0, p.gy + r0);
      ctx.beginPath(); ctx.moveTo(a1.x, a1.y); ctx.lineTo(b1.x, b1.y); ctx.lineTo(c1.x, c1.y); ctx.lineTo(d1.x, d1.y); ctx.closePath(); ctx.stroke();
      // chorro central con brillo
      const ctr = P(p.gx, p.gy);
      const jg = ctx.createLinearGradient(0, ctr.y - 12, 0, ctr.y);
      jg.addColorStop(0, 'rgba(255,255,255,0.95)'); jg.addColorStop(1, 'rgba(160,230,255,0.8)');
      ctx.fillStyle = jg;
      ctx.fillRect(ctr.x - 1, ctr.y - 10, 2, 10);
      for (let i = 0; i < 5; i++) {
        const dy = ((t * 30 + i * 7) % 12);
        ctx.fillStyle = `rgba(200,245,255,${0.9 - dy * 0.06})`;
        ctx.fillRect(ctr.x - 3 + (i % 2) * 5, ctr.y - 12 + dy, 1.4, 1.4);
      }
      break;
    }
    case 'valla': {
      const msgs = ['ALICOINS', 'x402 SOON', 'AGENTES +', 'ALICELABS', 'SOLANA', 'v8 CIUDAD VIVA'];
      const cols = ['#00e0ff', '#39ff88', '#ff2fb3', '#ffd97a', '#7a9bff', '#ff9a3d'];
      const i = (p.data && p.data.msg || 0) % 6;
      const mi = (i + Math.floor(t / 6)) % 6;
      // postes
      ctx.strokeStyle = '#4a5470'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(gx - 9, gy); ctx.lineTo(gx - 9, gy - 16); ctx.moveTo(gx + 9, gy); ctx.lineTo(gx + 9, gy - 16); ctx.stroke();
      ctx.lineWidth = 1;
      // panel con gradiente
      const bg = ctx.createLinearGradient(0, gy - 34, 0, gy - 16);
      bg.addColorStop(0, '#20284a'); bg.addColorStop(1, '#141a34');
      ctx.fillStyle = bg; ctx.fillRect(gx - 16, gy - 34, 32, 18);
      ctx.strokeStyle = cols[mi]; ctx.strokeRect(gx - 15.5, gy - 33.5, 31, 17);
      ctx.font = 'bold 7px monospace'; ctx.textAlign = 'center';
      const pulse = 0.6 + 0.4 * Math.sin(t * 3 + i);
      ctx.globalAlpha = pulse; ctx.fillStyle = cols[mi];
      ctx.shadowColor = cols[mi]; ctx.shadowBlur = 6;
      ctx.fillText(msgs[mi], gx, gy - 22);
      ctx.shadowBlur = 0; ctx.globalAlpha = 1; ctx.textAlign = 'left';
      break;
    }
    case 'taxi':
      drawCarBody(p.gx, p.gy, 0, '#ffd23f', t, true);
      break;
    case 'auto': {
      const cols = ['#e6495a', '#22b8e6', '#ffd23f', '#2a9d8f'];
      drawCarBody(p.gx, p.gy, 0, cols[(p.data && p.data.i || 0) % 4] || (p.data && p.data.c) || '#e6495a', t, true);
      break;
    }
  }
}

// semáforos con poste metálico
export function drawLights(t) {
  const ph = lightPhase(t);
  for (const l of lightsPos) {
    const g = P(l.gx, l.gy);
    const pg = ctx.createLinearGradient(g.x - 1.5, 0, g.x + 1.5, 0);
    pg.addColorStop(0, '#8a94ac'); pg.addColorStop(0.5, '#5a6478'); pg.addColorStop(1, '#3e465c');
    ctx.strokeStyle = pg; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(g.x, g.y - 22); ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fillStyle = '#2a3048'; ctx.fillRect(g.x - 3, g.y - 30, 6, 9);
    const st = ph[l.axis];
    const colors = ['#ff5566', '#ffd23f', '#39ff88'];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = st === i ? colors[i] : '#3a4058';
      if (st === i) { ctx.shadowColor = colors[i]; ctx.shadowBlur = 6; }
      ctx.fillRect(g.x - 2, g.y - 29 + i * 3, 4, 2.2);
      ctx.shadowBlur = 0;
    }
  }
}

// cuerpo de auto con gradiente, reflejo y faros de noche
export function drawCarBody(gx, gy, dir, color, t, parked = false) {
  const f = faseDia();
  const L = 0.95, Wd = 0.42;
  let w, d, offx = 0, offy = 0;
  if (dir === 0 || dir === 2) { w = L; d = Wd; offy = -Wd / 2; }
  else { w = Wd; d = L; offx = -Wd / 2; }
  const bx = gx + offx - (w / 2 - (dir === 0 || dir === 2 ? 0 : Wd / 2));
  const by = gy + offy - (d / 2 - (dir === 0 || dir === 2 ? Wd / 2 : 0));
  // sombra
  const S = P(gx, gy);
  ctx.fillStyle = `rgba(10,18,38,${f.noche ? 0.22 : 0.32})`;
  ctx.beginPath(); ctx.ellipse(S.x + 2, S.y + 1, 13, 5.4, 0, 0, 7); ctx.fill();
  // carrocería con brillo superior
  isoBox(bx, by, w, d, 5.5, { l: shade(color, 0.62), r: color, t: shade(color, 1.18) });
  // franja de brillo sobre el techo
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  const tb = P(bx + w * 0.25, by + d * 0.25);
  ctx.fillRect(tb.x - 3, tb.y - 6.5, 6, 1.2);
  // cabina con cristal degradado
  const cbx = bx + (dir === 0 || dir === 2 ? w * 0.3 : 0.05);
  const cby = by + (dir === 0 || dir === 2 ? 0.05 : d * 0.3);
  isoBox(cbx, cby, dir === 0 || dir === 2 ? w * 0.4 : w - 0.1, dir === 0 || dir === 2 ? d - 0.1 : d * 0.4, 4.5, { l: '#2a3248', r: '#3a4258', t: '#9fd4ff' });
  if (!parked) {
    // faros: cono de luz de noche
    const front = dir === 0 ? P(bx + w, by + d) : dir === 1 ? P(bx, by + d) : dir === 2 ? P(bx, by) : P(bx + w, by);
    ctx.fillStyle = '#fffbe0'; ctx.shadowColor = '#fff2a8'; ctx.shadowBlur = 6;
    ctx.fillRect(front.x - 2, front.y - 3.5, 2, 2);
    ctx.shadowBlur = 0;
    if (f.noche) {
      const cone = dir === 0 ? [1, 0.5] : dir === 1 ? [-0.5, 1] : dir === 2 ? [-1, -0.5] : [0.5, -1];
      const lg = ctx.createRadialGradient(front.x, front.y - 2, 1, front.x + cone[0] * 26, front.y - 2 + cone[1] * 13, 26);
      lg.addColorStop(0, 'rgba(255,240,180,0.30)'); lg.addColorStop(1, 'rgba(255,240,180,0)');
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.ellipse(front.x + cone[0] * 14, front.y - 2 + cone[1] * 7, 15, 8, 0, 0, 7); ctx.fill();
    }
  }
}

// ============================================================
// AMBIENTE: nubes al viento (día), pájaros, luciérnagas (noche)
// Se dibuja en espacio de mundo, encima de los objetos.
// ============================================================
// sombras de nubes a ras de suelo (día): parches suaves que dan vida sin lavar
export function drawSombrasNubes(t) {
  const f = faseDia();
  if (f.noche) return;
  for (let i = 0; i < 3; i++) {
    const span = 1700;
    const cx = -850 + ((t * (8 + i * 2.4) + i * 560) % span);
    const cy = 90 + i * 170 + Math.sin(t * 0.25 + i) * 10;
    const r = 95 + i * 22;
    const cg = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
    cg.addColorStop(0, 'rgba(24,36,70,0.09)');
    cg.addColorStop(1, 'rgba(24,36,70,0)');
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.5, 0, 0, 7); ctx.fill();
  }
}

export function drawNubes(t) {
  const f = faseDia();
  // pájaros de día: bandadas pequeñas cruzando
  if (!f.noche && f.nombre !== 'ATARDECER') {
    ctx.strokeStyle = 'rgba(30,40,60,0.65)'; ctx.lineWidth = 1.4;
    for (let i = 0; i < 5; i++) {
      const bx = -800 + ((t * 46 + i * 350) % 1700);
      const by = 60 + (i % 3) * 26 + Math.sin(t * 2 + i * 2) * 6;
      const flap = Math.sin(t * 9 + i) * 2.4;
      ctx.beginPath();
      ctx.moveTo(bx - 4, by - flap); ctx.lineTo(bx, by); ctx.lineTo(bx + 4, by - flap);
      ctx.stroke();
    }
  }
}

export function drawLuciernagas(t) {
  const f = faseDia();
  if (!f.noche) return;
  // luciérnagas en el cinturón verde (anillo perimetral de césped)
  const spots = [];
  for (let i = 0; i < 16; i++) {
    const a = i * 2.39 + t * 0.12;                       // ángulo deriva lenta
    const ring = i < 8 ? 2.2 : 37;                        // radio norte/sur
    const px = 2 + (i % 4) * 11 + (i * 37 % 7);
    const py = i < 8 ? 1.2 + (i % 3) * 1.1 + Math.sin(a) * 0.8 : 37.4 + (i % 3) * 1.1 + Math.cos(a) * 0.8;
    spots.push([px + Math.sin(t * 1.4 + i * 2) * 1.4, py + Math.cos(t * 1.1 + i) * 0.8]);
  }
  for (let i = 0; i < spots.length; i++) {
    const w = P(spots[i][0], spots[i][1]);
    const pulse = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7);
    ctx.fillStyle = `rgba(190,255,150,${0.35 + pulse * 0.55})`;
    ctx.shadowColor = '#b8ff8a'; ctx.shadowBlur = 5;
    ctx.fillRect(w.x - 1, w.y - 10, 1.8, 1.8);
    ctx.shadowBlur = 0;
  }
}

// tinte de pantalla según la hora (se aplica en espacio de pantalla)
// dentro de interiores la noche es más suave: hay luces encendidas
export function drawAmbiente(esInterior = false) {
  const f = faseDia();
  if (esInterior) {
    if (f.noche) {
      ctx.fillStyle = 'rgba(40,50,92,0.16)';
      ctx.fillRect(0, 0, VW, VH);
    } else if (f.tint) {
      ctx.fillStyle = f.tint;
      ctx.fillRect(0, 0, VW, VH);
    }
    return;
  }
  if (f.tint) {
    ctx.fillStyle = f.tint;
    ctx.fillRect(0, 0, VW, VH);
  }
  if (f.noche) {
    // viñeta azulada nocturna (suave: nunca negra total)
    const g = ctx.createRadialGradient(VW / 2, VH / 2, VH * 0.34, VW / 2, VH / 2, VW * 0.72);
    g.addColorStop(0, 'rgba(10,20,52,0)');
    g.addColorStop(1, 'rgba(10,20,52,0.34)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);
  }
}
