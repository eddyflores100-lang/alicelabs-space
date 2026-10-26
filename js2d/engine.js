// ============================================================
// ALICE CITY v8 — MOTOR 2D (CIUDAD VIVA: luz, gradientes, horarios)
// ALICELABS · ZOLO · Task 263
// ============================================================

export const TW = 32, TH = 16;      // tamaño de tile isométrico
export const VW = 1280, VH = 720;   // resolución interna alta (definición)

// ---- Estado global compartido ----
export const G = {
  tiempo: 0,
  modo: 'city',            // 'city' | 'interior'
  mapId: null,             // id del interior actual (null = ciudad)
  lastDoor: null,          // puerta de la ciudad por la que se entró
  monedas: parseInt(localStorage.getItem('alice_monedas') || '0', 10) || 0,
  energia: 95,
  activos: 3450,
  quests: {},              // id -> {estado, paso}
  owned: {},               // items de tienda
  equipped: {},            // items equipados
  overview: false,
  iniciado: false,
  fade: 0, fadeDir: 0, fadeCb: null,
  dron: false, trail: false, badge: false,
  relojMin: 7 * 60 + 30,   // hora del juego en minutos (07:30)
  dia: 1                   // día de la semana virtual
};

// ---- RELOJ DEL JUEGO: 1 segundo real = 1 minuto de juego ----
export function tickReloj(dt) {
  G.relojMin += dt;                  // dt ya está en segundos → +1 min de juego por segundo real (día completo = 24 min reales)
  if (G.relojMin >= 24 * 60) { G.relojMin -= 24 * 60; G.dia++; }
}

// fase del día: luz ambiente, tinte y horario
export function faseDia() {
  const m = G.relojMin % (24 * 60);
  const h = Math.floor(m / 60), mn = Math.floor(m % 60);
  const hf = h + mn / 60;
  let nombre = 'DÍA', noche = false, tint = null, luz = 1;
  if (hf >= 6 && hf < 8) { nombre = 'AMANECER'; tint = 'rgba(255,186,110,0.10)'; luz = 0.96; }
  else if (hf >= 8 && hf < 17.5) { nombre = 'DÍA'; luz = 1; }
  else if (hf >= 17.5 && hf < 19.5) { nombre = 'ATARDECER'; tint = 'rgba(255,128,64,0.17)'; luz = 0.9; }
  else { nombre = 'NOCHE'; noche = true; tint = 'rgba(16,30,74,0.33)'; luz = 0.78; }
  return { nombre, noche, tint, luz, hora: h, min: mn };
}

// cargar estado persistente v5
try {
  const s = JSON.parse(localStorage.getItem('alice_v5_state') || 'null');
  if (s) {
    Object.assign(G.quests, s.quests || {});
    Object.assign(G.owned, s.owned || {});
    Object.assign(G.equipped, s.equipped || {});
    if (typeof s.energia === 'number') G.energia = s.energia;
    G.v5hq = !!s.v5hq;
  }
} catch (e) { /* estado corrupto: ignorar */ }

export function saveState() {
  localStorage.setItem('alice_v5_state', JSON.stringify({
    quests: G.quests, owned: G.owned, equipped: G.equipped, energia: G.energia, v5hq: !!G.v5hq
  }));
}

// ---- Canvas ----
const canvas = document.getElementById('game');
export const ctx = canvas.getContext('2d');
canvas.width = VW; canvas.height = VH;
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

export function resize() {
  const s = Math.max(0.5, Math.min(innerWidth / VW, innerHeight / VH));
  canvas.style.width = Math.floor(VW * s) + 'px';
  canvas.style.height = Math.floor(VH * s) + 'px';
}
addEventListener('resize', resize);
resize();

// ---- Cámara ----
export const cam = { x: 0, y: 0, zoom: 1 };

// ---- Proyección isométrica ----
export const isoX = (gx, gy) => (gx - gy) * TW / 2;
export const isoY = (gx, gy) => (gx + gy) * TH / 2;
export function gridToWorld(gx, gy) { return { x: isoX(gx, gy), y: isoY(gx, gy) }; }
export function worldToGrid(wx, wy) {
  const a = wx / (TW / 2), b = wy / (TH / 2);
  return { gx: (a + b) / 2, gy: (b - a) / 2 };
}
export function toScreen(wx, wy) {
  return { sx: (wx - cam.x) * cam.zoom + VW / 2, sy: (wy - cam.y) * cam.zoom + VH / 2 };
}

// ---- Entrada ----
export const keys = {};
const pressed = {};
addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase();
  if (!keys[k]) pressed[k] = true;
  keys[k] = true;
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
export function consume(k) { if (pressed[k]) { pressed[k] = false; return true; } return false; }
export function clearPressed() { for (const k in pressed) pressed[k] = false; }
// inyección de teclas para controles táctiles / pruebas
export function pressKey(k, ms = 160) {
  pressed[k] = true;
  keys[k] = true;
  setTimeout(() => { keys[k] = false; }, ms);
}

// ---- RNG determinista ----
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// ---- Audio (WebAudio, sin assets) ----
let AC = null;
export function audioInit() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } }
  if (AC && AC.state === 'suspended') AC.resume();
}
export function beep(f = 440, d = 0.08, type = 'square', vol = 0.025, slide = 0) {
  if (!AC) return;
  try {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.value = f;
    if (slide) o.frequency.linearRampToValueAtTime(Math.max(40, f + slide), AC.currentTime + d);
    g.gain.setValueAtTime(vol, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + d);
    o.connect(g).connect(AC.destination);
    o.start(); o.stop(AC.currentTime + d + 0.02);
  } catch (e) { }
}
export const sfx = {
  ui:      () => beep(660, 0.05, 'square', 0.02),
  talk:    () => { beep(520, 0.05, 'square', 0.02); setTimeout(() => beep(700, 0.05, 'square', 0.02), 60); },
  moneda:  () => { beep(880, 0.06, 'square', 0.03); setTimeout(() => beep(1320, 0.09, 'square', 0.03), 70); },
  tarea:   () => { beep(523, 0.09, 'square', 0.03); setTimeout(() => beep(659, 0.09, 'square', 0.03), 90); setTimeout(() => beep(784, 0.14, 'square', 0.03), 180); },
  error:   () => beep(180, 0.15, 'sawtooth', 0.03, -60),
  puerta:  () => beep(300, 0.18, 'triangle', 0.03, 140),
  claxon:  () => { beep(220, 0.12, 'sawtooth', 0.02); setTimeout(() => beep(220, 0.12, 'sawtooth', 0.02), 150); }
};

// ---- Economía ALC (compatible v4: alice_monedas) ----
const onCoins = [];
export function onCoinsChange(fn) { onCoins.push(fn); }
export function addCoins(n, motivo = '') {
  G.monedas += n;
  localStorage.setItem('alice_monedas', String(G.monedas));
  try {
    const h = JSON.parse(localStorage.getItem('alice_historial_v1') || '[]');
    h.unshift({ t: Date.now(), d: (n >= 0 ? '+' : '') + n + ' ALC · ' + motivo });
    localStorage.setItem('alice_historial_v1', JSON.stringify(h.slice(0, 30)));
  } catch (e) { }
  onCoins.forEach(f => f(G.monedas));
}
export function spendCoins(n, motivo = '') {
  if (G.monedas < n) return false;
  addCoins(-n, motivo);
  return true;
}

// ---- Transición con fundido ----
export function fadeTo(cb) { G.fadeDir = 1; G.fadeCb = cb; }

// ---- Utilidades ----
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export function dist2(ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }
