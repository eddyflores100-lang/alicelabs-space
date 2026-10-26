// ============================================================
// ALICE CITY v7 — INTERIORES CON ARQUITECTURA REAL
// Muros internos con puertas, BAÑO (inodoro/ducha/lavabo),
// cocina, dormitorio y salón separados. Vida diaria de agentes:
// cafetería, gym, clínica y residencias. 17 mapas en total.
// ============================================================
import { G, isoX, isoY, hash2, ctx as ctx2 } from './engine.js';
import { TW, TH } from './engine.js';
import { isoBox } from './draw.js';
import { NPC } from './agents.js';
import { registerMap, setCurrent } from './maps.js';

// ---------- FÁBRICA DE INTERIORES ----------
function room(id, w, h, name, spawn) {
  const m = {
    id, w, h, name,
    spawn: spawn || [w / 2, h - 1.6],
    tiles: new Uint8Array(w * h),       // suelos (ver SUELOS)
    solid: new Uint8Array(w * h),
    props: [], npcs: [], inter: [],
    exit: { x0: (w >> 1) - 1, x1: w >> 1, y: h - 1 }
  };
  // paredes perimetrales N/O/E (el sur queda abierto = salida)
  for (let x = 0; x < w; x++) { m.tiles[x] = 5; m.solid[x] = 1; }
  for (let y = 0; y < h; y++) {
    m.tiles[y * w] = 5; m.solid[y * w] = 1;
    m.tiles[y * w + w - 1] = 5; m.solid[y * w + w - 1] = 1;
  }
  registerMap(m);
  return m;
}
const ii = (m, x, y) => y * m.w + x;
function suelo(m, x0, y0, x1, y1, t) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++)
    if (x > 0 && y > 0 && x < m.w - 1 && y < m.h - 1) m.tiles[ii(m, x, y)] = t;
}
function solidBox(m, x0, y0, x1, y1) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) m.solid[ii(m, x, y)] = 1;
}
// muro interno con vanos de puerta (gaps = [[x,y],…])
function muro(m, x0, y0, x1, y1, gaps = []) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (gaps.some(g => g[0] === x && g[1] === y)) continue;
    m.tiles[ii(m, x, y)] = 5; m.solid[ii(m, x, y)] = 1;
  }
}
function P(m, tipo, gx, gy, solido = true, data = null) {
  m.props.push({ tipo, gx, gy, data });
  if (solido) m.solid[ii(m, Math.floor(gx), Math.floor(gy))] = 1;
}
function IT(m, tipo, gx, gy, label, data = null) {
  m.inter.push({ tipo, gx, gy, label, done: false, data });
}
function NPCa(m, def) { m.npcs.push(new NPC({ grupo: 'fijo', ...def })); }  // interiores: siempre visibles (su turno es ahí)
function salida(m, x0, x1, y) {
  for (let x = x0; x <= x1; x++) m.tiles[ii(m, x, y)] = 6;
  m.exit = { x0, x1, y };
}
const PAL = (skin, hair, jacket, pants) => ({ skin, hair, jacket, pants });

// ============================================================
// KIT DE BAÑO (vida diaria)
// ============================================================
function bano(m, x0, y0, conLavabo = true) {
  // x0..x0+2 mínimo (3 tiles de ancho), muro norte detrás
  P(m, 'inodoro', x0 + 0.45, y0 + 0.45, true);
  if (conLavabo) {
    P(m, 'lavabo', x0 + 1.45, y0 + 0.45, true);
    P(m, 'espejo', x0 + 1.45, 0.94, false);
  }
  P(m, 'ducha', x0 + 2.5, y0 + 0.7, true);
  solidBox(m, x0 + 2, y0, x0 + 2, y0 + 1);
  IT(m, 'ducha', x0 + 2.5, y0 + 2.0, 'DUCHARSE (+energía)');
}

// ============================================================
// CONSTRUCTORES
// ============================================================
function buildHQ() {
  const m = room('hq', 16, 12, 'TORRE ALICE · HQ', [8.5, 10.4]);
  // ---- SERVER ROOM (verde) ----
  suelo(m, 1, 1, 4, 4, 2);
  const rackPos = [[1.5, 1.5], [2.5, 1.5], [3.5, 1.5], [1.5, 3.5], [2.5, 3.5], [3.5, 3.5]];
  for (const r of rackPos) {
    P(m, 'rack', r[0], r[1], true);
    if (r[1] < 3) IT(m, 'rack', r[0], r[1] + 0.75, 'ACTIVAR RACK');
  }
  // ---- SALA OPS (azul) ----
  suelo(m, 6, 1, 14, 3, 1);
  for (const d of [[7, 2], [9, 2], [11, 2], [13, 2]]) P(m, 'desk', d[0], d[1], true);
  // ---- CONFERENCIA ----
  suelo(m, 6, 5, 10, 7, 0);
  P(m, 'mesa', 8, 6, true, { w: 2.4, d: 0.9 });
  P(m, 'pizarra', 8, 0.9, false);
  // ---- LOUNGE ----
  suelo(m, 12, 5, 14, 7, 3);
  P(m, 'sofa', 13, 5.2, true);
  P(m, 'cafe', 14.5, 5.3, true);
  P(m, 'refri', 12.3, 5.3, true);
  P(m, 'mesita', 13, 6.4, true);
  // ---- RECEPCIÓN ----
  suelo(m, 4, 8, 11, 10, 4);
  P(m, 'recep', 6.5, 9, true);
  salida(m, 7, 8, 11);
  P(m, 'planta', 5.3, 0.9, true); P(m, 'planta', 14.6, 0.9, true);
  P(m, 'planta', 11.3, 7.6, true); P(m, 'planta', 4.3, 7.6, true);
  P(m, 'reloj', 11.5, 0.9, false);
  // NPCs
  NPCa(m, { name: 'Kai', gx: 7, gy: 1.55, sentado: true, estatico: true, seed: 3, pal: PAL('#e8b88a', '#151824', '#2a7a6a', '#20263c'), colorTag: '#39ff88' });
  NPCa(m, { name: 'Mia', gx: 9, gy: 1.55, sentado: true, estatico: true, seed: 4, pal: PAL('#f0c9a0', '#5a3a1a', '#8a3a5a', '#1e2130'), colorTag: '#ff2fb3' });
  NPCa(m, { name: 'Dot', gx: 11, gy: 1.55, sentado: true, estatico: true, seed: 5, pal: PAL('#c98d5e', '#0f0f1a', '#3a4a9a', '#1a1d2c'), colorTag: '#7ae7ff' });
  NPCa(m, { name: 'Jefa Vega', gx: 8, gy: 5.45, sentado: true, estatico: true, seed: 6, questId: 'P6', pal: PAL('#e8b88a', '#2c2c3c', '#4a5a8a', '#23263a'), colorTag: '#00f0ff' });
  NPCa(m, { name: 'Ada', gx: 6.5, gy: 9.75, sentado: true, estatico: true, seed: 7, questId: 'P7', pal: PAL('#d9a06b', '#b03a2a', '#7a6a2a', '#26202e'), colorTag: '#ffd23f' });
  NPCa(m, { name: 'Leo', gx: 1.5, gy: 4.5, speed: 0.8, seed: 8, pal: PAL('#e8b88a', '#2c2c3c', '#6a3a8a', '#232630'), colorTag: '#c17aff', path: [[1.5, 4.5], [3.5, 4.5], [3.5, 2.5], [1.5, 2.5]] });
}

