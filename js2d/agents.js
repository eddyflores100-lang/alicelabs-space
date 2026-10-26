// ============================================================
// ALICE CITY v8 — AGENTES (player + NPCs)
// Poses correctas: de pie / caminando / sentado EN SILLA.
// HORARIOS DE VIDA: oficina (9-17 dentro del edificio), campo,
// ocio (17-21 paseo) y turno nocturno. Maletines, burbujas y
// presencia con fundido al entrar/salir de edificios.
// ============================================================
import { G, ctx, keys, clamp, dist2, hash2, faseDia } from './engine.js';
import { spots, patrols } from './city.js';
import { blockedAt, nearestFree, getCurrent } from './maps.js';

// ---------- SPRITES ----------
// gato mascota (Gato Bot del apto)
function drawCat(x, y, a, t) {
  const al = a.alpha === undefined ? 1 : a.alpha;
  if (al <= 0.03) return;
  ctx.save();
  ctx.globalAlpha = al;
  const bob = Math.sin(t * 2 + a.seed * 6) * 0.5;
  const baseY = y - bob;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(x, y + 1, 4.5, 1.8, 0, 0, 7); ctx.fill();
  // cola
  ctx.strokeStyle = a.pal.jacket; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x + 4, baseY - 4);
  ctx.quadraticCurveTo(x + 8, baseY - 7 + Math.sin(t * 3) * 2, x + 7, baseY - 11);
  ctx.stroke(); ctx.lineWidth = 1;
  // cuerpo
  ctx.fillStyle = a.pal.jacket;
  ctx.beginPath(); ctx.ellipse(x, baseY - 5, 5, 3.4, 0, 0, 7); ctx.fill();
  // cabeza
  ctx.beginPath(); ctx.ellipse(x - 3.5, baseY - 9, 3.4, 3, 0, 0, 7); ctx.fill();
  // orejas
  ctx.beginPath(); ctx.moveTo(x - 6.5, baseY - 11); ctx.lineTo(x - 5, baseY - 13.5); ctx.lineTo(x - 4, baseY - 11); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 3, baseY - 11.5); ctx.lineTo(x - 1.8, baseY - 13.5); ctx.lineTo(x - 0.8, baseY - 11); ctx.closePath(); ctx.fill();
  // ojos led
  ctx.fillStyle = '#39ff88';
  ctx.fillRect(x - 5, baseY - 9.5, 1.4, 1.4); ctx.fillRect(x - 2.8, baseY - 9.5, 1.4, 1.4);
  if (a.name) {
    ctx.font = '7px monospace'; ctx.textAlign = 'center';
    const w = ctx.measureText(a.name).width + 6;
    ctx.fillStyle = 'rgba(4,6,14,0.75)';
    ctx.fillRect(x - w / 2, baseY - 22, w, 9);
    ctx.fillStyle = a.colorTag || '#ff9a3d';
    ctx.fillText(a.name, x, baseY - 15);
    ctx.textAlign = 'left';
  }
  ctx.restore();
}
// agente de pie/caminando; paleta: {skin, hair, jacket, pants}
export function drawAgent(x, y, a, t, zoom) {
  if (a.gato) return drawCat(x, y, a, t);
  const al = a.alpha === undefined ? 1 : a.alpha;
  if (al <= 0.03) return;
  ctx.save();
  ctx.globalAlpha = al;
  const walk = a.state === 'walk';
  const ph = a.phase;
  const bob = walk ? Math.abs(Math.sin(ph * 8)) * 1.2 : Math.sin(t * 2 + a.seed * 6) * 0.4;
  const legSw = walk ? Math.sin(ph * 8) * 2 : 0;
  // sombra
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(x, y + 1, 5, 2.2, 0, 0, 7); ctx.fill();
  const baseY = y - bob;
  // piernas
  ctx.fillStyle = a.pal.pants;
  ctx.fillRect(x - 3, baseY - 6, 2.5, 6 + legSw * 0.4);
  ctx.fillRect(x + 0.5, baseY - 6, 2.5, 6 - legSw * 0.4);
  // torso (chaqueta) con gradiente vertical para volumen
  const jg = ctx.createLinearGradient(0, baseY - 13, 0, baseY - 5);
  jg.addColorStop(0, shadeCol(a.pal.jacket, 1.22)); jg.addColorStop(1, a.pal.jacket);
  ctx.fillStyle = jg;
  ctx.fillRect(x - 4, baseY - 13, 8, 8);
  // contorno suave del torso (definición)
  ctx.strokeStyle = 'rgba(10,14,28,0.55)'; ctx.lineWidth = 1;
  ctx.strokeRect(x - 4, baseY - 13, 8, 8);
  // detalle chaqueta
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(x - 4, baseY - 13, 8, 1);
  // brazos
  ctx.fillStyle = a.pal.jacket;
  ctx.fillRect(x - 5.5, baseY - 12 + (walk ? legSw * 0.5 : 0), 1.8, 6);
  ctx.fillRect(x + 3.7, baseY - 12 - (walk ? legSw * 0.5 : 0), 1.8, 6);
  // cabeza con leve gradiente de piel
  const sg2 = ctx.createLinearGradient(0, baseY - 19, 0, baseY - 13);
  sg2.addColorStop(0, shadeCol(a.pal.skin, 1.12)); sg2.addColorStop(1, a.pal.skin);
  ctx.fillStyle = sg2;
  ctx.fillRect(x - 3, baseY - 19, 6, 6);
  // pelo / casco
  ctx.fillStyle = a.pal.hair;
  ctx.fillRect(x - 3, baseY - 20, 6, 3);
  // ojos (definición)
  ctx.fillStyle = '#141824';
  ctx.fillRect(x - 1.6, baseY - 16.5, 1.1, 1.3); ctx.fillRect(x + 0.7, baseY - 16.5, 1.1, 1.3);
  // maletín de agente en horario laboral
  if (a.maletin) {
    ctx.fillStyle = '#5c4128';
    ctx.fillRect(x + 4.6, baseY - 8.5 + (walk ? legSw * 0.5 : 0), 3.4, 2.6);
    ctx.fillStyle = '#7a5a38';
    ctx.fillRect(x + 4.6, baseY - 9 + (walk ? legSw * 0.5 : 0), 3.4, 0.8);
  }
  // extras equipados
  if (a.extras) {
    if (a.extras.hat === 'cap') { ctx.fillStyle = a.extras.hatColor; ctx.fillRect(x - 3.5, baseY - 21, 7, 2.5); ctx.fillRect(x - 3.5, baseY - 19, 7, 1.5); }
    if (a.extras.hat === 'visor') { ctx.fillStyle = a.extras.hatColor; ctx.fillRect(x - 3.5, baseY - 21, 7, 2); ctx.fillStyle = 'rgba(0,240,255,0.8)'; ctx.fillRect(x - 2.5, baseY - 18.4, 5, 1.2); }
    if (a.extras.hat === 'helmet') { ctx.fillStyle = a.extras.hatColor; ctx.fillRect(x - 4, baseY - 21.5, 8, 4); ctx.fillRect(x - 4, baseY - 18, 8, 1); }
    if (a.extras.hat === 'crown') { ctx.fillStyle = '#ffd23f'; ctx.fillRect(x - 3.5, baseY - 22, 7, 2); ctx.fillRect(x - 3, baseY - 23.5, 1.5, 2); ctx.fillRect(x - 0.75, baseY - 24, 1.5, 2.5); ctx.fillRect(x + 1.5, baseY - 23.5, 1.5, 2); }
    if (a.extras.badge) { ctx.fillStyle = '#ffd23f'; ctx.shadowColor = '#ffd23f'; ctx.shadowBlur = 4; ctx.fillRect(x - 1.5, baseY - 11, 3, 3); ctx.shadowBlur = 0; }
  }
  // etiqueta de nombre
  if (zoom > 0.8 && a.name) {
    ctx.font = '7px monospace'; ctx.textAlign = 'center';
    const w = ctx.measureText(a.name).width + 6;
    ctx.fillStyle = 'rgba(4,6,14,0.75)';
    ctx.fillRect(x - w / 2, baseY - 31, w, 9);
    ctx.fillStyle = a.colorTag || '#9fd8ff';
    ctx.fillText(a.name, x, baseY - 24);
    ctx.textAlign = 'left';
  }
  // globo de diálogo
  if (a.talk) {
    ctx.font = '7px monospace'; ctx.textAlign = 'center';
    const w = ctx.measureText(a.talk).width + 8;
    ctx.fillStyle = 'rgba(248,250,255,0.96)';
    ctx.fillRect(x - w / 2, baseY - 44, w, 11);
    ctx.strokeStyle = 'rgba(10,14,30,0.4)';
    ctx.strokeRect(x - w / 2 + 0.5, baseY - 43.5, w - 1, 10);
    ctx.fillStyle = '#0a0d1a';
    ctx.fillText(a.talk, x, baseY - 36);
    ctx.beginPath(); ctx.moveTo(x - 3, baseY - 33); ctx.lineTo(x + 3, baseY - 33); ctx.lineTo(x, baseY - 30); ctx.closePath(); ctx.fill();
    ctx.textAlign = 'left';
  }
  ctx.restore();
}
// aclara u oscurece un color hex (para gradientes del sprite)
function shadeCol(hex, f) {
  try {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, ((n >> 16) & 255) * f) | 0, g2 = Math.min(255, ((n >> 8) & 255) * f) | 0, b2 = Math.min(255, (n & 255) * f) | 0;
    return `rgb(${r},${g2},${b2})`;
  } catch (e) { return hex; }
}

