// ============================================================
// ALICE CITY v5 — HQ TORRE ALICE (interior)
// Server Room · Sala Ops · Conferencia · Lounge
// Agentes SENTADOS en sillas de sus escritorios.
// ============================================================
import { G, isoX, isoY, hash2 } from './engine.js';
import { isoBox } from './draw.js';
import { NPC, drawSeated } from './agents.js';

export const IC = 16, IR = 12;
// suelos: 0 madera · 1 alfombra azul · 2 alfombra verde · 3 damero · 4 mármol · 5 pared · 6 tapete salida
export const itile = new Uint8Array(IC * IR);
export const isolid = new Uint8Array(IC * IR);

export const iprops = [];   // {tipo, gx, gy, data}
export const inpcs = [];
export const racks = [];    // {gx, gy, done}

const iidx = (x, y) => y * IC + x;
const isolidAt = (x, y) => x < 0 || y < 0 || x >= IC || y >= IR || isolid[iidx(x, y)] === 1;
export { isolidAt };

function iprop(tipo, gx, gy, solido = true, data = null) {
  iprops.push({ tipo, gx, gy, data });
  if (solido) isolid[iidx(Math.floor(gx), Math.floor(gy))] = 1;
}

export function buildInterior() {
  itile.fill(0); // madera base
  isolid.fill(0);

  // paredes perimetrales norte y oeste/este (el sur abierto hacia salida)
  for (let x = 0; x < IC; x++) { itile[iidx(x, 0)] = 5; isolid[iidx(x, 0)] = 1; }
  for (let y = 0; y < IR; y++) { itile[iidx(0, y)] = 5; isolid[iidx(0, y)] = 1; itile[iidx(IC - 1, y)] = 5; isolid[iidx(IC - 1, y)] = 1; }

  // ---- SERVER ROOM (verde) cols 1-4, rows 1-4 ----
  for (let y = 1; y <= 4; y++) for (let x = 1; x <= 4; x++) itile[iidx(x, y)] = 2;
  const rackPos = [[1.5, 1.5], [2.5, 1.5], [3.5, 1.5], [1.5, 3.5], [2.5, 3.5], [3.5, 3.5]];
  for (const r of rackPos) {
    iprop('rack', r[0], r[1], true);
    racks.push({ gx: r[0], gy: r[1] + 0.75, done: false });   // punto de interacción frente al rack
  }

  // ---- SALA OPS (azul) cols 6-14 rows 1-3 ----
  for (let y = 1; y <= 3; y++) for (let x = 6; x <= 14; x++) itile[iidx(x, y)] = 1;
  const desks = [[7, 2], [9, 2], [11, 2], [13, 2]];
  for (const d of desks) iprop('desk', d[0], d[1], true);

  // ---- CONFERENCIA (madera) cols 6-10 rows 5-7 ----
  for (let y = 5; y <= 7; y++) for (let x = 6; x <= 10; x++) itile[iidx(x, y)] = 0;
  iprop('mesa', 8, 6, true, { w: 2.4, d: 0.9 });
  iprop('pizarra', 8, 0.9, false); // sobre pared norte

  // ---- LOUNGE (damero) cols 12-14 rows 5-7 ----
  for (let y = 5; y <= 7; y++) for (let x = 12; x <= 14; x++) itile[iidx(x, y)] = 3;
  iprop('sofa', 13, 5.2, true);
  iprop('cafe', 14.5, 5.3, true);
  iprop('refri', 12.3, 5.3, true);
  iprop('mesita', 13, 6.4, true);

  // ---- RECEPCIÓN / HALL (mármol) cols 5-10 rows 8-10 ----
  for (let y = 8; y <= 10; y++) for (let x = 4; x <= 11; x++) itile[iidx(x, y)] = 4;
  iprop('recep', 6.5, 9, true);

  // tapete de salida
  itile[iidx(8, 11)] = 6; itile[iidx(7, 11)] = 6;

  // plantas decorativas
  iprop('planta', 5.3, 0.9, true); iprop('planta', 14.6, 0.9, true);
  iprop('planta', 11.3, 7.6, true); iprop('planta', 4.3, 7.6, true);

  // reloj de pared
  iprop('reloj', 11.5, 0.9, false);

  // ---- NPCs del HQ (sentados en sus puestos) ----
  const P = (x, y) => ({ x: isoX(x, y), y: isoY(x, y) });
  const base = { seed: 3, sentado: true, estatico: true };
  inpcs.push(new NPC({ ...base, name: 'Kai', gx: 7, gy: 1.55, pal: { skin: '#e8b88a', hair: '#151824', jacket: '#2a7a6a', pants: '#20263c' }, colorTag: '#39ff88' }));
  inpcs.push(new NPC({ ...base, name: 'Mia', gx: 9, gy: 1.55, pal: { skin: '#f0c9a0', hair: '#5a3a1a', jacket: '#8a3a5a', pants: '#1e2130' }, colorTag: '#ff2fb3' }));
  inpcs.push(new NPC({ ...base, name: 'Dot', gx: 11, gy: 1.55, pal: { skin: '#c98d5e', hair: '#0f0f1a', jacket: '#3a4a9a', pants: '#1a1d2c' }, colorTag: '#7ae7ff' }));
  inpcs.push(new NPC({ ...base, name: 'Jefa Vega', gx: 8, gy: 5.45, questId: 'P6', pal: { skin: '#e8b88a', hair: '#2c2c3c', jacket: '#4a5a8a', pants: '#23263a' }, colorTag: '#00f0ff' }));
  inpcs.push(new NPC({ ...base, name: 'Ada', gx: 6.5, gy: 9.75, estatico: true, questId: 'P7', pal: { skin: '#d9a06b', hair: '#b03a2a', jacket: '#7a6a2a', pants: '#26202e' }, colorTag: '#ffd23f' }));
  // técnico caminando por el server room
  inpcs.push(new NPC({
    name: 'Leo', gx: 1.5, gy: 4.5, speed: 0.8, seed: 8,
    pal: { skin: '#e8b88a', hair: '#2c2c3c', jacket: '#6a3a8a', pants: '#232630' }, colorTag: '#c17aff',
    path: [[1.5, 4.5], [3.5, 4.5], [3.5, 2.5], [1.5, 2.5]]
  }));
}

