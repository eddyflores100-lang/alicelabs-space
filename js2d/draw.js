// ============================================================
// ALICE CITY v5 — RENDER PIXEL-ART (mundo: azulejos, props,
// edificios con ventanas, letreros de neón, mobiliario)
// ============================================================
import { TW, TH, isoX, isoY, hash2, ctx } from './engine.js';
import { MAPC, MAPR, T, tile, buildings, props, lightsPos, ROADC, ROADR } from './city.js';
import { lightPhase } from './city.js';

const P = (gx, gy) => ({ x: isoX(gx, gy), y: isoY(gx, gy) });

function diamond(gx, gy, fill, stroke) {
  const n = P(gx, gy), e = P(gx + 1, gy), s = P(gx + 1, gy + 1), w = P(gx, gy + 1);
  ctx.beginPath();
  ctx.moveTo(n.x, n.y); ctx.lineTo(e.x, e.y); ctx.lineTo(s.x, s.y); ctx.lineTo(w.x, w.y);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
}

// ---------- SUELO ----------
export function drawGround(t) {
  for (let gy = 0; gy < MAPR; gy++) {
    for (let gx = 0; gx < MAPC; gx++) {
      const tt = tile[gy * MAPC + gx];
      const n = P(gx, gy), e = P(gx + 1, gy), s = P(gx + 1, gy + 1), w = P(gx, gy + 1);
      const h = hash2(gx, gy);
      switch (tt) {
        case T.GRASS:
          diamond(gx, gy, '#12271c');
          if (h > 0.5) ctx.fillStyle = '#1a3a28', ctx.fillRect(n.x - 2 + h * 6, n.y + 5 + h * 4, 2, 1);
          if (h > 0.93) ctx.fillStyle = '#3ddc84', ctx.fillRect(n.x + 4, n.y + 8, 1, 1);
          break;
        case T.ROAD: {
          diamond(gx, gy, '#191d2e');
          // línea central de carril (amarilla tenue) entre pares
          const e = P(gx + 1, gy), s = P(gx + 1, gy + 1), w = P(gx, gy + 1);
          ctx.strokeStyle = 'rgba(232,193,77,0.55)'; ctx.lineWidth = 1;
          const dashV = ROADC.includes(gx) && tile[gy * MAPC + gx + 1] !== undefined;
          const dashH = ROADR.includes(gy);
          ctx.beginPath();
          if (dashV && (gy + gx) % 3 !== 2) { // segmento sobre borde E (frontera de carriles)
            ctx.moveTo(n.x + 6, n.y + 3); ctx.lineTo(n.x + 12, n.y + 6);
          } else if (dashH && (gx + gy) % 3 !== 2) { // borde S
            ctx.moveTo(w.x + 10, w.y + 5); ctx.lineTo(w.x + 14, w.y + 7);
          }
          ctx.stroke();
          break;
        }
        case T.SIDE:
          diamond(gx, gy, '#3d4666');
          // canto iluminado hacia la calle
          ctx.strokeStyle = '#4d5878'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(e.x, e.y); ctx.stroke();
          if (h > 0.8) { ctx.strokeStyle = '#33405c'; ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(s.x, s.y); ctx.stroke(); }
          break;
        case T.PLAZA: {
          diamond(gx, gy, (gx + gy) % 2 ? '#2b3050' : '#2e3456');
          if (h > 0.94) { ctx.fillStyle = 'rgba(0,240,255,0.25)'; ctx.fillRect(n.x - 1, n.y + 7, 3, 1); }
          break;
        }
        case T.CROSS: {
          diamond(gx, gy, '#191d2e');
          // cebras
          ctx.strokeStyle = 'rgba(215,225,250,0.5)'; ctx.lineWidth = 2;
          const vert = ROADC.includes(gx);
          ctx.beginPath();
          for (let k = -1; k <= 1; k++) {
            if (vert) { // barra a lo largo de gx, desplazada en gy
              const bx = n.x + k * 5 + 2, by = n.y + k * 2.5 + 2;
              ctx.moveTo(bx, by + 4); ctx.lineTo(bx + 10, by + 9);
            } else {
              const bx = n.x + k * 5 + 2, by = n.y - k * 2.5 + 8;
              ctx.moveTo(bx, by); ctx.lineTo(bx + 10, by - 5);
            }
          }
          ctx.stroke();
          break;
        }
      }
    }
  }
  // valla de neón del perímetro
  const c0 = P(0, 0), c1 = P(MAPC, 0), c2 = P(MAPC, MAPR), c3 = P(0, MAPR);
  ctx.strokeStyle = 'rgba(0,240,255,0.35)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(c0.x, c0.y); ctx.lineTo(c1.x, c1.y); ctx.lineTo(c2.x, c2.y); ctx.lineTo(c3.x, c3.y); ctx.closePath(); ctx.stroke();
}