// agente SENTADO EN SILLA/ESCRITORIO (pose fija, sin piernas colgando)
export function drawSeated(x, y, a, t) {
  const al = a.alpha === undefined ? 1 : a.alpha;
  if (al <= 0.03) return;
  ctx.save();
  ctx.globalAlpha = al;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(x, y + 1, 5, 2, 0, 0, 7); ctx.fill();
  const bob = Math.sin(t * 1.6 + a.seed * 5) * 0.4;
  const baseY = y - 4 - bob; // levantado: sentado en silla, no en el suelo
  // silla
  ctx.fillStyle = '#20263c';
  ctx.fillRect(x - 4, y - 2, 8, 2);
  ctx.fillRect(x - 4, baseY - 2, 8, 5);
  // torso
  ctx.fillStyle = a.pal.jacket;
  ctx.fillRect(x - 4, baseY - 10, 8, 9);
  // cabeza + pelo
  ctx.fillStyle = a.pal.skin; ctx.fillRect(x - 3, baseY - 16, 6, 6);
  ctx.fillStyle = a.pal.hair; ctx.fillRect(x - 3, baseY - 17, 6, 3);
  if (a.name) {
    ctx.font = '7px monospace'; ctx.textAlign = 'center';
    const w = ctx.measureText(a.name).width + 6;
    ctx.fillStyle = 'rgba(4,6,14,0.75)';
    ctx.fillRect(x - w / 2, baseY - 28, w, 9);
    ctx.fillStyle = a.colorTag || '#9fd8ff';
    ctx.fillText(a.name, x, baseY - 21);
    ctx.textAlign = 'left';
  }
  if (a.talk) {
    ctx.font = '7px monospace'; ctx.textAlign = 'center';
    const w = ctx.measureText(a.talk).width + 8;
    ctx.fillStyle = 'rgba(248,250,255,0.96)';
    ctx.fillRect(x - w / 2, baseY - 41, w, 11);
    ctx.fillStyle = '#0a0d1a'; ctx.fillText(a.talk, x, baseY - 33);
    ctx.textAlign = 'left';
  }
  ctx.restore();
}