// ---------- RENDER ----------
const P = (gx, gy) => ({ x: isoX(gx, gy), y: isoY(gx, gy) });

export function drawInteriorGround() {
  const cols = ['#8a6242', '#33619a', '#256048', '#262a3a', '#5a6478', '#151824', '#2a3050'];
  for (let y = 0; y < IR; y++) {
    for (let x = 0; x < IC; x++) {
      const tt = itile[iidx(x, y)];
      const n = P(x, y);
      const h = hash2(x + 40, y + 40);
      if (tt === 5) continue; // pared se dibuja como objeto
      let fill = cols[tt] || '#333';
      if (tt === 3 && (x + y) % 2) fill = '#e8e8f0';
      if (tt === 3 && (x + y) % 2 === 0) fill = '#14161f';
      ctx2.fillStyle = fill;
      dia(x, y);
      if (tt === 4 && h > 0.7) { ctx2.strokeStyle = 'rgba(255,255,255,0.06)'; ctx2.stroke(); }
      if (tt === 6) {
        ctx2.fillStyle = `rgba(0,240,255,${0.4 + 0.3 * Math.sin(performance.now() / 300)})`;
        ctx2.fill();
      }
    }
  }
}
// contexto: importado diferido para evitar ciclo con draw.js
import { ctx as ctx2 } from './engine.js';
import { TW, TH } from './engine.js';
function dia(gx, gy) {
  const n = P(gx, gy), e = P(gx + 1, gy), s = P(gx + 1, gy + 1), w = P(gx, gy + 1);
  ctx2.beginPath();
  ctx2.moveTo(n.x, n.y); ctx2.lineTo(e.x, e.y); ctx2.lineTo(s.x, s.y); ctx2.lineTo(w.x, w.y);
  ctx2.closePath();
}

