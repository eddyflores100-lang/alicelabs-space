// ============================================================
// ALICE CITY v5 — REMAPEO URBANO (rejilla planificada)
// Calles de doble carril · aceras · cruces peatonales ·
// manzanas alineadas · props con intención, no tirados.
// ============================================================
import { hash2 } from './engine.js';

export const MAPC = 24, MAPR = 24;
export const T = { GRASS: 0, ROAD: 1, SIDE: 2, PLAZA: 3, CROSS: 4 };
export const tile = new Uint8Array(MAPC * MAPR);
export const solid = new Uint8Array(MAPC * MAPR);

export const ROADC = [3, 11, 19];   // columnas de avenidas verticales (pares c,c+1)
export const ROADR = [3, 11, 19];   // filas de avenidas horizontales

export const buildings = [];        // {gx,gy,w,d,h,sign,color,estilo,seed}
export const props = [];            // {tipo,gx,gy,solido,data}
export const crosswalks = new Set();
export const spots = {};            // puntos de interés / misiones
export const patrols = [];          // rutas NPC (loops de acera)
export const lightsPos = [];        // semáforos {gx,gy,axis}
export const distritos = [          // etiquetas vista estratégica
  { gx: 8, gy: 8, nombre: 'PLAZA CENTRAL', color: '#00f0ff' },
  { gx: 15.5, gy: 7.5, nombre: 'TECH CAMPUS', color: '#ff2fb3' },
  { gx: 8, gy: 15.5, nombre: 'MERCADO', color: '#ffb347' },
  { gx: 15.5, gy: 15.5, nombre: 'LOGÍSTICA', color: '#7a9bff' },
  { gx: 11.5, gy: 11.5, nombre: 'ALICE CITY', color: '#39ff88' }
];

const idx = (gx, gy) => gy * MAPC + gx;
export const inMap = (gx, gy) => gx >= 0 && gy >= 0 && gx < MAPC && gy < MAPR;
export const tAt = (gx, gy) => inMap(Math.floor(gx), Math.floor(gy)) ? tile[idx(Math.floor(gx), Math.floor(gy))] : -1;
export const isSolid = (gx, gy) => !inMap(Math.floor(gx), Math.floor(gy)) || solid[idx(Math.floor(gx), Math.floor(gy))] === 1;
export const isCross = (gx, gy) => crosswalks.has(idx(Math.floor(gx), Math.floor(gy)));
export const onRoad = (gx, gy) => { const t = tAt(gx, gy); return t === T.ROAD || t === T.CROSS; };

function setT(gx, gy, t) { if (inMap(gx, gy)) tile[idx(gx, gy)] = t; }
function setSolid(gx, gy) { if (inMap(gx, gy)) solid[idx(gx, gy)] = 1; }
function markCross(gx, gy) { if (inMap(gx, gy) && tile[idx(gx, gy)] === T.ROAD) { tile[idx(gx, gy)] = T.CROSS; crosswalks.add(idx(gx, gy)); } }

// anillo de acera de una manzana
function blockRing(x0, y0, x1, y1) {
  for (let x = x0; x <= x1; x++) { setT(x, y0, T.SIDE); setT(x, y1, T.SIDE); }
  for (let y = y0; y <= y1; y++) { setT(x0, y, T.SIDE); setT(x1, y, T.SIDE); }
}
// interior de manzana = plaza empedrada
function blockInner(x0, y0, x1, y1) {
  for (let y = y0 + 1; y < y1; y++) for (let x = x0 + 1; x < x1; x++) setT(x, y, T.PLAZA);
}

function B(gx, gy, w, d, h, sign, color, estilo) {
  buildings.push({ gx, gy, w, d, h, sign, color, estilo, seed: (gx * 7 + gy * 13 + w * 31) | 0 });
  for (let y = gy; y < gy + d; y++) for (let x = gx; x < gx + w; x++) setSolid(x, y);
}
function prop(tipo, gx, gy, solido = true, data = null) {
  props.push({ tipo, gx, gy, data });
  if (solido) setSolid(Math.floor(gx), Math.floor(gy));
}

// loop de acera para NPCs (sentido horario, por centros de tile)
function ringPts(x0, y0, x1, y1) {
  const p = [];
  for (let x = x0; x <= x1; x++) p.push([x + 0.5, y0 + 0.5]);
  for (let y = y0 + 1; y <= y1; y++) p.push([x1 + 0.5, y + 0.5]);
  for (let x = x1 - 1; x >= x0; x--) p.push([x + 0.5, y1 + 0.5]);
  for (let y = y1 - 1; y > y0; y--) p.push([x0 + 0.5, y + 0.5]);
  return p;
}

export function buildCity() {
  tile.fill(T.GRASS);
  solid.fill(0);

  // --- 1. AVENIDAS (doble carril cada una) ---
  for (const c of ROADC) for (let r = 0; r < MAPR; r++) { setT(c, r, T.ROAD); setT(c + 1, r, T.ROAD); }
  for (const r of ROADR) for (let c = 0; c < MAPC; c++) { setT(c, r, T.ROAD); setT(c, r + 1, T.ROAD); }

  // --- 2. MANZANAS: acera perimetral + interior empedrado ---
  blockRing(5, 5, 10, 10);  blockInner(5, 5, 10, 10);    // A Plaza Central
  blockRing(13, 5, 18, 10); blockInner(13, 5, 18, 10);   // B Tech Campus
  blockRing(5, 13, 10, 18); blockInner(5, 13, 10, 18);   // C Mercado
  blockRing(13, 13, 18, 18); blockInner(13, 13, 18, 18); // D Logística

  // --- 3. CRUCES PEATONALES (solo puntos autorizados) ---
  for (const c of ROADC) for (const r of [7, 16]) { markCross(c, r); markCross(c + 1, r); }
  for (const r of ROADR) for (const c of [7, 16]) { markCross(c, r); markCross(c, r + 1); }

  // --- 4. EDIFICIOS ALINEADOS (frente hacia el sur, puerta al sur-este) ---
  B(6, 6, 2, 2, 118, 'ALICE', '#00f0ff', 0);        // Torre Alice (HQ)
  B(14, 6, 2, 2, 84, 'DATA HUB', '#7ae7ff', 1);
  B(16, 6, 2, 2, 70, 'NEURAL', '#ff2fb3', 2);
  B(14, 8, 2, 2, 64, 'ANALYSIS', '#39ff88', 1);
  B(16, 8, 2, 2, 40, 'SRV-7', '#9aa3c0', 3);
  B(6, 14, 2, 2, 56, 'MERCADO', '#ffb347', 4);
  B(8, 14, 2, 2, 60, 'TU APTO', '#00f0ff', 2);      // tu apartamento (era SERVICIOS)
  B(14, 14, 2, 2, 44, 'LOGISTICA', '#7a9bff', 3);
  B(16, 14, 2, 2, 72, 'LABS', '#c17aff', 0);
  // casas del cinturón verde (interiores visitables)
  B(0, 6, 2, 2, 26, 'CASA-7', '#ff9a3d', 5);
  B(22, 18, 2, 2, 26, 'CASA-12', '#39ff88', 5);

  // puertas / puntos de misión
  spots.doorAlice = { gx: 8.35, gy: 7.0, label: 'TORRE ALICE · HQ' };
  spots.doorHub = { gx: 16.35, gy: 7.0, label: 'DATA HUB' };
  spots.doorNeural = { gx: 18.35, gy: 7.0, label: 'NEURAL CORE' };
  spots.doorAnalysis = { gx: 16.35, gy: 9.0, label: 'ANALYSIS CENTER' };
  spots.doorSrv = { gx: 18.35, gy: 8.6, label: 'SRV-7' };
  spots.doorMercado = { gx: 8.35, gy: 15.0, label: 'MERCADO' };
  spots.doorApto = { gx: 10.35, gy: 15.0, label: 'TU APTO' };
  spots.doorLogistica = { gx: 16.35, gy: 15.0, label: 'LOGÍSTICA' };
  spots.doorLabs = { gx: 18.35, gy: 15.0, label: 'AGENT LABS' };
  spots.doorCasa7 = { gx: 2.35, gy: 7.0, label: 'CASA-7' };
  spots.doorCasa12 = { gx: 21.65, gy: 18.5, label: 'CASA-12' };
  // alias histórico (misiones guardadas)
  spots.doorServicios = spots.doorApto;
  spots.q1a = { gx: 6.5, gy: 9.5, label: 'plaza·sur' };
  spots.q1b = { gx: 9.5, gy: 6.5, label: 'plaza·norte' };
  spots.q1c = { gx: 5.6, gy: 7.5, label: 'plaza·oeste' };
  spots.q5a = { gx: 5.3, gy: 5.3, label: 'cruce NW' };
  spots.q5b = { gx: 17.3, gy: 17.3, label: 'cruce SE' };
  spots.q8a = { gx: 1.5, gy: 1.5, label: 'cinturón NO' };
  spots.q8b = { gx: 22.5, gy: 1.5, label: 'cinturón NE' };
  spots.q8c = { gx: 1.5, gy: 22.5, label: 'cinturón SO' };
  spots.q8d = { gx: 22.5, gy: 22.5, label: 'cinturón SE' };

  // --- 5. MOBILIARIO URBANO (alineado, nunca tirado) ---
  // fuente central 2x2
  prop('fuente', 9, 9, true);
  for (let y = 8; y <= 9; y++) for (let x = 8; x <= 9; x++) setSolid(x, y);

  // farolas: cada manzana, lados que dan a calle, cada 3 tiles
  const farolas = [
    // bloque A
    [6, 5.15], [9, 5.15], [5.15, 8], [5.15, 10], [10.85, 6], [10.85, 9], [7, 10.85], [9, 10.85],
    // bloque B
    [14, 5.15], [17, 5.15], [13.15, 7], [13.15, 9], [18.85, 6], [18.85, 9], [15, 10.85], [17, 10.85],
    // bloque C
    [6, 13.15], [9, 13.15], [5.15, 15], [5.15, 17], [10.85, 14], [10.85, 17], [7, 18.85], [9, 18.85],
    // bloque D
    [14, 13.15], [17, 13.15], [13.15, 16], [13.15, 18], [18.85, 15], [18.85, 17], [15, 18.85], [17, 18.85],
    // cinturón frente a avenidas
    [2.85, 6], [2.85, 9], [21.15, 6], [21.15, 9], [2.85, 14], [2.85, 17], [21.15, 14], [21.15, 17],
    [7, 2.85], [16, 2.85], [7, 21.15], [16, 21.15]
  ];
  for (const f of farolas) prop('farola', f[0], f[1], true);

  // bancos: junto a plazas, orientados
  const bancos = [[6.5, 8.4, 0], [8.4, 10.5, 1], [14.5, 9.5, 0], [17.5, 9.5, 0],
                 [6.5, 16.8, 0], [9.5, 17.8, 1], [15.5, 17.8, 0], [17.8, 16.5, 1]];
  for (const b of bancos) prop('banco', b[0], b[1], true, { dir: b[2] });

  // papeleras junto a bancos
  prop('papelera', 7.4, 8.4); prop('papelera', 9.2, 10.5);
  prop('papelera', 15.3, 9.5); prop('papelera', 18.3, 9.5);
  prop('papelera', 7.3, 16.8); prop('papelera', 16.3, 17.8);

  // máquinas vending junto a puertas (siempre a la derecha de la puerta)
  prop('vending', 9.1, 9.1, true, { c: 0 }); prop('vending', 17.15, 7.9, true, { c: 1 });
  prop('vending', 9.15, 15.8, true, { c: 2 }); prop('vending', 17.15, 15.8, true, { c: 0 });

  // kioscos del mercado (fila ordenada)
  prop('kiosco', 6.5, 16.5, true, { c: 0 }); prop('kiosco', 8.5, 16.5, true, { c: 1 });

  // árboles: esquinas de manzanas + cinturón verde ordenado
  const arboles = [[6.2, 10.8], [9.8, 10.8], [14.2, 10.8], [17.8, 10.8],
                   [6.2, 18.8], [9.8, 18.8], [14.2, 18.8], [17.8, 18.8]];
  for (let r = 5; r <= 10; r += 2) { arboles.push([1.2, r + 0.5]); arboles.push([22.8, r + 0.5]); }
  for (let r = 13; r <= 18; r += 2) { arboles.push([1.2, r + 0.5]); arboles.push([22.8, r + 0.5]); }
  for (let c = 5; c <= 10; c += 2) { arboles.push([c + 0.5, 1.2]); arboles.push([c + 0.5, 22.8]); }
  for (let c = 13; c <= 18; c += 2) { arboles.push([c + 0.5, 1.2]); arboles.push([c + 0.5, 22.8]); }
  for (const a of arboles) {
    // los árboles NUNCA dentro de edificios (colisión ya marcada)
    if (solid[idx(Math.floor(a[0]), Math.floor(a[1]))] === 1) continue;
    prop('arbol', a[0], a[1], true, { big: hash2(a[0] * 10 | 0, a[1] * 10 | 0) > 0.5 });
  }

  // vallas publicitarias del cinturón (mensajes rotativos)
  prop('valla', 1.5, 11.5, true, { msg: 0 });   // reubicada: la CASA-7 ocupa (0..1, 6..7)
  prop('valla', 1.5, 16.5, true, { msg: 1 });
  prop('valla', 7.5, 1.5, true, { msg: 2 }); prop('valla', 16.5, 1.5, true, { msg: 3 });
  prop('valla', 22.5, 10.5, true, { msg: 4 }); prop('valla', 10.5, 22.5, true, { msg: 5 });

  // semáforos: 4 cruces centrales, esquinas NE y SO
  const inters = [[3, 3], [11, 3], [3, 11], [11, 11]];
  for (const it of inters) {
    lightsPos.push({ gx: it[0] + 2.2, gy: it[1] + 2.2, axis: 'V' });
    lightsPos.push({ gx: it[0] - 0.2, gy: it[1] - 0.2, axis: 'H' });
  }

  // taxi estacionado junto a la plaza (decorativo)
  prop('taxi', 10.4, 10.4, true);

  // --- 6. RUTAS NPC (solo aceras y cruces autorizados) ---
  patrols.push({ pts: ringPts(5, 5, 10, 10), dir: 1 });            // anillo A
  patrols.push({ pts: ringPts(5, 5, 10, 10), dir: -1 });           // anillo A inverso
  patrols.push({ pts: ringPts(13, 5, 18, 10), dir: 1 });           // anillo B
  patrols.push({ pts: ringPts(5, 13, 10, 18), dir: 1 });           // anillo C
  patrols.push({ pts: ringPts(13, 13, 18, 18), dir: -1 });         // anillo D
  patrols.push({ pts: [[7.5, 5.5], [7.5, 2.5], [16.5, 2.5], [16.5, 5.5], [13.5, 5.5], [10.5, 5.5]], dir: 1 });   // puente A<->B
  patrols.push({ pts: [[7.5, 10.5], [7.5, 13.5], [10.5, 13.5]], dir: 1 });                                        // puente A<->C
  patrols.push({ pts: [[16.5, 10.5], [16.5, 13.5], [14.5, 13.5]], dir: 1 });                                      // puente B<->D
  patrols.push({ pts: [[2.5, 5.5], [2.5, 9.5]], dir: 1 });          // cinturón oeste-norte
  patrols.push({ pts: [[21.5, 13.5], [21.5, 18.5]], dir: 1 });      // cinturón este-sur
  patrols.push({ pts: [[8.5, 6.5], [9.5, 6.5], [9.5, 7.5], [8.5, 7.5]], dir: 1 });   // paseo plaza norte
  patrols.push({ pts: [[6.5, 8.5], [7.5, 8.5], [7.5, 9.5], [6.5, 9.5]], dir: 1 });   // paseo plaza oeste
}