// ---------- NPC ----------
const BURBUJAS = {
  manana: ['Al trabajo', 'Buenos días', 'Turno de mañana', '¿Ya café?'],
  tarde: ['Trabajo tranquilo', 'Reporte listo', 'Reunión en 5'],
  ocio: ['¿Vamos al gym?', 'Un café por favor', 'Qué día tan bueno', 'Descanso ganado', 'Al parque un rato'],
  noche: ['Me voy a casa', 'Buenas noches', 'Turno nocturno', 'La ciudad nunca duerme']
};
export class NPC {
  constructor(o) {
    Object.assign(this, {
      gx: 8.5, gy: 10.5, speed: 1.1, state: 'idle', phase: 0,
      seed: Math.random() * 10, name: 'Agent', colorTag: '#9fd8ff',
      pal: { skin: '#e8b88a', hair: '#2c2c3c', jacket: '#4a5a8a', pants: '#23263a' },
      talk: null, questId: null, estatico: false, sentado: false, dir: 0,
      alpha: 1, objetivo: 1, grupo: 'ocio', maletin: false, burbujaT: 0
    }, o);
    this.path = o.path || null;
    this.pi = 0;
  }
  // --- HORARIOS: 7-9 commute · 9-17 trabajo · 17-21 ocio · 21-7 casa ---
  agenda(dt) {
    if (this.estatico || this.sentado) { this.objetivo = 1; this.maletin = false; return; }
    const f = faseDia();
    const h = f.hora + f.min / 60;
    const enTrabajo = h >= 9 && h < 17;
    const enCasa = h >= 21 || h < 7;
    const commute = h >= 7 && h < 9;
    switch (this.grupo) {
      case 'oficina':
        // entra a la oficina en horario laboral; commute con maletín
        this.objetivo = (enTrabajo || enCasa) ? 0 : 1;
        this.maletin = commute || (h >= 17 && h < 18);
        this.speedMult = commute ? 1.4 : 1;
        break;
      case 'campo':
        // agente de campo: reparte todo el día, descansa de noche
        this.objetivo = enCasa ? 0 : 1;
        this.maletin = !enCasa;
        this.speedMult = enTrabajo ? 1.15 : 1;
        break;
      case 'ocio':
        // pasea de día; sale de ocio por la tarde; duerme de noche
        this.objetivo = (h >= 22.5 || h < 8) ? 0 : 1;
        this.speedMult = (h >= 17 && h < 21) ? 0.8 : 1;
        break;
      case 'noche':
        // turno nocturno: trabaja de noche, duerme de día
        this.objetivo = (h >= 7 && h < 20) ? 0 : 1;
        this.maletin = !!(h >= 20 || h < 7);
        this.speedMult = 1;
        break;
      default:
        this.objetivo = 1; this.speedMult = 1;
    }
  }
  update(dt, others) {
    this.agenda(dt);
    // presencia con fundido suave
    this.alpha += (this.objetivo - this.alpha) * Math.min(1, dt * 2.2);
    // totalmente oculto: reaparece en otro punto de su ruta (salió por otra puerta)
    if (this.alpha < 0.05 && this.objetivo === 0 && this.path && this.path.length > 1) {
      const i = Math.floor(hash2(Math.floor(G.tiempo * 3), this.seed * 97) * this.path.length);
      this.gx = this.path[i][0]; this.gy = this.path[i][1];
      this.pi = (i + 1) % this.path.length;
    }
    // burbujas ambientales por horario
    if (this.burbujaT > 0) {
      this.burbujaT -= dt;
      if (this.burbujaT <= 0) this.talk = null;
    } else if (this.alpha > 0.9 && !this.sentado && Math.random() < dt * 0.035) {
      const f = faseDia();
      const pool = f.noche ? BURBUJAS.noche : (f.nombre === 'ATARDECER' || f.hora >= 17 ? BURBUJAS.ocio : (f.hora < 10 ? BURBUJAS.manana : BURBUJAS.tarde));
      this.talk = pool[Math.floor(Math.random() * pool.length)];
      this.burbujaT = 2.4;
    }
    if (this.sentado) return;
    if (this.estatico || !this.path || this.path.length < 2) {
      this.state = 'idle';
      return;
    }
    this.state = 'walk';
    const dirStep = this.reverse ? -1 : 1;
    const pts = this.path;
    const tgt = pts[this.pi];
    const dx = tgt[0] - this.gx, dy = tgt[1] - this.gy;
    const d = Math.hypot(dx, dy);
    if (d < 0.06) {
      this.pi = (this.pi + dirStep + pts.length) % pts.length;
      // pausa corta aleatoria en esquinas
      if (hash2(Math.floor(this.gx * 3), Math.floor(this.gy * 3) + Math.floor(G.tiempo)) > 0.9) this.state = 'idle';
      return;
    }
    const sp = this.speed * (this.speedMult || 1) * dt;
    const nx = this.gx + dx / d * sp, ny = this.gy + dy / d * sp;
    // NUNCA atravesar sólidos (vale para ciudad e interiores)
    if (!blockedAt(nx, ny)) { this.gx = nx; this.gy = ny; }
    else this.pi = (this.pi + dirStep + pts.length) % pts.length;
    this.phase += sp * 3;
    this.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3);
    // separación suave con otros agentes
    for (const o of others) {
      if (o === this || o.sentado) continue;
      if ((o.alpha !== undefined && o.alpha < 0.3)) continue;
      const dd = dist2(this.gx, this.gy, o.gx, o.gy);
      if (dd < 0.14 && dd > 0.0001) {
        const f = 0.4 * dt;
        this.gx += (this.gx - o.gx) / Math.sqrt(dd) * f;
        this.gy += (this.gy - o.gy) / Math.sqrt(dd) * f;
      }
    }
  }
}

// ---------- JUGADOR ----------
export const player = {
  gx: 9.5, gy: 12.6, speed: 2.7, phase: 0, state: 'idle', dir: 0,
  name: 'TÚ-OPERADOR', colorTag: '#00f0ff', seed: 1, talk: null, talkT: 0,
  pal: { skin: '#e8b88a', hair: '#101322', jacket: '#00b4d8', pants: '#1a1d30' },
  extras: {}, trail: []
};

function collide(nx, ny, r) {
  for (const [ox, oy] of [[-r, -r], [r, -r], [-r, r], [r, r]]) {
    if (blockedAt(nx + ox, ny + oy)) return true;
  }
  return false;
}
// colisión dinámica con coches la inyecta main (carBlock) para evitar ciclo
export let carBlockFn = null;
export function setCarBlock(fn) { carBlockFn = fn; }

export function updatePlayer(dt) {
  // DESATASCO: si el jugador quedó embebido en sólidos, empújalo al centro libre más cercano.
  // (nunca más spawns atrapados por mobiliario)
  const embed = collide(player.gx, player.gy, 0.05);
  if (embed) {
    const free = nearestFree(player.gx, player.gy, 5);
    if (free) { player.gx = free[0]; player.gy = free[1]; }
  }
  const kd = k => !!keys[k];
  let mx = 0, my = 0;
  if (kd('w') || kd('arrowup')) { mx -= 1; my -= 1; }
  if (kd('s') || kd('arrowdown')) { mx += 1; my += 1; }
  if (kd('a') || kd('arrowleft')) { mx -= 1; my += 1; }
  if (kd('d') || kd('arrowright')) { mx += 1; my -= 1; }
  const moving = mx !== 0 || my !== 0;
  if (moving) {
    const l = Math.hypot(mx, my); mx /= l; my /= l;
    const sp = player.speed * dt * (G.energia <= 0 ? 0.55 : 1);
    const r = 0.28;
    const enCiudad = G.modo === 'city';
    const hard = (x, y) => collide(x, y, r) || (enCiudad && carBlockFn && carBlockFn(x, y));
    const nx = player.gx + mx * sp;
    if (!hard(nx, player.gy)) player.gx = nx;
    const ny = player.gy + my * sp;
    if (!hard(player.gx, ny)) player.gy = ny;
    player.phase += sp * 3;
    player.state = 'walk';
    player.dir = Math.abs(mx) > Math.abs(my) ? (mx > 0 ? 0 : 2) : (my > 0 ? 1 : 3);
  } else player.state = 'idle';
  // límites según mapa activo
  if (G.modo === 'city') {
    player.gx = clamp(player.gx, 0.4, 39.6);
    player.gy = clamp(player.gy, 0.4, 39.6);
  } else {
    const m = getCurrent();
    if (m) {
      player.gx = clamp(player.gx, 0.7, m.w - 0.7);
      player.gy = clamp(player.gy, 0.7, m.h - 0.4);
    }
  }
  if (player.talkT > 0) { player.talkT -= dt; if (player.talkT <= 0) player.talk = null; }
  if (player.extras.trail && moving) {
    player.trail.push({ x: player.gx, y: player.gy, a: 1 });
    if (player.trail.length > 14) player.trail.shift();
  }
  for (const tr of player.trail) tr.a -= dt * 1.4;
  player.trail = player.trail.filter(tr => tr.a > 0);
}