function buildHub() {
  const m = room('hub', 14, 10, 'DATA HUB', [7, 8.4]);
  suelo(m, 1, 1, 12, 8, 8);
  P(m, 'pantalla', 3, 0.9, false, { c: 0 }); P(m, 'pantalla', 7, 0.9, false, { c: 1 }); P(m, 'pantalla', 11, 0.9, false, { c: 2 });
  for (const d of [[3, 2], [5, 2], [9, 2], [11, 2]]) P(m, 'desk', d[0], d[1], true);
  P(m, 'consola', 2.5, 4.5, true); P(m, 'consola', 11.5, 4.5, true);
  P(m, 'mesa', 7, 6, true, { w: 2.2, d: 0.9 });
  P(m, 'rack', 1.5, 6.5, true); P(m, 'rack', 1.5, 7.5, true);
  P(m, 'rack', 12.5, 6.5, true); P(m, 'rack', 12.5, 7.5, true);
  P(m, 'planta', 1.5, 1.6, true); P(m, 'planta', 12.5, 1.6, true);
  salida(m, 6, 7, 9);
  NPCa(m, { name: 'Ciro', gx: 3, gy: 1.55, sentado: true, estatico: true, seed: 9, pal: PAL('#e8b88a', '#101322', '#00b4d8', '#1a1d30'), colorTag: '#00f0ff' });
  NPCa(m, { name: 'Luz', gx: 9, gy: 1.55, sentado: true, estatico: true, seed: 10, pal: PAL('#f0c9a0', '#151824', '#7a9bff', '#20263c'), colorTag: '#7a9bff' });
}

function buildNeural() {
  const m = room('neural', 12, 10, 'NEURAL CORE', [6, 8.4]);
  suelo(m, 1, 1, 10, 8, 10);
  P(m, 'reactor', 5.5, 4.3, true, { w: 2, d: 1.6 });
  solidBox(m, 5, 4, 6, 5);
  P(m, 'matraz', 2.5, 2.5, true); P(m, 'matraz', 3.5, 2.5, true); P(m, 'matraz', 9, 2.5, true);
  P(m, 'mesa_lab', 2.8, 7, true); P(m, 'mesa_lab', 8.8, 7, true);
  P(m, 'pantalla', 2.5, 0.9, false, { c: 0 }); P(m, 'pantalla', 9, 0.9, false, { c: 1 });
  P(m, 'consola', 4.5, 2.2, true); P(m, 'consola', 7.5, 2.2, true);
  salida(m, 5, 6, 9);
  IT(m, 'accion', 6, 6.6, 'INICIAR ESCÁNER', { msg: 'Escaneo: 3450 agentes sincronizados · 98% estable' });
  NPCa(m, { name: 'Dr. Syn', gx: 7.5, gy: 6.8, estatico: true, seed: 11, pal: PAL('#e8b88a', '#e8e8f0', '#3a4a9a', '#23263a'), colorTag: '#c17aff' });
  NPCa(m, { name: 'Iris', gx: 9.3, gy: 4.5, estatico: true, seed: 12, pal: PAL('#c98d5e', '#0f0f1a', '#2a7a6a', '#1e2130'), colorTag: '#39ff88' });
}

function buildAnalysis() {
  const m = room('analysis', 14, 10, 'ANALYSIS CENTER', [7, 8.4]);
  suelo(m, 1, 1, 12, 8, 1);
  P(m, 'pizarra', 4, 0.9, false); P(m, 'pizarra', 10, 0.9, false);
  for (const d of [[3, 3], [5, 3], [9, 3], [11, 3]]) P(m, 'desk', d[0], d[1], true);
  P(m, 'mesa', 7, 6, true, { w: 2.6, d: 1 });
  P(m, 'estante', 1.5, 5, true); P(m, 'estante', 1.5, 6, true);
  P(m, 'estante', 12.5, 5, true); P(m, 'estante', 12.5, 6, true);
  P(m, 'planta', 1.5, 1.6, true);
  salida(m, 6, 7, 9);
  IT(m, 'accion', 7, 4.6, 'REVISAR GRÁFICAS', { msg: 'Datos del día: misiones pagadas sin retraso · ALC fluyendo' });
  NPCa(m, { name: 'Chart', gx: 5, gy: 2.55, sentado: true, estatico: true, seed: 13, pal: PAL('#d9a06b', '#5a3a1a', '#b07a2a', '#26202e'), colorTag: '#ffd23f' });
  NPCa(m, { name: 'Mila', gx: 11, gy: 2.55, sentado: true, estatico: true, seed: 14, pal: PAL('#f0c9a0', '#b03a2a', '#8a3a5a', '#1e2130'), colorTag: '#ff2fb3' });
}

function buildMercado() {
  const m = room('mercado', 16, 11, 'MERCADO', [8, 9.4]);
  suelo(m, 1, 1, 14, 9, 9);
  P(m, 'puesto', 3, 2.8, true, { c: 0 }); P(m, 'puesto', 6, 2.8, true, { c: 1 });
  P(m, 'puesto', 9, 2.8, true, { c: 2 }); P(m, 'puesto', 12, 2.8, true, { c: 0 });
  P(m, 'pila', 14.5, 3, true); P(m, 'pila', 1.5, 6, true);
  P(m, 'cinta', 7.5, 6, true, { w: 5 }); solidBox(m, 6, 6, 9, 6);
  P(m, 'barra', 13.2, 7.5, true);
  P(m, 'guirnalda', 8, 0.9, false);
  salida(m, 7, 8, 10);
  IT(m, 'accion', 8, 4.5, 'PESAR INVENTARIO', { msg: 'Inventario cuadrado: 0 faltantes · Rex aprueba' });
  NPCa(m, { name: 'Tito', gx: 3, gy: 3.7, estatico: true, seed: 15, pal: PAL('#e8b88a', '#151824', '#e63946', '#1e2130'), colorTag: '#ffb347' });
  NPCa(m, { name: 'Any', gx: 13.2, gy: 6.5, estatico: true, seed: 16, pal: PAL('#f0c9a0', '#5a3a1a', '#2a9d8f', '#20263c'), colorTag: '#39ff88' });
}

// ============================================================
// TU APTO — vivienda completa: salón + cocina + dormitorio + BAÑO
// ============================================================
function buildApto() {
  const m = room('apto', 18, 13, 'TU APTO', [8.5, 11.3]);
  suelo(m, 1, 1, 16, 11, 0);                          // madera en todo
  suelo(m, 1, 1, 6, 3, 9);                            // cocina baldosa
  suelo(m, 8, 1, 11, 3, 13);                          // baño cerámica
  suelo(m, 3, 6, 8, 8, 11);                           // alfombra salón
  // --- muros internos con puertas ---
  muro(m, 1, 4, 16, 4, [[3, 4], [9, 4], [14, 4]]);    // banda norte (puertas cocina/baño/dorm)
  muro(m, 7, 1, 7, 3);                                // cocina | baño
  muro(m, 12, 1, 12, 3);                              // baño | dormitorio
  // --- COCINA ---
  P(m, 'refri', 1.4, 1.45, true);
  P(m, 'horno', 2.4, 1.45, true);
  IT(m, 'cocina', 2.4, 2.4, 'COCINAR (+energía)');
  P(m, 'fregadero', 3.4, 1.45, true);
  P(m, 'barra', 5.4, 1.5, true);
  P(m, 'mesa', 4.5, 2.3, true, { w: 1.6, d: 0.8 });
  P(m, 'silla', 3.7, 2.8, true); P(m, 'silla', 5.3, 2.8, true);
  // --- BAÑO ---
  bano(m, 8, 1.55, true);
  // --- DORMITORIO ---
  P(m, 'cama', 13.9, 1.75, true); solidBox(m, 13, 1, 14, 2);
  IT(m, 'cama', 13.5, 2.9, 'DORMIR (recuperar energía)');
  P(m, 'mesanight', 15.2, 1.45, true);
  P(m, 'armario', 16.4, 1.45, true);
  IT(m, 'armario', 16.4, 2.4, 'ABRIR ARMARIO (cambiar outfit)');
  // --- SALÓN ---
  P(m, 'tv', 5.5, 4.95, false);
  P(m, 'sofa', 5.5, 6.55, true);
  P(m, 'mesita', 5.5, 5.55, true);
  P(m, 'silla', 8.5, 6.5, true);
  P(m, 'estante', 1.45, 5.5, true); P(m, 'estante', 16.45, 5.5, true);
  P(m, 'pc_casa', 16.4, 6.7, true);
  IT(m, 'pc', 16.4, 7.6, 'VER CONTRATOS');
  P(m, 'planta', 1.45, 10.4, true); P(m, 'planta', 16.5, 10.4, true);
  P(m, 'cuadro', 10.5, 4.94, false);
  P(m, 'reloj', 13.5, 4.94, false);
  // --- ENTRADA ---
  P(m, 'mesita', 7.4, 10.4, true);                    // zapatero
  salida(m, 8, 9, 12);
  NPCa(m, { name: 'Gato Bot', gx: 9.5, gy: 7.5, gato: true, estatico: true, seed: 17, pal: PAL('#e8a04a', '#e8a04a', '#e8a04a', '#c07a30'), colorTag: '#ff9a3d' });
}