export function drawWallTile(x, y) {
  const n = P(x, y), e = P(x + 1, y), s = P(x + 1, y + 1), w = P(x, y + 1);
  const H = 34;
  ctx2.fillStyle = '#232b46';
  ctx2.beginPath(); ctx2.moveTo(w.x, w.y); ctx2.lineTo(s.x, s.y); ctx2.lineTo(s.x, s.y - H); ctx2.lineTo(w.x, w.y - H); ctx2.closePath(); ctx2.fill();
  ctx2.fillStyle = '#2c3554';
  ctx2.beginPath(); ctx2.moveTo(s.x, s.y); ctx2.lineTo(e.x, e.y); ctx2.lineTo(e.x, e.y - H); ctx2.lineTo(s.x, s.y - H); ctx2.closePath(); ctx2.fill();
  ctx2.fillStyle = '#39466e';
  ctx2.beginPath(); ctx2.moveTo(n.x, n.y - H); ctx2.lineTo(e.x, e.y - H); ctx2.lineTo(s.x, s.y - H); ctx2.lineTo(w.x, w.y - H); ctx2.closePath(); ctx2.fill();
  ctx2.strokeStyle = '#10131f'; ctx2.lineWidth = 1; ctx2.stroke();
  // zócalo neón
  ctx2.strokeStyle = 'rgba(0,240,255,0.25)';
  ctx2.beginPath(); ctx2.moveTo(w.x, w.y - 4); ctx2.lineTo(s.x, s.y - 4); ctx2.lineTo(e.x, e.y - 4); ctx2.stroke();
}