// fase semafórica: 0..14s → V verde 0-6, V ámbar 6-7, H verde 7-13, H ámbar 13-14
export function lightPhase(t) {
  const p = t % 14;
  if (p < 6) return { V: 2, H: 0 };      // 2=verde 1=ámbar 0=rojo
  if (p < 7) return { V: 1, H: 0 };
  if (p < 13) return { V: 0, H: 2 };
  return { V: 0, H: 1 };
}

// ---------- PUERTAS DE LA CIUDAD → INTERIORES ----------
// Cada puerta de edificio lleva a su propio mapa interior.
export const puertas = [
  { spot: 'doorAlice', mapa: 'hq', label: 'TORRE ALICE · HQ' },
  { spot: 'doorHub', mapa: 'hub', label: 'DATA HUB' },
  { spot: 'doorNeural', mapa: 'neural', label: 'NEURAL CORE' },
  { spot: 'doorAnalysis', mapa: 'analysis', label: 'ANALYSIS CENTER' },
  { spot: 'doorSrv', mapa: 'srv7', label: 'SRV-7' },
  { spot: 'doorMercado', mapa: 'mercado', label: 'MERCADO' },
  { spot: 'doorApto', mapa: 'apto', label: 'TU APTO' },
  { spot: 'doorLogistica', mapa: 'logistica', label: 'LOGÍSTICA' },
  { spot: 'doorLabs', mapa: 'labs', label: 'AGENT LABS' },
  { spot: 'doorCasa7', mapa: 'casa7', label: 'CASA-7' },
  { spot: 'doorCasa12', mapa: 'casa12', label: 'CASA-12' }
];