// ============================================================
// CASAS DE BARRIO — cocina + baño + dormitorio + salón
// ============================================================
function buildCasa7() {
  const m = room('casa7', 14, 11, 'CASA-7', [6.5, 9.3]);
  suelo(m, 1, 1, 12, 9, 0);
  suelo(m, 1, 1, 6, 3, 9);                            // cocina
  suelo(m, 8, 1, 9, 3, 13);                           // baño
  muro(m, 1, 4, 12, 4, [[3, 4], [9, 4], [11, 4]]);
  muro(m, 7, 1, 7, 3);
  muro(m, 10, 1, 10, 3);
  // cocina
  P(m, 'refri', 1.4, 1.45, true);
  P(m, 'horno', 2.4, 1.45, true);
  IT(m, 'cocina', 2.4, 2.4, 'COCINAR (+energía)');
  P(m, 'fregadero', 3.4, 1.45, true);
  P(m, 'barra', 5.3, 1.5, true);
  // baño (compacto: inodoro + ducha)
  P(m, 'inodoro', 8.45, 1.45, true);
  P(m, 'ducha', 9.5, 1.7, true);
  solidBox(m, 9, 1, 9, 1);
  IT(m, 'ducha', 9.4, 2.6, 'DUCHARSE (+energía)');
  // dormitorio
  P(m, 'cama', 11.9, 1.75, true); solidBox(m, 11, 1, 12, 2);
  IT(m, 'cama', 11.9, 2.9, 'DORMIR (recuperar energía)');
  P(m, 'mesanight', 12.45, 2.6, true);
  // salón
  P(m, 'tv', 4.5, 4.95, false);
  P(m, 'sofa', 4.5, 6.5, true);
  P(m, 'mesita', 4.5, 5.5, true);
  P(m, 'estante', 12.4, 5.5, true);
  P(m, 'planta', 1.4, 8.4, true);
  P(m, 'cuadro', 7, 4.94, false);
  salida(m, 6, 7, 10);
  NPCa(m, { name: 'Doña Lu', gx: 6.5, gy: 6.6, estatico: true, seed: 23, pal: PAL('#e8b88a', '#b03a2a', '#8a3a5a', '#232630'), colorTag: '#ff2fb3' });
}

function buildCasa12() {
  const m = room('casa12', 14, 11, 'CASA-12', [6.5, 9.3]);
  suelo(m, 1, 1, 12, 9, 0);
  suelo(m, 1, 1, 5, 3, 9);
  suelo(m, 7, 1, 8, 3, 13);
  muro(m, 1, 4, 12, 4, [[3, 4], [8, 4], [10, 4]]);
  muro(m, 6, 1, 6, 3);
  muro(m, 9, 1, 9, 3);
  // cocina
  P(m, 'fregadero', 1.45, 1.45, true);
  P(m, 'horno', 2.4, 1.45, true);
  IT(m, 'cocina', 2.4, 2.4, 'COCINAR (+energía)');
  P(m, 'refri', 3.4, 1.45, true);
  P(m, 'barra', 4.6, 1.5, true);
  // baño
  P(m, 'inodoro', 7.45, 1.45, true);
  P(m, 'ducha', 8.5, 1.7, true);
  solidBox(m, 8, 1, 8, 1);
  IT(m, 'ducha', 8.4, 2.6, 'DUCHARSE (+energía)');
  // dormitorio
  P(m, 'cama', 10.9, 1.75, true); solidBox(m, 10, 1, 11, 2);
  IT(m, 'cama', 10.9, 2.9, 'DORMIR (recuperar energía)');
  P(m, 'mesanight', 12.4, 1.45, true);
  // salón-comedor
  P(m, 'mesa', 4, 6.5, true, { w: 1.8, d: 0.9 });
  P(m, 'silla', 3.2, 7.3, true); P(m, 'silla', 4.8, 7.3, true);
  P(m, 'tv', 8.5, 4.95, false);
  P(m, 'sofa', 8.5, 6.6, true);
  P(m, 'planta', 12.4, 8.4, true);
  P(m, 'cuadro', 6.5, 4.94, false);
  salida(m, 6, 7, 10);
  NPCa(m, { name: 'Otto', gx: 5.5, gy: 5.6, estatico: true, seed: 24, pal: PAL('#c98d5e', '#151824', '#2a9d8f', '#1e2130'), colorTag: '#2a9d8f' });
}

// fábrica para CASA-3 / CASA-9 (suburbios del cinturón)
function buildCasaGenerica(id, name, residente, colorTag, seed) {
  const m = room(id, 14, 11, name, [6.5, 9.3]);
  suelo(m, 1, 1, 12, 9, 0);
  suelo(m, 1, 1, 5, 3, 9);
  suelo(m, 7, 1, 8, 3, 13);
  muro(m, 1, 4, 12, 4, [[3, 4], [8, 4], [10, 4]]);
  muro(m, 6, 1, 6, 3);
  muro(m, 9, 1, 9, 3);
  P(m, 'refri', 1.4, 1.45, true);
  P(m, 'horno', 2.4, 1.45, true);
  IT(m, 'cocina', 2.4, 2.4, 'COCINAR (+energía)');
  P(m, 'fregadero', 3.4, 1.45, true);
  P(m, 'barra', 4.6, 1.5, true);
  P(m, 'inodoro', 7.45, 1.45, true);
  P(m, 'ducha', 8.5, 1.7, true);
  solidBox(m, 8, 1, 8, 1);
  IT(m, 'ducha', 8.4, 2.6, 'DUCHARSE (+energía)');
  P(m, 'cama', 10.9, 1.75, true); solidBox(m, 10, 1, 11, 2);
  IT(m, 'cama', 10.9, 2.9, 'DORMIR (recuperar energía)');
  P(m, 'mesanight', 12.4, 1.45, true);
  P(m, 'sofa', 5.5, 6.6, true);
  P(m, 'tv', 5.5, 4.95, false);
  P(m, 'mesita', 5.5, 5.5, true);
  P(m, 'planta', 12.4, 8.4, true);
  P(m, 'cuadro', 8, 4.94, false);
  salida(m, 6, 7, 10);
  NPCa(m, {
    name: residente, gx: 7.5, gy: 6.5, estatico: true, seed,
    pal: PAL('#e8b88a', '#2c2c3c', '#6a3a8a', '#232630'), colorTag
  });
}

// ============================================================
// CAFETERÍA NEÓN — agentes desayunando antes del turno
// ============================================================
function buildCafeteria() {
  const m = room('cafeteria', 14, 10, 'CAFETERÍA NEÓN', [6.5, 8.3]);
  suelo(m, 1, 1, 12, 8, 9);
  // barra + máquina + vitrina
  P(m, 'barra', 2.5, 1.5, true); P(m, 'barra', 4.5, 1.5, true); P(m, 'barra', 6.5, 1.5, true);
  P(m, 'maquina', 1.45, 1.45, true);
  IT(m, 'cafetera', 1.45, 2.5, 'PEDIR CAFÉ (+12 energía)');
  P(m, 'vitrina', 8.5, 1.5, true);
  P(m, 'pizarra', 4, 0.92, false);                     // menú del día
  P(m, 'guirnalda', 7, 0.9, false);
  // mesas con sillas
  P(m, 'mesa', 3, 5, true, { w: 1.6, d: 0.9 });
  P(m, 'silla', 2.2, 5.8, true); P(m, 'silla', 3.8, 5.8, true);
  P(m, 'mesa', 7, 5, true, { w: 1.6, d: 0.9 });
  P(m, 'silla', 6.2, 5.8, true); P(m, 'silla', 7.8, 5.8, true);
  P(m, 'mesa', 11, 4, true, { w: 1.6, d: 0.9 });
  P(m, 'silla', 10.2, 4.8, true); P(m, 'silla', 11.8, 4.8, true);
  P(m, 'mesa', 11, 7, true, { w: 1.6, d: 0.9 });
  P(m, 'silla', 10.2, 7.8, true);
  P(m, 'planta', 13.4, 1.4, true); P(m, 'planta', 1.4, 8.4, true);
  salida(m, 6, 7, 9);
  NPCa(m, { name: 'Tara', gx: 4.5, gy: 1.35, estatico: true, seed: 25, pal: PAL('#f0c9a0', '#5a3a1a', '#e63946', '#1e2130'), colorTag: '#ff9a3d' });
  NPCa(m, { name: 'Nave', gx: 7, gy: 4.4, sentado: true, estatico: true, seed: 26, pal: PAL('#c98d5e', '#0f0f1a', '#2a7a6a', '#1e2130'), colorTag: '#39ff88' });
}