// ---------- CAJA ISOMÉTRICA ----------
export function isoBox(gx, gy, w, d, h, pal, line = '#0a0d1a') {
  const N = P(gx, gy), E = P(gx + w, gy), S = P(gx + w, gy + d), W = P(gx, gy + d);
  // cara SO (izquierda, sombra)
  ctx.fillStyle = pal.l;
  ctx.beginPath(); ctx.moveTo(W.x, W.y); ctx.lineTo(S.x, S.y); ctx.lineTo(S.x, S.y - h); ctx.lineTo(W.x, W.y - h); ctx.closePath(); ctx.fill();
  // cara SE (derecha, luz)
  ctx.fillStyle = pal.r;
  ctx.beginPath(); ctx.moveTo(S.x, S.y); ctx.lineTo(E.x, E.y); ctx.lineTo(E.x, E.y - h); ctx.lineTo(S.x, S.y - h); ctx.closePath(); ctx.fill();
  // techo
  ctx.fillStyle = pal.t;
  ctx.beginPath(); ctx.moveTo(N.x, N.y - h); ctx.lineTo(E.x, E.y - h); ctx.lineTo(S.x, S.y - h); ctx.lineTo(W.x, W.y - h); ctx.closePath(); ctx.fill();
  // contorno
  ctx.strokeStyle = line; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(N.x, N.y - h); ctx.lineTo(E.x, E.y - h); ctx.lineTo(S.x, S.y - h); ctx.lineTo(W.x, W.y - h); ctx.closePath();
  ctx.moveTo(W.x, W.y); ctx.lineTo(W.x, W.y - h); ctx.moveTo(S.x, S.y); ctx.lineTo(S.x, S.y - h); ctx.moveTo(E.x, E.y); ctx.lineTo(E.x, E.y - h);
  ctx.stroke();
}

// ---------- EDIFICIOS ----------
const ESTILOS = [
  { l: '#141a33', r: '#1b2242', t: '#232b52' },
  { l: '#101a2b', r: '#16233c', t: '#1e3050' },
  { l: '#1a1230', r: '#221a42', t: '#2c2456' },
  { l: '#161821', r: '#1e2130', t: '#282c42' },
  { l: '#20142a', r: '#291c38', t: '#352748' },
  { l: '#2b1d14', r: '#3a2a1c', t: '#4a3624' },   // casas del cinturón
  { l: '#0e2a30', r: '#123840', t: '#1a4a54' }    // apartamento del operador
];