export function drawIProp(p, t) {
  const g = P(p.gx, p.gy);
  const x = g.x, y = g.y;
  switch (p.tipo) {
    case 'rack': {
      isoBox(p.gx - 0.35, p.gy - 0.3, 0.7, 0.6, 26, { l: '#141826', r: '#1b2136', t: '#2c3554' });
      // LEDs parpadeantes
      const rk = racks.find(r => Math.abs(r.gx - p.gx) < 0.1 && Math.abs(r.gy - 0.75 - p.gy) < 0.2);
      const done = rk && rk.done;
      for (let i = 0; i < 6; i++) {
        const on = done ? (hash2(i, Math.floor(t * 2)) > 0.2) : (hash2(i * 3, Math.floor(t * 5)) > 0.45);
        ctx2.fillStyle = done ? '#39ff88' : (on ? '#ffd97a' : '#262b3d');
        ctx2.fillRect(x - 3, y - 24 + i * 4, 6, 2);
      }
      if (done) { ctx2.fillStyle = '#39ff88'; ctx2.font = 'bold 6px monospace'; ctx2.textAlign = 'center'; ctx2.fillText('OK', x, y - 30); ctx2.textAlign = 'left'; }
      break;
    }
    case 'desk': {
      isoBox(p.gx - 0.4, p.gy - 0.28, 0.8, 0.55, 13, { l: '#4a3320', r: '#5c4128', t: '#6b4a2f' });
      // monitor
      isoBox(p.gx - 0.12, p.gy - 0.22, 0.3, 0.08, 20, { l: '#10131f', r: '#10131f', t: '#7ac7ff' });
      ctx2.fillStyle = `rgba(0,200,255,${0.5 + 0.2 * Math.sin(t * 3 + p.gx)})`;
      ctx2.fillRect(x - 4, y - 22, 9, 6);
      // silla (vacía detrás)
      ctx2.fillStyle = '#20263c';
      ctx2.fillRect(x - 5, y + 2, 9, 2);
      break;
    }
    case 'mesa':
      isoBox(p.gx - p.data.w / 2, p.gy - p.data.d / 2, p.data.w, p.data.d, 11, { l: '#2c2013', r: '#3a2a18', t: '#4a3320' });
      // laptops encima
      for (let i = 0; i < 3; i++) {
        ctx2.fillStyle = '#10131f';
        ctx2.fillRect(x - 14 + i * 11, y - 18, 7, 4);
        ctx2.fillStyle = 'rgba(0,240,255,0.6)';
        ctx2.fillRect(x - 13 + i * 11, y - 17, 5, 2);
      }
      break;
    case 'pizarra': {
      ctx2.fillStyle = '#e8e8f0';
      ctx2.fillRect(x - 16, y - 44, 32, 16);
      ctx2.strokeStyle = '#8a8a9a'; ctx2.strokeRect(x - 16, y - 44, 32, 16);
      ctx2.strokeStyle = '#c0392b'; ctx2.lineWidth = 1;
      ctx2.beginPath(); ctx2.moveTo(x - 12, y - 32); ctx2.lineTo(x + 4, y - 38); ctx2.stroke();
      ctx2.strokeStyle = '#2980b9';
      ctx2.beginPath(); ctx2.moveTo(x - 12, y - 36); ctx2.lineTo(x + 8, y - 33); ctx2.stroke();
      ctx2.lineWidth = 1;
      break;
    }
    case 'sofa':
      isoBox(p.gx - 0.5, p.gy - 0.25, 1.0, 0.5, 9, { l: '#5a1f2a', r: '#7a2a38', t: '#9a3648' });
      isoBox(p.gx - 0.5, p.gy - 0.42, 1.0, 0.18, 15, { l: '#4a1a24', r: '#6a2430', t: '#8a3040' });
      break;
    case 'cafe':
      isoBox(p.gx - 0.15, p.gy - 0.15, 0.35, 0.3, 17, { l: '#1a1d30', r: '#23263c', t: '#2c3050' });
      ctx2.fillStyle = '#ff9a3d'; ctx2.fillRect(x + 1, y - 13, 3, 2);
      break;
    case 'refri':
      isoBox(p.gx - 0.2, p.gy - 0.2, 0.4, 0.35, 22, { l: '#8a8f9f', r: '#aab0bf', t: '#c8cdd8' });
      ctx2.strokeStyle = '#5a6070'; ctx2.beginPath(); ctx2.moveTo(x + 2, y - 16); ctx2.lineTo(x + 2, y - 4); ctx2.stroke();
      break;
    case 'mesita':
      isoBox(p.gx - 0.25, p.gy - 0.25, 0.5, 0.5, 8, { l: '#3a2a18', r: '#4a3320', t: '#5c4128' });
      break;
    case 'recep':
      isoBox(p.gx - 0.6, p.gy - 0.25, 1.2, 0.5, 12, { l: '#1a2036', r: '#232a46', t: '#2c3554' });
      ctx2.fillStyle = '#00f0ff'; ctx2.font = 'bold 6px monospace'; ctx2.textAlign = 'center';
      ctx2.fillText('RECEPCIÓN', x, y - 16);
      ctx2.textAlign = 'left';
      break;
    case 'planta': {
      ctx2.fillStyle = '#5c4128'; ctx2.fillRect(x - 3, y - 7, 6, 7);
      ctx2.fillStyle = '#1d4a30';
      ctx2.beginPath(); ctx2.ellipse(x, y - 11, 6, 6, 0, 0, 7); ctx2.fill();
      ctx2.fillStyle = '#2a6a42';
      ctx2.beginPath(); ctx2.ellipse(x - 2, y - 13, 3.5, 3, 0, 0, 7); ctx2.fill();
      break;
    }
    case 'reloj': {
      ctx2.fillStyle = '#e8e8f0';
      ctx2.beginPath(); ctx2.arc(x, y - 40, 5, 0, 7); ctx2.fill();
      ctx2.strokeStyle = '#10131f'; ctx2.stroke();
      const hr = (t / 60) % 12 / 12 * 6.28 - 1.57, mn = (t / 5) % 60 / 60 * 6.28 - 1.57;
      ctx2.beginPath(); ctx2.moveTo(x, y - 40); ctx2.lineTo(x + Math.cos(hr) * 2.5, y - 40 + Math.sin(hr) * 2.5); ctx2.stroke();
      ctx2.beginPath(); ctx2.moveTo(x, y - 40); ctx2.lineTo(x + Math.cos(mn) * 4, y - 40 + Math.sin(mn) * 4); ctx2.stroke();
      break;
    }
  }
}

export function drawINpcs(t) {
  const sorted = [...inpcs].sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy));
  for (const a of sorted) {
    const g = P(a.gx, a.gy);
    drawSeated(g.x, g.y, a, t);
  }
}