// ============================================================
// GYM NEÓN — agentes entrenando (vida diaria)
// ============================================================
function buildGym() {
  const m = room('gym', 14, 10, 'GYM NEÓN', [6.5, 8.3]);
  suelo(m, 1, 1, 12, 8, 14);
  // cintas de correr
  P(m, 'caminadora', 2.5, 2.2, true);
  P(m, 'caminadora', 4.5, 2.2, true);
  P(m, 'caminadora', 6.5, 2.2, true);
  IT(m, 'gym', 4.5, 3.3, 'ENTRENAR (energía −6)');
  // pesas y banco
  P(m, 'estante', 12.4, 2, true); P(m, 'estante', 12.4, 3, true);
  P(m, 'pesa', 9.5, 5.5, true);
  P(m, 'pesa', 10.4, 5.6, true);
  P(m, 'silla', 11.3, 5.5, true);
  // espejos en el muro norte
  P(m, 'espejo', 2.5, 0.92, false); P(m, 'espejo', 5, 0.92, false); P(m, 'espejo', 7.5, 0.92, false);
  P(m, 'vending', 13.3, 7.4, true, { c: 0 });
  P(m, 'planta', 1.4, 8.4, true);
  salida(m, 6, 7, 9);
  NPCa(m, { name: 'Rocco', gx: 8.5, gy: 4.4, estatico: true, seed: 27, pal: PAL('#d9a06b', '#151824', '#ffd23f', '#26202e'), colorTag: '#ffd23f' });
  NPCa(m, { name: 'Agente Fit', gx: 2.5, gy: 6, speed: 0.7, seed: 28, pal: PAL('#e8b88a', '#b03a2a', '#39ff88', '#1a1d30'), colorTag: '#39ff88', path: [[2.5, 6], [11.5, 6]] });
}

// ============================================================
// CLÍNICA ALICE — salud de los agentes
// ============================================================
function buildClinica() {
  const m = room('clinica', 14, 11, 'CLÍNICA ALICE', [6.5, 9.3]);
  suelo(m, 1, 1, 12, 9, 13);
  // zona de camillas
  P(m, 'camilla', 11.4, 2.5, true);
  P(m, 'camilla', 11.4, 4.5, true);
  IT(m, 'camilla', 10.4, 3.5, 'REVISACIÓN (energía al 100)');
  P(m, 'pantalla', 9, 0.92, false, { c: 1 });          // signos vitales
  P(m, 'cruz', 5, 0.92, false);
  P(m, 'estante', 1.45, 2, true); P(m, 'estante', 1.45, 3, true);
  // recepción + espera
  P(m, 'recep', 3.5, 7.5, true);
  P(m, 'silla', 5.5, 8.5, true); P(m, 'silla', 6.5, 8.5, true); P(m, 'silla', 7.5, 8.5, true);
  P(m, 'planta', 13.4, 8.4, true); P(m, 'planta', 1.4, 5.5, true);
  salida(m, 6, 7, 10);
  NPCa(m, { name: 'Dra. Luna', gx: 11, gy: 6.4, estatico: true, seed: 29, pal: PAL('#e8b88a', '#e8e8f0', '#e8f0ff', '#1a1d30'), colorTag: '#39ff88' });
  NPCa(m, { name: 'Nurse Pip', gx: 2.5, gy: 5, speed: 0.8, seed: 30, pal: PAL('#c98d5e', '#5a3a1a', '#7ae7ff', '#1e2130'), colorTag: '#7ae7ff', path: [[2.5, 5], [8.5, 5]] });
}

// ============================================================
// RESIDENCIAS — el apto del agente Vek (trabaja desde casa)
// ============================================================
function buildApto2() {
  const m = room('apto2', 16, 12, 'APTO DE VEK · RESIDENCIAS', [7.5, 10.3]);
  suelo(m, 1, 1, 14, 10, 0);
  suelo(m, 1, 1, 5, 3, 9);
  suelo(m, 7, 1, 9, 3, 13);
  suelo(m, 3, 6, 7, 8, 11);
  muro(m, 1, 4, 14, 4, [[3, 4], [8, 4], [12, 4]]);
  muro(m, 6, 1, 6, 3);
  muro(m, 10, 1, 10, 3);
  // cocina
  P(m, 'refri', 1.4, 1.45, true);
  P(m, 'horno', 2.4, 1.45, true);
  IT(m, 'cocina', 2.4, 2.4, 'COCINAR (+energía)');
  P(m, 'fregadero', 3.4, 1.45, true);
  P(m, 'mesa', 4.5, 2.3, true, { w: 1.6, d: 0.8 });
  P(m, 'silla', 3.7, 2.8, true);
  // baño
  P(m, 'inodoro', 7.45, 1.45, true);
  P(m, 'lavabo', 8.45, 1.45, true);
  P(m, 'espejo', 8.45, 0.94, false);
  P(m, 'ducha', 9.5, 1.7, true);
  solidBox(m, 9, 1, 9, 1);
  IT(m, 'ducha', 8.4, 2.6, 'DUCHARSE (+energía)');
  // dormitorio
  P(m, 'cama', 11.9, 1.75, true); solidBox(m, 11, 1, 12, 2);
  IT(m, 'cama', 11.9, 2.9, 'DORMIR (recuperar energía)');
  P(m, 'mesanight', 13.3, 1.45, true);
  P(m, 'armario', 14.4, 1.45, true);
  IT(m, 'accion', 14.4, 2.4, 'ARMARIO DE VEK', { msg: 'Chamarras ordenadas por color · huele a café' });
  // salón + oficina en casa
  P(m, 'tv', 4.5, 4.95, false);
  P(m, 'sofa', 4.5, 6.6, true);
  P(m, 'mesita', 4.5, 5.5, true);
  P(m, 'estante', 1.45, 5.5, true);
  P(m, 'pc_casa', 13.4, 6.7, true);
  P(m, 'planta', 1.45, 10.4, true); P(m, 'planta', 14.5, 10.4, true);
  P(m, 'cuadro', 9, 4.94, false);
  salida(m, 7, 8, 11);
  NPCa(m, { name: 'Vek', gx: 13.4, gy: 6.0, sentado: true, estatico: true, seed: 31, pal: PAL('#c98d5e', '#0f0f1a', '#7a9bff', '#1a1d30'), colorTag: '#7a9bff' });
  NPCa(m, { name: 'Bit', gx: 9, gy: 8.5, gato: true, estatico: true, seed: 32, pal: PAL('#9aa3c0', '#9aa3c0', '#9aa3c0', '#6a7386'), colorTag: '#9fd8ff' });
}