export function drawBuilding(b, t) {
  const pal = ESTILOS[b.estilo % ESTILOS.length];
  const E = P(b.gx + b.w, b.gy), S = P(b.gx + b.w, b.gy + b.d), W = P(b.gx, b.gy + b.d);
  isoBox(b.gx, b.gy, b.w, b.d, b.h, pal);

  // ventanas cara SE (eje = dirección +gy)
  const rnd = mulberry32x(b.seed);
  const cols = b.d * 2, floors = Math.floor((b.h - 18) / 9);
  for (let j = 0; j < cols; j++) {
    const gpos = b.gy + (j + 0.5) * (b.d / cols);
    const base = P(b.gx + b.w, gpos);
    for (let i = 0; i < floors; i++) {
      const wy = base.y - b.h + 8 + i * 9;
      const r = rnd();
      if (r < 0.42) continue; // ventana apagada
      const flick = hash2(b.seed + j * 17, i * 7 + Math.floor(t * 0.7)) > 0.985;
      ctx.fillStyle = flick ? '#ffffff' : (r < 0.72 ? '#ffd97a' : (r < 0.9 ? '#7ae7ff' : '#b8ff7a'));
      ctx.globalAlpha = flick ? 0.9 : 0.85;
      ctx.fillRect(base.x - 1, wy, 4, 5);
      ctx.globalAlpha = 1;
    }
  }
  // ventanas cara SO (más tenues)
  const cols2 = b.w * 2;
  for (let j = 0; j < cols2; j++) {
    const gpos = b.gx + (j + 0.5) * (b.w / cols2);
    const base = P(gpos, b.gy + b.d);
    for (let i = 0; i < Math.floor(floors * 0.7); i++) {
      if (rnd() < 0.6) continue;
      ctx.fillStyle = '#8a7a4a';
      ctx.fillRect(base.x - 2, base.y - b.h + 10 + i * 9, 3, 4);
    }
  }
  // líneas de piso
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  for (let i = 1; i < floors; i++) {
    const y = S.y - b.h + 8 + i * 9;
    ctx.beginPath(); ctx.moveTo(W.x, W.y - b.h + 8 + i * 9); ctx.lineTo(S.x, y); ctx.lineTo(E.x, E.y - b.h + 8 + i * 9); ctx.stroke();
  }

  // letrero de neón en cara SE
  const txt = b.sign;
  ctx.font = 'bold 8px monospace';
  const tw = ctx.measureText(txt).width;
  const cx = (S.x + E.x) / 2, cyTop = S.y - b.h + 4;
  ctx.fillStyle = 'rgba(6,8,18,0.92)';
  ctx.fillRect(cx - tw / 2 - 4, cyTop, tw + 8, 12);
  ctx.strokeStyle = b.color; ctx.lineWidth = 1;
  ctx.strokeRect(cx - tw / 2 - 4 + 0.5, cyTop + 0.5, tw + 7, 11);
  const pulse = 0.65 + 0.35 * Math.sin(t * 2.4 + b.seed);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = b.color;
  ctx.shadowColor = b.color; ctx.shadowBlur = 6;
  ctx.fillText(txt, cx - tw / 2, cyTop + 9);
  ctx.shadowBlur = 0; ctx.globalAlpha = 1;

  // puerta (cara SE, base)
  const dgx = b.gx + b.w, dgy = b.gy + b.d / 2;
  const dp = P(dgx, dgy);
  ctx.fillStyle = '#0a0d1a';
  ctx.fillRect(dp.x - 4, dp.y - 11, 8, 11);
  const doorPulse = 0.5 + 0.5 * Math.sin(t * 3 + b.seed);
  ctx.strokeStyle = b.color; ctx.globalAlpha = 0.4 + 0.5 * doorPulse;
  ctx.strokeRect(dp.x - 4.5, dp.y - 11.5, 9, 11);
  ctx.globalAlpha = 1;

  // azotea: parapeto + AC + antena
  const N = P(b.gx, b.gy);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath(); ctx.moveTo(N.x, N.y - b.h); ctx.lineTo(E.x, E.y - b.h); ctx.lineTo(S.x, S.y - b.h); ctx.lineTo(W.x, W.y - b.h); ctx.closePath(); ctx.stroke();
  if (b.h > 40) {
    const acx = P(b.gx + 0.5, b.gy + 0.5);
    ctx.fillStyle = '#2a3050'; ctx.fillRect(acx.x - 3, acx.y - b.h - 5, 6, 5);
    ctx.fillStyle = '#1a1f38'; ctx.fillRect(acx.x - 3, acx.y - b.h - 5, 6, 1);
  }
  // antena con luz roja intermitente
  const anx = P(b.gx + b.w * 0.3, b.gy + b.d * 0.3);
  ctx.strokeStyle = '#39406a'; ctx.beginPath(); ctx.moveTo(anx.x, anx.y - b.h); ctx.lineTo(anx.x, anx.y - b.h - 12); ctx.stroke();
  if (Math.sin(t * 4 + b.seed) > 0) {
    ctx.fillStyle = '#ff4455'; ctx.shadowColor = '#ff4455'; ctx.shadowBlur = 4;
    ctx.fillRect(anx.x - 1, anx.y - b.h - 14, 2, 2);
    ctx.shadowBlur = 0;
  }
  // Torre Alice: aguja + baliza orbital
  if (b.sign === 'ALICE') {
    const sx = (N.x + S.x) / 2, sy = (N.y + S.y) / 2 - b.h;
    ctx.strokeStyle = '#3a4a80'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx, sy - 16); ctx.stroke(); ctx.lineWidth = 1;
    const oa = t * 2.2;
    ctx.fillStyle = '#00f0ff'; ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 5;
    ctx.fillRect(sx + Math.cos(oa) * 5 - 1, sy - 18 + Math.sin(oa) * 2, 2, 2);
    ctx.shadowBlur = 0;
  }
}
function mulberry32x(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ---------- PROPS ----------
export function drawProp(p, t) {
  const g = P(p.gx, p.gy);
  const gx = g.x, gy = g.y;
  switch (p.tipo) {
    case 'farola': {
      ctx.fillStyle = 'rgba(140,210,255,0.10)';
      ctx.beginPath(); ctx.ellipse(gx, gy + 2, 15, 7, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#232a44'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy - 22); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = '#2c3554'; ctx.fillRect(gx - 3, gy - 26, 6, 4);
      ctx.fillStyle = '#cfe9ff'; ctx.shadowColor = '#9fd8ff'; ctx.shadowBlur = 5;
      ctx.fillRect(gx - 2, gy - 24, 4, 2);
      ctx.shadowBlur = 0;
      break;
    }
    case 'banco': {
      const d = p.data && p.data.dir ? 1 : 0;
      ctx.fillStyle = '#4a3320';
      if (!d) ctx.fillRect(gx - 7, gy - 7, 14, 3); else ctx.fillRect(gx - 2, gy - 8, 3, 13);
      ctx.fillStyle = '#6b4a2f';
      if (!d) ctx.fillRect(gx - 7, gy - 5, 14, 4); else ctx.fillRect(gx - 1, gy - 5, 3, 10);
      ctx.fillStyle = '#2c2013';
      if (!d) { ctx.fillRect(gx - 6, gy - 1, 2, 2); ctx.fillRect(gx + 4, gy - 1, 2, 2); }
      else { ctx.fillRect(gx - 1, gy + 3, 2, 2); ctx.fillRect(gx + 0, gy - 4, 2, 2); }
      break;
    }
    case 'papelera':
      ctx.fillStyle = '#1f3328'; ctx.fillRect(gx - 3, gy - 9, 6, 9);
      ctx.fillStyle = '#2c4a38'; ctx.fillRect(gx - 3, gy - 10, 6, 2);
      ctx.strokeStyle = '#0e1a12'; ctx.strokeRect(gx - 3.5, gy - 10.5, 7, 10);
      break;
    case 'vending': {
      const cols = ['#00b4d8', '#e63946', '#ff9a3d'];
      const c = cols[(p.data && p.data.c || 0) % 3];
      isoBox(p.gx - 0.18, p.gy - 0.18, 0.4, 0.4, 15, { l: '#141826', r: '#1b2136', t: c });
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillRect(gx + 1, gy - 13, 4, 6);
      ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 4;
      ctx.fillRect(gx + 1, gy - 6, 4, 2);
      ctx.shadowBlur = 0;
      break;
    }
    case 'kiosco': {
      isoBox(p.gx - 0.35, p.gy - 0.3, 0.75, 0.6, 14, { l: '#2a2033', r: '#38304a', t: '#443a58' });
      // toldo a rayas
      const aw = [[-10, -20], [10, -20], [14, -14], [-6, -14]];
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 ? '#e63946' : '#f1f0ea';
        ctx.fillRect(gx - 11 + i * 6, gy - 21, 6, 7);
      }
      ctx.fillStyle = '#12101c'; ctx.fillRect(gx - 11, gy - 14, 22, 1);
      ctx.font = 'bold 6px monospace'; ctx.fillStyle = '#ffd97a';
      ctx.fillText(p.data && p.data.c ? 'TACOS' : 'SNACKS', gx - 10, gy - 23);
      break;
    }
    case 'arbol': {
      const big = p.data && p.data.big;
      const hgt = big ? 18 : 12;
      ctx.fillStyle = '#3a2a18'; ctx.fillRect(gx - 1, gy - hgt * 0.4, 2, hgt * 0.4);
      ctx.fillStyle = '#1d4a30';
      ctx.beginPath(); ctx.ellipse(gx, gy - hgt * 0.55, big ? 9 : 6, big ? 7 : 5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#2a6a42';
      ctx.beginPath(); ctx.ellipse(gx - 2, gy - hgt * 0.65, big ? 5 : 3.5, big ? 4 : 3, 0, 0, 7); ctx.fill();
      break;
    }
    case 'fuente': {
      // pileta 2x2
      const c = P(p.gx - 1, p.gy - 1), e2 = P(p.gx + 1, p.gy - 1), s2 = P(p.gx + 1, p.gy + 1), w2 = P(p.gx - 1, p.gy + 1);
      ctx.fillStyle = '#3a415f';
      ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(e2.x, e2.y); ctx.lineTo(s2.x, s2.y); ctx.lineTo(w2.x, w2.y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#57628f'; ctx.stroke();
      // agua animada
      const w1 = P(p.gx - 0.55, p.gy - 0.55), e1 = P(p.gx + 0.55, p.gy - 0.55), s1 = P(p.gx + 0.55, p.gy + 0.55), ww = P(p.gx - 0.55, p.gy + 0.55);
      ctx.fillStyle = 'rgba(0,170,220,0.5)';
      ctx.beginPath(); ctx.moveTo(w1.x, w1.y); ctx.lineTo(e1.x, e1.y); ctx.lineTo(s1.x, s1.y); ctx.lineTo(ww.x, ww.y); ctx.closePath(); ctx.fill();
      // ondas
      const ph = (t * 1.4) % 1;
      ctx.strokeStyle = `rgba(160,240,255,${0.5 - ph * 0.5})`;
      const r0 = 0.2 + ph * 0.5;
      const a1 = P(p.gx - r0, p.gy - r0), b1 = P(p.gx + r0, p.gy - r0), c1 = P(p.gx + r0, p.gy + r0), d1 = P(p.gx - r0, p.gy + r0);
      ctx.beginPath(); ctx.moveTo(a1.x, a1.y); ctx.lineTo(b1.x, b1.y); ctx.lineTo(c1.x, c1.y); ctx.lineTo(d1.x, d1.y); ctx.closePath(); ctx.stroke();
      // chorro central
      const ctr = P(p.gx, p.gy);
      ctx.fillStyle = '#bfefff';
      ctx.fillRect(ctr.x - 1, ctr.y - 10, 2, 10);
      for (let i = 0; i < 4; i++) {
        const dy = ((t * 30 + i * 7) % 12);
        ctx.fillRect(ctr.x - 3 + (i % 2) * 5, ctr.y - 12 + dy, 1, 1);
      }
      break;
    }
    case 'valla': {
      const msgs = ['ALICOINS', 'x402 SOON', 'AGENTES +', 'ALICELABS', 'SOLANA', 'v5 PIXEL'];
      const cols = ['#00f0ff', '#39ff88', '#ff2fb3', '#ffd97a', '#7a9bff', '#ff9a3d'];
      const i = (p.data && p.data.msg || 0) % 6;
      const mi = (i + Math.floor(t / 6)) % 6;
      ctx.strokeStyle = '#232a44'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(gx - 9, gy); ctx.lineTo(gx - 9, gy - 16); ctx.moveTo(gx + 9, gy); ctx.lineTo(gx + 9, gy - 16); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = '#0b0e1c'; ctx.fillRect(gx - 16, gy - 34, 32, 18);
      ctx.strokeStyle = cols[mi]; ctx.strokeRect(gx - 15.5, gy - 33.5, 31, 17);
      ctx.font = 'bold 7px monospace'; ctx.textAlign = 'center';
      const pulse = 0.6 + 0.4 * Math.sin(t * 3 + i);
      ctx.globalAlpha = pulse; ctx.fillStyle = cols[mi];
      ctx.shadowColor = cols[mi]; ctx.shadowBlur = 5;
      ctx.fillText(msgs[mi], gx, gy - 22);
      ctx.shadowBlur = 0; ctx.globalAlpha = 1; ctx.textAlign = 'left';
      break;
    }
    case 'taxi':
      drawCarBody(p.gx, p.gy, 0, '#ffd23f', t, true);
      break;
  }
}

// semáforos
export function drawLights(t) {
  const ph = lightPhase(t);
  for (const l of lightsPos) {
    const g = P(l.gx, l.gy);
    ctx.strokeStyle = '#232a44'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(g.x, g.y - 20); ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fillStyle = '#10131f'; ctx.fillRect(g.x - 2.5, g.y - 28, 5, 9);
    const st = ph[l.axis];
    const colors = ['#ff4455', '#ffd23f', '#39ff88'];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = st === i ? colors[i] : '#262b3d';
      if (st === i) { ctx.shadowColor = colors[i]; ctx.shadowBlur = 4; }
      ctx.fillRect(g.x - 1.5, g.y - 27 + i * 3, 3, 2);
      ctx.shadowBlur = 0;
    }
  }
}

// cuerpo de auto (usado por coches y taxi estacionado)
export function drawCarBody(gx, gy, dir, color, t, parked = false) {
  // dir: 0=+gx(SE abajo-derecha) 1=+gy(SO abajo-izq) 2=-gx(NO arriba-izq) 3=-gy(NE arriba-der)
  // dibujamos como caja iso alineada al eje de marcha
  const L = 0.95, Wd = 0.42;
  let w, d, offx = 0, offy = 0;
  if (dir === 0 || dir === 2) { w = L; d = Wd; offy = -Wd / 2; }
  else { w = Wd; d = L; offx = -Wd / 2; }
  const bx = gx + offx - (w / 2 - (dir === 0 || dir === 2 ? 0 : Wd / 2));
  const by = gy + offy - (d / 2 - (dir === 0 || dir === 2 ? Wd / 2 : 0));
  // sombra
  const S = P(gx, gy);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(S.x, S.y + 1, 12, 5, 0, 0, 7); ctx.fill();
  // carrocería
  isoBox(bx, by, w, d, 5, { l: shade(color, 0.55), r: color, t: shade(color, 0.8) });
  // cabina
  const cbx = bx + (dir === 0 || dir === 2 ? w * 0.3 : 0.05);
  const cby = by + (dir === 0 || dir === 2 ? 0.05 : d * 0.3);
  isoBox(cbx, cby, dir === 0 || dir === 2 ? w * 0.4 : w - 0.1, dir === 0 || dir === 2 ? d - 0.1 : d * 0.4, 4, { l: '#10131f', r: '#1a2030', t: '#7ac7ff' });
  if (!parked) {
    // faros y luces traseras según dirección
    const front = dir === 0 ? P(bx + w, by + d) : dir === 1 ? P(bx, by + d) : dir === 2 ? P(bx, by) : P(bx + w, by);
    ctx.fillStyle = '#fffbe0'; ctx.shadowColor = '#fff2a8'; ctx.shadowBlur = 5;
    ctx.fillRect(front.x - 2, front.y - 3, 2, 2);
    ctx.shadowBlur = 0;
  }
}
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 255) * f) | 0, g2 = Math.min(255, ((n >> 8) & 255) * f) | 0, b2 = Math.min(255, (n & 255) * f) | 0;
  return `rgb(${r},${g2},${b2})`;
}