// población de la ciudad (agentes CON HORARIOS: oficina, campo, ocio, noche)
export const npcs = [];
export function spawnNPCs() {
  const palettes = [
    { skin: '#e8b88a', hair: '#2c2c3c', jacket: '#4a5a8a', pants: '#23263a' },
    { skin: '#c98d5e', hair: '#151824', jacket: '#8a3a5a', pants: '#1e2130' },
    { skin: '#f0c9a0', hair: '#5a3a1a', jacket: '#2a7a6a', pants: '#20263c' },
    { skin: '#d9a06b', hair: '#0f0f1a', jacket: '#7a6a2a', pants: '#26202e' },
    { skin: '#e8b88a', hair: '#b03a2a', jacket: '#3a4a9a', pants: '#1a1d2c' },
    { skin: '#c98d5e', hair: '#2c2c3c', jacket: '#6a3a8a', pants: '#232630' }
  ];
  // reparto de turnos por índice (vida diaria real)
  const GRUPOS = ['oficina', 'campo', 'oficina', 'ocio', 'campo', 'ocio', 'oficina', 'noche',
    'campo', 'ocio', 'oficina', 'noche', 'campo', 'ocio', 'oficina', 'campo', 'ocio', 'campo',
    'oficina', 'noche', 'ocio', 'campo', 'oficina', 'noche'];
  const defs = [
    { name: 'Agent_773', pi: 0 }, { name: 'Beta-3', pi: 1 }, { name: 'Omega-5', pi: 2 },
    { name: 'Lorena', pi: 3 }, { name: 'AgentA', pi: 4 }, { name: 'Diego', pi: 5 },
    { name: 'Agent_045', pi: 2 }, { name: 'Clarita', pi: 0 }, { name: 'Agent_312', pi: 3 },
    { name: 'Kilo-9', pi: 5 }, { name: 'Zeta-1', pi: 2 }, { name: 'Agent_777', pi: 4 },
    { name: 'Mora', pi: 1 }, { name: 'Pixel', pi: 0 }, { name: 'Turbo', pi: 3 },
    { name: 'Lupa', pi: 6 }, { name: 'Rayo', pi: 7 }, { name: 'Centa', pi: 8 },
    { name: 'Neo_9', pi: 9 }, { name: 'Vega_2', pi: 10 }, { name: 'Luz_7', pi: 11 },
    { name: 'Bruma', pi: 12 }, { name: 'Cisco', pi: 13 }, { name: 'Tinta', pi: 14 },
    { name: 'Nova', pi: 0, estatico: true, spot: 'doorHub', questId: 'P2', colorTag: '#7ae7ff' },
    { name: 'Bella', pi: 0, estatico: true, spot: 'q1a', questId: 'P3', colorTag: '#ff2fb3' },
    { name: 'Rex', pi: 0, estatico: true, spot: 'doorMercado', questId: 'P4', colorTag: '#ffb347' }
  ];
  let k = 0;
  for (const d of defs) {
    const o = { ...d, seed: k * 1.7 + 0.3, pal: palettes[k % palettes.length], speed: 0.95 + hash2(k, 7) * 0.55 };
    if (!d.estatico) o.grupo = GRUPOS[k % GRUPOS.length];
    if (d.estatico && d.spot && spots[d.spot]) {
      o.gx = spots[d.spot].gx; o.gy = spots[d.spot].gy + 0.35;
    } else {
      const pat = patrols[k % patrols.length];
      o.path = pat.pts;
      const start = (pat.dir === -1 ? pat.pts.length - 1 - (k % pat.pts.length) : (k * 3) % pat.pts.length);
      o.gx = pat.pts[start][0]; o.gy = pat.pts[start][1];
      o.pi = (start + 1) % pat.pts.length;
      if (pat.dir === -1) o.reverse = true;
    }
    npcs.push(new NPC(o));
    k++;
  }
}