function buildLogistica() {
  const m = room('logistica', 14, 11, 'LOGÍSTICA', [7, 9.4]);
  suelo(m, 1, 1, 12, 9, 7);
  for (const e of [[2, 2], [4, 2], [6, 2], [8, 2], [10, 2], [2, 5], [4, 5], [6, 5], [8, 5], [10, 5]]) P(m, 'estante', e[0], e[1], true);
  P(m, 'pila', 12.5, 3, true); P(m, 'pila', 12.5, 6, true); P(m, 'pila', 1.5, 8, true);
  P(m, 'cinta', 7.5, 8, true, { w: 5 }); solidBox(m, 6, 8, 9, 8);
  P(m, 'caja', 11.5, 8.4, true);
  salida(m, 6, 7, 10);
  IT(m, 'accion', 5, 8.6, 'ESCANEAR CAJAS', { msg: 'Escaneo: 214 paquetes · ruta mercado-logística OK' });
  NPCa(m, { name: 'Cargos', gx: 11.5, gy: 9.4, estatico: true, seed: 18, pal: PAL('#c98d5e', '#0f0f1a', '#ff9a3d', '#26202e'), colorTag: '#ff9a3d' });
  NPCa(m, { name: 'Vex', gx: 11.5, gy: 3.5, speed: 0.9, seed: 19, pal: PAL('#e8b88a', '#2c2c3c', '#7a9bff', '#232630'), colorTag: '#7a9bff', path: [[11.5, 3.5], [11.5, 7.5], [11.5, 3.5]] });
}

function buildLabs() {
  const m = room('labs', 14, 10, 'AGENT LABS', [7, 8.4]);
  suelo(m, 1, 1, 12, 8, 10);
  P(m, 'mesa_lab', 2.8, 3, true); P(m, 'mesa_lab', 3.8, 3, true);
  P(m, 'mesa_lab', 10.2, 3, true); P(m, 'mesa_lab', 11.2, 3, true);
  P(m, 'matraz', 5, 2, true); P(m, 'matraz', 9, 2, true); P(m, 'matraz', 7, 4.6, true);
  P(m, 'campana', 7, 0.9, false);
  P(m, 'mesa', 7, 6.5, true, { w: 2.4, d: 1 });
  P(m, 'estante', 1.5, 6, true); P(m, 'estante', 12.5, 6, true);
  salida(m, 6, 7, 9);
  IT(m, 'accion', 7, 5.4, 'MEZCLAR COMPUESTO', { msg: 'Compuesto NEON-9 estable · +brillo a la ciudad' });
  NPCa(m, { name: 'Prof. Quark', gx: 7, gy: 7.6, estatico: true, seed: 20, pal: PAL('#e8b88a', '#e8e8f0', '#c17aff', '#23263a'), colorTag: '#c17aff' });
  NPCa(m, { name: 'Nix', gx: 3.3, gy: 4.4, estatico: true, seed: 21, pal: PAL('#d9a06b', '#151824', '#39ff88', '#1a1d30'), colorTag: '#39ff88' });
}

function buildSrv7() {
  const m = room('srv7', 10, 8, 'SRV-7', [5, 6.3]);
  suelo(m, 1, 1, 8, 6, 2);
  for (const r of [[1.5, 1.5], [2.5, 1.5], [3.5, 1.5], [1.5, 3.5], [2.5, 3.5], [3.5, 3.5], [7.5, 1.5], [8.4, 1.5]]) P(m, 'rack', r[0], r[1], true);
  P(m, 'consola', 6.5, 4.5, true);
  salida(m, 4, 5, 7);
  IT(m, 'accion', 6.5, 5.4, 'DIAGNÓSTICO SRV-7', { msg: 'SRV-7: 7/7 discos OK · temperatura nominal' });
  NPCa(m, { name: 'Teco', gx: 1.5, gy: 5.5, speed: 0.8, seed: 22, pal: PAL('#e8b88a', '#101322', '#9aa3c0', '#1a1d30'), colorTag: '#9fd8ff', path: [[1.5, 5.5], [4.5, 5.5], [4.5, 2.5], [1.5, 2.5]] });
}

// ---------- construir todos ----------
export function buildAllInteriors() {
  buildHQ(); buildHub(); buildNeural(); buildAnalysis(); buildMercado();
  buildApto(); buildLogistica(); buildLabs(); buildSrv7();
  buildCasa7(); buildCasa12(); buildCasaGenerica('casa3', 'CASA-3', 'Sole', '#ff2fb3', 33);
  buildCasaGenerica('casa9', 'CASA-9', 'Iker', '#7ae7ff', 34);
  buildCafeteria(); buildGym(); buildClinica(); buildApto2();
}

// ============================================================
// RENDER DEL INTERIOR ACTUAL
// ============================================================
import { getCurrent } from './maps.js';

const SUELOS = ['#a87c5a', '#6f9fd8', '#4f9e78', '#8a92a8', '#c3cad8', '#5a6178', '#6a7398',
  '#9aa2b2', '#5fb8c8', '#efe9d8', '#b8c2d0', '#c89a6a', '#8fd0e0', '#dfe9f4', '#5a6b8e'];

const P2 = (gx, gy) => ({ x: isoX(gx, gy), y: isoY(gx, gy) });

function dia(m, gx, gy) {
  const n = P2(gx, gy), e = P2(gx + 1, gy), s = P2(gx + 1, gy + 1), w = P2(gx, gy + 1);
  ctx2.beginPath();
  ctx2.moveTo(n.x, n.y); ctx2.lineTo(e.x, e.y); ctx2.lineTo(s.x, s.y); ctx2.lineTo(w.x, w.y);
  ctx2.closePath();
}

export function drawInteriorGround(t) {
  const m = getCurrent(); if (!m) return;
  for (let y = 0; y < m.h; y++) {
    for (let x = 0; x < m.w; x++) {
      const tt = m.tiles[ii(m, x, y)];
      if (tt === 5) continue;
      const h = hash2(x + 40, y + 40);
      let fill = SUELOS[tt] || '#555';
      if (tt === 3) fill = (x + y) % 2 ? '#f0f0f8' : '#b8c0d8';
      if (tt === 9 && h > 0.75) fill = '#e2dbc6';
      if (tt === 11 && h > 0.7) fill = '#b06a42';
      if (tt === 13 && h > 0.7) fill = '#a8c0d4';
      if (tt === 14) fill = (x + y) % 2 ? '#4a5470' : '#424c66';
      ctx2.fillStyle = fill;
      dia(m, x, y); ctx2.fill();
      if (tt === 4 && h > 0.7) { ctx2.strokeStyle = 'rgba(255,255,255,0.06)'; ctx2.stroke(); }
      if (tt === 10 && (x % 2 === 0)) { ctx2.strokeStyle = 'rgba(0,0,0,0.18)'; ctx2.stroke(); }
      if (tt === 13) { ctx2.strokeStyle = 'rgba(255,255,255,0.25)'; ctx2.stroke(); }
      if (tt === 14 && h > 0.6) { ctx2.strokeStyle = 'rgba(255,210,63,0.10)'; ctx2.stroke(); }
      if (tt === 6) {
        ctx2.fillStyle = `rgba(0,240,255,${0.4 + 0.3 * Math.sin(t * 300 / 300)})`;
        ctx2.fill();
      }
    }
  }
  // marcador sutil en puntos interactivos
  for (const it of m.inter) {
    const g = P2(it.gx, it.gy);
    const a = 0.25 + 0.2 * Math.sin(t * 3 + it.gx);
    ctx2.strokeStyle = it.tipo === 'rack' ? `rgba(57,255,136,${a})` : `rgba(0,240,255,${a})`;
    ctx2.lineWidth = 1.5;
    dia(m, Math.floor(it.gx), Math.floor(it.gy)); ctx2.stroke();
    ctx2.lineWidth = 1;
  }
}

export function drawWallTile(x, y) {
  const n = P2(x, y), e = P2(x + 1, y), s = P2(x + 1, y + 1), w = P2(x, y + 1);
  const H = 34;
  // cara SO: pared clara con banda de luz arriba y zócalo
  ctx2.fillStyle = '#8a94b8';
  ctx2.beginPath(); ctx2.moveTo(w.x, w.y); ctx2.lineTo(s.x, s.y); ctx2.lineTo(s.x, s.y - H); ctx2.lineTo(w.x, w.y - H); ctx2.closePath(); ctx2.fill();
  ctx2.fillStyle = 'rgba(255,255,255,0.18)';
  ctx2.beginPath(); ctx2.moveTo(w.x, w.y - H); ctx2.lineTo(s.x, s.y - H); ctx2.lineTo(s.x, s.y - H + 4); ctx2.lineTo(w.x, w.y - H + 4); ctx2.closePath(); ctx2.fill();
  // cara SE: más iluminada
  ctx2.fillStyle = '#aab4d8';
  ctx2.beginPath(); ctx2.moveTo(s.x, s.y); ctx2.lineTo(e.x, e.y); ctx2.lineTo(e.x, e.y - H); ctx2.lineTo(s.x, s.y - H); ctx2.closePath(); ctx2.fill();
  ctx2.fillStyle = 'rgba(255,255,255,0.22)';
  ctx2.beginPath(); ctx2.moveTo(s.x, s.y - H); ctx2.lineTo(e.x, e.y - H); ctx2.lineTo(e.x, e.y - H + 4); ctx2.lineTo(s.x, s.y - H + 4); ctx2.closePath(); ctx2.fill();
  // remate superior
  ctx2.fillStyle = '#c8d2ec';
  ctx2.beginPath(); ctx2.moveTo(n.x, n.y - H); ctx2.lineTo(e.x, e.y - H); ctx2.lineTo(s.x, s.y - H); ctx2.lineTo(w.x, w.y - H); ctx2.closePath(); ctx2.fill();
  ctx2.strokeStyle = 'rgba(30,38,64,0.55)'; ctx2.lineWidth = 1; ctx2.stroke();
  // zócalo con línea de acento
  ctx2.strokeStyle = 'rgba(0,180,220,0.4)';
  ctx2.beginPath(); ctx2.moveTo(w.x, w.y - 4); ctx2.lineTo(s.x, s.y - 4); ctx2.lineTo(e.x, e.y - 4); ctx2.stroke();
}

export function drawIProp(p, t) {
  const m = getCurrent();
  const g = P2(p.gx, p.gy);
  const x = g.x, y = g.y;
  switch (p.tipo) {
    case 'rack': {
      isoBox(p.gx - 0.35, p.gy - 0.3, 0.7, 0.6, 26, { l: '#141826', r: '#1b2136', t: '#2c3554' });
      const it = m ? m.inter.find(i => i.tipo === 'rack' && Math.abs(i.gx - p.gx) < 0.6) : null;
      const done = it ? it.done : true;
      for (let i = 0; i < 6; i++) {
        const on = done ? (hash2(i, Math.floor(t * 2)) > 0.2) : (hash2(i * 3, Math.floor(t * 5)) > 0.45);
        ctx2.fillStyle = done ? '#39ff88' : (on ? '#ffd97a' : '#262b3d');
        ctx2.fillRect(x - 3, y - 24 + i * 4, 6, 2);
      }
      break;
    }
    case 'desk': {
      isoBox(p.gx - 0.4, p.gy - 0.28, 0.8, 0.55, 13, { l: '#4a3320', r: '#5c4128', t: '#6b4a2f' });
      isoBox(p.gx - 0.12, p.gy - 0.22, 0.3, 0.08, 20, { l: '#10131f', r: '#10131f', t: '#7ac7ff' });
      ctx2.fillStyle = `rgba(0,200,255,${0.5 + 0.2 * Math.sin(t * 3 + p.gx)})`;
      ctx2.fillRect(x - 4, y - 22, 9, 6);
      break;
    }
    case 'mesa':
      isoBox(p.gx - p.data.w / 2, p.gy - p.data.d / 2, p.data.w, p.data.d, 11, { l: '#2c2013', r: '#3a2a18', t: '#4a3320' });
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
      ctx2.strokeStyle = '#c0392b';
      ctx2.beginPath(); ctx2.moveTo(x - 12, y - 32); ctx2.lineTo(x + 4, y - 38); ctx2.stroke();
      ctx2.strokeStyle = '#2980b9';
      ctx2.beginPath(); ctx2.moveTo(x - 12, y - 36); ctx2.lineTo(x + 8, y - 33); ctx2.stroke();
      break;
    }
    case 'pantalla': {
      const cs = ['#00f0ff', '#39ff88', '#ff2fb3'];
      const c = cs[(p.data && p.data.c || 0) % 3];
      ctx2.fillStyle = '#0a0d1a'; ctx2.fillRect(x - 15, y - 42, 30, 14);
      ctx2.strokeStyle = c; ctx2.strokeRect(x - 15.5, y - 42.5, 31, 15);
      ctx2.strokeStyle = c; ctx2.globalAlpha = 0.7;
      ctx2.beginPath();
      for (let i = 0; i <= 10; i++) {
        const px = x - 13 + i * 2.6;
        const py = y - 31 - (Math.sin(i * 1.3 + t * 2) * 3 + 4);
        i ? ctx2.lineTo(px, py) : ctx2.moveTo(px, py);
      }
      ctx2.stroke(); ctx2.globalAlpha = 1;
      break;
    }
    case 'consola': {
      isoBox(p.gx - 0.35, p.gy - 0.25, 0.7, 0.5, 12, { l: '#1a2036', r: '#232a46', t: '#2c3554' });
      isoBox(p.gx - 0.25, p.gy - 0.35, 0.5, 0.12, 19, { l: '#10131f', r: '#10131f', t: '#3a4a6a' });
      ctx2.fillStyle = `rgba(57,255,136,${0.4 + 0.3 * Math.sin(t * 4 + p.gx * 3)})`;
      ctx2.fillRect(x - 8, y - 21, 16, 3);
      break;
    }
    case 'sofa':
      isoBox(p.gx - 0.5, p.gy - 0.25, 1.0, 0.5, 9, { l: '#5a1f2a', r: '#7a2a38', t: '#9a3648' });
      isoBox(p.gx - 0.5, p.gy - 0.42, 1.0, 0.18, 15, { l: '#4a1a24', r: '#6a2430', t: '#8a3040' });
      break;
    case 'silla':
      isoBox(p.gx - 0.18, p.gy - 0.18, 0.36, 0.36, 8, { l: '#3a2a18', r: '#4a3320', t: '#5c4128' });
      isoBox(p.gx - 0.16, p.gy - 0.32, 0.32, 0.12, 14, { l: '#2c2013', r: '#3a2a18', t: '#4a3320' });
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
    case 'cama': {
      isoBox(p.gx - 0.55, p.gy - 0.5, 1.1, 0.95, 7, { l: '#3a2a18', r: '#4a3320', t: '#5c4128' });
      isoBox(p.gx - 0.5, p.gy - 0.45, 1.0, 0.85, 10, { l: '#7a2a38', r: '#9a3648', t: '#b04a5a' });
      isoBox(p.gx - 0.42, p.gy - 0.38, 0.5, 0.32, 12, { l: '#c8cdd8', r: '#e8e8f0', t: '#f4f6ff' });
      break;
    }
    case 'camilla': {
      isoBox(p.gx - 0.55, p.gy - 0.4, 1.1, 0.8, 9, { l: '#8a8f9f', r: '#aab0bf', t: '#e8f0ff' });
      isoBox(p.gx - 0.4, p.gy - 0.3, 0.4, 0.3, 12, { l: '#c8cdd8', r: '#e8e8f0', t: '#f4f6ff' });
      ctx2.strokeStyle = '#5a6070';
      ctx2.beginPath(); ctx2.moveTo(x - 10, y - 2); ctx2.lineTo(x - 10, y + 2); ctx2.moveTo(x + 10, y - 2); ctx2.lineTo(x + 10, y + 2); ctx2.stroke();
      break;
    }
    case 'mesanight':
      isoBox(p.gx - 0.18, p.gy - 0.18, 0.36, 0.36, 12, { l: '#3a2a18', r: '#4a3320', t: '#5c4128' });
      ctx2.fillStyle = '#ffd97a'; ctx2.fillRect(x - 1, y - 16, 2, 2);
      break;
    case 'lampara': {
      ctx2.strokeStyle = '#232a44'; ctx2.lineWidth = 2;
      ctx2.beginPath(); ctx2.moveTo(x, y); ctx2.lineTo(x, y - 20); ctx2.stroke();
      ctx2.lineWidth = 1;
      ctx2.fillStyle = `rgba(255,217,122,${0.5 + 0.3 * Math.sin(t * 2)})`;
      ctx2.beginPath(); ctx2.ellipse(x, y - 22, 5, 3, 0, 0, 7); ctx2.fill();
      ctx2.fillStyle = 'rgba(255,217,122,0.08)';
      ctx2.beginPath(); ctx2.ellipse(x, y, 14, 7, 0, 0, 7); ctx2.fill();
      break;
    }
    case 'tv': {
      ctx2.fillStyle = '#0a0d1a'; ctx2.fillRect(x - 12, y - 40, 24, 13);
      ctx2.fillStyle = `rgba(0,240,255,${0.65 + 0.25 * Math.sin(t * 5)})`;
      ctx2.fillRect(x - 10, y - 38, 20, 9);
      ctx2.fillStyle = '#0a0d1a';
      ctx2.fillRect(x - 2, y - 27, 4, 2);
      break;
    }
    case 'estante': {
      isoBox(p.gx - 0.35, p.gy - 0.28, 0.7, 0.55, 24, { l: '#2c2013', r: '#3a2a18', t: '#4a3320' });
      const cols = ['#c0392b', '#2980b9', '#27ae60', '#f39c12', '#8e44ad'];
      for (let i = 0; i < 4; i++) {
        ctx2.fillStyle = cols[(i + (p.gx * 3 | 0)) % 5];
        ctx2.fillRect(x - 4 + i * 3, y - 20, 2, 6);
      }
      for (let i = 0; i < 4; i++) {
        ctx2.fillStyle = cols[(i + (p.gy * 2 | 0) + 2) % 5];
        ctx2.fillRect(x - 4 + i * 3, y - 12, 2, 6);
      }
      break;
    }
    case 'vitrina': {
      isoBox(p.gx - 0.35, p.gy - 0.25, 0.7, 0.5, 18, { l: '#1a2036', r: '#232a46', t: 'rgba(160,220,255,0.5)' });
      ctx2.strokeStyle = 'rgba(200,240,255,0.6)';
      ctx2.beginPath(); ctx2.moveTo(x - 8, y - 4); ctx2.lineTo(x - 8, y - 16); ctx2.lineTo(x + 6, y - 22); ctx2.stroke();
      ctx2.fillStyle = '#ffd97a'; ctx2.fillRect(x - 4, y - 14, 3, 3);
      ctx2.fillStyle = '#ff9a3d'; ctx2.fillRect(x + 1, y - 12, 3, 3);
      break;
    }
    case 'maquina': {
      isoBox(p.gx - 0.22, p.gy - 0.2, 0.44, 0.4, 20, { l: '#2c2013', r: '#3a2a18', t: '#c0392b' });
      ctx2.fillStyle = `rgba(255,${140 + 60 * Math.sin(t * 4)},60,0.9)`;
      ctx2.fillRect(x - 2, y - 14, 4, 2);
      ctx2.fillStyle = '#e8e8f0'; ctx2.fillRect(x + 3, y - 8, 3, 3);
      break;
    }
    case 'caja':
      isoBox(p.gx - 0.22, p.gy - 0.22, 0.44, 0.44, 10, { l: '#8a6242', r: '#a87a52', t: '#c89a6a' });
      ctx2.strokeStyle = '#6a4a28';
      ctx2.beginPath(); ctx2.moveTo(x - 4, y - 12); ctx2.lineTo(x + 4, y - 6); ctx2.moveTo(x + 4, y - 12); ctx2.lineTo(x - 4, y - 6); ctx2.stroke();
      break;
    case 'pila': {
      isoBox(p.gx - 0.25, p.gy - 0.25, 0.5, 0.5, 9, { l: '#8a6242', r: '#a87a52', t: '#c89a6a' });
      isoBox(p.gx - 0.2, p.gy - 0.2, 0.4, 0.4, 17, { l: '#7a5638', r: '#986a46', t: '#b88a5a' });
      break;
    }
    case 'cinta': {
      const w = p.data && p.data.w || 4;
      isoBox(p.gx - w / 2, p.gy - 0.2, w, 0.4, 5, { l: '#1a2036', r: '#232a46', t: '#39466e' });
      for (let i = 0; i < w * 2; i++) {
        const ph2 = ((t * 1.2 + i / (w * 2)) % 1);
        ctx2.fillStyle = `rgba(0,240,255,${0.5 - ph2 * 0.4})`;
        ctx2.fillRect(x - w * 14 + i * 14 + ph2 * 10, y - 4, 2, 2);
      }
      break;
    }
    case 'puesto': {
      isoBox(p.gx - 0.45, p.gy - 0.3, 0.9, 0.6, 12, { l: '#4a3320', r: '#5c4128', t: '#6b4a2f' });
      for (let i = 0; i < 5; i++) {
        ctx2.fillStyle = i % 2 ? '#e63946' : '#f1f0ea';
        ctx2.fillRect(x - 14 + i * 6, y - 22, 6, 6);
      }
      ctx2.fillStyle = '#12101c'; ctx2.fillRect(x - 14, y - 16, 29, 1);
      const frutas = ['#ff5566', '#ffd23f', '#39ff88', '#ff9a3d'];
      for (let i = 0; i < 4; i++) {
        ctx2.fillStyle = frutas[(i + (p.data && p.data.c || 0)) % 4];
        ctx2.beginPath(); ctx2.arc(x - 10 + i * 6, y - 14, 2, 0, 7); ctx2.fill();
      }
      break;
    }
    case 'barra':
      isoBox(p.gx - 0.5, p.gy - 0.22, 1.0, 0.44, 12, { l: '#3a2a18', r: '#4a3320', t: '#7a4a30' });
      ctx2.fillStyle = '#c8cdd8'; ctx2.fillRect(x - 10, y - 16, 20, 2);
      break;
    case 'horno': {
      isoBox(p.gx - 0.22, p.gy - 0.22, 0.44, 0.44, 14, { l: '#2c2c34', r: '#3a3a44', t: '#4a4a55' });
      ctx2.fillStyle = `rgba(255,${120 + 60 * Math.sin(t * 6)},40,0.9)`;
      ctx2.fillRect(x - 3, y - 8, 6, 3);
      break;
    }
    case 'fregadero': {
      isoBox(p.gx - 0.3, p.gy - 0.24, 0.6, 0.48, 11, { l: '#3a4150', r: '#4a5262', t: '#5a6478' });
      ctx2.fillStyle = '#7ac7ff';
      ctx2.beginPath(); ctx2.ellipse(x, y - 12, 5, 2.4, 0, 0, 7); ctx2.fill();
      ctx2.strokeStyle = '#c8cdd8';
      ctx2.beginPath(); ctx2.moveTo(x, y - 14); ctx2.lineTo(x, y - 18); ctx2.lineTo(x + 3, y - 17); ctx2.stroke();
      break;
    }
    case 'inodoro': {
      isoBox(p.gx - 0.2, p.gy - 0.3, 0.4, 0.22, 16, { l: '#9aa3b0', r: '#c0c8d4', t: '#e8f0ff' });
      ctx2.fillStyle = '#f4f8ff';
      ctx2.beginPath(); ctx2.ellipse(x, y - 3, 5.5, 3.4, 0, 0, 7); ctx2.fill();
      ctx2.strokeStyle = '#9aa3b0'; ctx2.stroke();
      break;
    }
    case 'lavabo': {
      isoBox(p.gx - 0.18, p.gy - 0.16, 0.36, 0.32, 10, { l: '#9aa3b0', r: '#c0c8d4', t: '#e8f0ff' });
      ctx2.fillStyle = '#7ac7ff';
      ctx2.beginPath(); ctx2.ellipse(x, y - 11, 4, 2, 0, 0, 7); ctx2.fill();
      ctx2.strokeStyle = '#c8cdd8';
      ctx2.beginPath(); ctx2.moveTo(x, y - 13); ctx2.lineTo(x, y - 17); ctx2.lineTo(x + 2, y - 16); ctx2.stroke();
      break;
    }
    case 'ducha': {
      ctx2.fillStyle = 'rgba(160,200,230,0.35)';
      const n1 = P2(p.gx - 0.45, p.gy - 0.45), e1 = P2(p.gx + 0.45, p.gy - 0.45),
        s1 = P2(p.gx + 0.45, p.gy + 0.45), w1 = P2(p.gx - 0.45, p.gy + 0.45);
      ctx2.beginPath(); ctx2.moveTo(n1.x, n1.y); ctx2.lineTo(e1.x, e1.y); ctx2.lineTo(s1.x, s1.y); ctx2.lineTo(w1.x, w1.y); ctx2.closePath(); ctx2.fill();
      ctx2.strokeStyle = '#c0c8d4'; ctx2.lineWidth = 2;
      ctx2.beginPath(); ctx2.moveTo(x, y - 2); ctx2.lineTo(x, y - 26); ctx2.lineTo(x - 8, y - 26); ctx2.stroke();
      ctx2.lineWidth = 1;
      ctx2.fillStyle = '#8a9bb0'; ctx2.fillRect(x - 11, y - 28, 6, 2);
      for (let i = 0; i < 5; i++) {
        const dy = (t * 26 + i * 5) % 18;
        ctx2.fillStyle = `rgba(122,199,255,${0.75 - dy * 0.03})`;
        ctx2.fillRect(x - 9 + (i % 3) * 3, y - 25 + dy, 1.5, 3);
      }
      break;
    }
    case 'espejo': {
      ctx2.fillStyle = '#5a6478'; ctx2.fillRect(x - 9, y - 40, 18, 14);
      ctx2.fillStyle = '#9fd8e8'; ctx2.fillRect(x - 7.5, y - 38.5, 15, 11);
      ctx2.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx2.beginPath(); ctx2.moveTo(x - 5, y - 29); ctx2.lineTo(x + 1, y - 37); ctx2.stroke();
      break;
    }
    case 'caminadora': {
      isoBox(p.gx - 0.3, p.gy - 0.5, 0.6, 1.0, 4, { l: '#1a1d30', r: '#23273c', t: '#2c3050' });
      for (let i = 0; i < 4; i++) {
        const ph2 = ((t * 2 + i / 4) % 1);
        ctx2.fillStyle = `rgba(255,210,63,${0.5 - ph2 * 0.4})`;
        ctx2.fillRect(x - 4, y - 8 + ph2 * 10, 8, 1.5);
      }
      isoBox(p.gx - 0.3, p.gy - 0.65, 0.6, 0.16, 18, { l: '#10131f', r: '#10131f', t: '#39466e' });
      ctx2.fillStyle = '#39ff88'; ctx2.fillRect(x - 4, y - 24, 8, 2);
      break;
    }
    case 'pesa': {
      ctx2.fillStyle = '#2c3050';
      ctx2.fillRect(x - 6, y - 5, 12, 2);
      ctx2.fillRect(x - 8, y - 8, 3, 7); ctx2.fillRect(x + 5, y - 8, 3, 7);
      ctx2.fillStyle = '#39ff88'; ctx2.fillRect(x - 8, y - 8, 3, 2); ctx2.fillRect(x + 5, y - 8, 3, 2);
      break;
    }
    case 'cruz': {
      ctx2.fillStyle = '#e8f0ff'; ctx2.fillRect(x - 9, y - 42, 18, 16);
      ctx2.fillStyle = '#e63946';
      ctx2.fillRect(x - 2.5, y - 39, 5, 10); ctx2.fillRect(x - 6, y - 36.5, 12, 5);
      break;
    }
    case 'mesa_lab':
      isoBox(p.gx - 0.4, p.gy - 0.26, 0.8, 0.52, 12, { l: '#1a2036', r: '#232a46', t: '#39466e' });
      ctx2.fillStyle = '#7ae7ff'; ctx2.fillRect(x - 6, y - 15, 3, 3);
      ctx2.fillStyle = '#b8ff7a'; ctx2.fillRect(x + 2, y - 15, 3, 3);
      break;
    case 'matraz': {
      ctx2.fillStyle = 'rgba(230,240,255,0.25)';
      ctx2.beginPath(); ctx2.moveTo(x - 3, y - 12); ctx2.lineTo(x + 3, y - 12); ctx2.lineTo(x, y - 3); ctx2.closePath(); ctx2.fill();
      ctx2.fillStyle = ['#39ff88', '#00f0ff', '#ff2fb3', '#ffd23f'][((p.gx * 7 + p.gy * 3) | 0) % 4];
      ctx2.beginPath(); ctx2.moveTo(x - 2, y - 8); ctx2.lineTo(x + 2, y - 8); ctx2.lineTo(x, y - 4); ctx2.closePath(); ctx2.fill();
      if (Math.sin(t * 3 + p.gx) > 0.6) { ctx2.fillRect(x - 1, y - 11, 1, 2); }
      break;
    }
    case 'campana': {
      isoBox(p.gx - 0.5, p.gy - 0.1, 1.0, 0.2, 26, { l: '#8a8f9f', r: '#aab0bf', t: '#c8cdd8' });
      ctx2.fillStyle = `rgba(180,230,255,0.15)`;
      ctx2.fillRect(x - 14, y - 24, 28, 10);
      break;
    }
    case 'reactor': {
      const w = p.data && p.data.w || 2, d = p.data && p.data.d || 1.6;
      isoBox(p.gx - w / 2, p.gy - d / 2, w, d, 30, { l: '#1a2036', r: '#232a46', t: '#39466e' });
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.6);
      ctx2.fillStyle = `rgba(0,240,255,${0.55 + pulse * 0.35})`;
      ctx2.shadowColor = '#00f0ff'; ctx2.shadowBlur = 10;
      ctx2.fillRect(x - 8, y - 18, 16, 8);
      ctx2.shadowBlur = 0;
      ctx2.strokeStyle = `rgba(0,240,255,${0.35 + pulse * 0.3})`;
      ctx2.beginPath(); ctx2.ellipse(x, y - 2, 16 * (0.7 + pulse * 0.3), 6 * (0.7 + pulse * 0.3), 0, 0, 7); ctx2.stroke();
      break;
    }
    case 'armario': {
      isoBox(p.gx - 0.3, p.gy - 0.25, 0.6, 0.5, 28, { l: '#4a3320', r: '#5c4128', t: '#6b4a2f' });
      ctx2.strokeStyle = '#2c2013';
      ctx2.beginPath(); ctx2.moveTo(x, y - 24); ctx2.lineTo(x, y - 4); ctx2.stroke();
      ctx2.fillStyle = '#ffd23f';
      ctx2.fillRect(x - 3, y - 15, 1.5, 3); ctx2.fillRect(x + 2, y - 15, 1.5, 3);
      break;
    }
    case 'pc_casa': {
      isoBox(p.gx - 0.38, p.gy - 0.26, 0.76, 0.5, 12, { l: '#4a3320', r: '#5c4128', t: '#6b4a2f' });
      isoBox(p.gx - 0.1, p.gy - 0.2, 0.26, 0.06, 19, { l: '#10131f', r: '#10131f', t: '#2c3554' });
      ctx2.fillStyle = `rgba(57,255,136,${0.55 + 0.25 * Math.sin(t * 3)})`;
      ctx2.fillRect(x - 3, y - 21, 7, 5);
      break;
    }
    case 'cuadro': {
      ctx2.fillStyle = '#4a3320'; ctx2.fillRect(x - 8, y - 42, 16, 12);
      ctx2.fillStyle = '#7ac7ff'; ctx2.fillRect(x - 6, y - 40, 12, 8);
      ctx2.fillStyle = '#39ff88'; ctx2.fillRect(x - 4, y - 38, 5, 4);
      ctx2.fillStyle = '#ffd23f'; ctx2.fillRect(x + 2, y - 36, 3, 3);
      break;
    }
    case 'guirnalda': {
      for (let i = 0; i < 8; i++) {
        const px = x - 28 + i * 8;
        const py = y - 38 + Math.sin(i * 1.1) * 3;
        ctx2.fillStyle = ['#00f0ff', '#ff2fb3', '#ffd23f', '#39ff88'][i % 4];
        ctx2.shadowColor = ctx2.fillStyle; ctx2.shadowBlur = 4;
        ctx2.fillRect(px, py + Math.sin(t * 2 + i) * 1.5, 3, 3);
        ctx2.shadowBlur = 0;
      }
      break;
    }
  }
}
