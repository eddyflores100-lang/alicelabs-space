// ============================================================
// ALICE CITY v7 — REMAPEO METROPOLITANO (40×40)
// Ciudad GRANDE y holgada: 4 avenidas por eje de doble carril,
// 9 manzanas urbanas + cinturón verde perimetral, 17 puertas con
// interior. Nada amontonado: manzanas de 7×7 con corredores.
// ============================================================
import { hash2 } from './engine.js';

export const MAPC = 40, MAPR = 40;
export const T = { GRASS: 0, ROAD: 1, SIDE: 2, PLAZA: 3, CROSS: 4 };
export const tile = new Uint8Array(MAPC * MAPR);
export const solid = new Uint8Array(MAPC * MAPR);

export const ROADC = [5, 14, 23, 32];   // avenidas verticales (pares c,c+1)
export const ROADR = [5, 14, 23, 32];   // avenidas horizontales (pares r,r+1)
export const CROSSR = [8, 10, 12, 17, 21, 26, 30];  // cruces sobre avenidas V
export const CROSSC = [8, 10, 12, 17, 21, 26, 30];  // cruces sobre avenidas H
export const INTERSECT = [];             // centros de cruces semaforizados

export const buildings = [];        // {gx,gy,w,d,h,sign,color,estilo,seed}
export const props = [];            // {tipo,gx,gy,solido,data}
export const crosswalks = new Set();
export const spots = {};            // puntos de interés / misiones
export const patrols = [];          // rutas NPC (loops de acera)
export const lightsPos = [];        // semáforos {gx,gy,axis}
export const distritos = [          // etiquetas vista estratégica
  { gx: 10.5, gy: 12.5, nombre: 'PLAZA CENTRAL', color: '#00f0ff' },
  { gx: 19.5, gy: 10.5, nombre: 'TECH CAMPUS', color: '#ff2fb3' },
  { gx: 28.5, gy: 10.5, nombre: 'INNOVACIÓN', color: '#c17aff' },
  { gx: 10.5, gy: 19.5, nombre: 'MERCADO', color: '#ffb347' },
  { gx: 19.5, gy: 19.5, nombre: 'RESIDENCIAL', color: '#39ff88' },
  { gx: 28.5, gy: 19.5, nombre: 'LOGÍSTICA', color: '#7a9bff' },
  { gx: 10.5, gy: 28.5, nombre: 'PARQUE SUR', color: '#5aff9a' },
  { gx: 19.5, gy: 28.5, nombre: 'CLÍNICA SUR', color: '#e8f0ff' },
  { gx: 28.5, gy: 28.5, nombre: 'PLAZA ESTE', color: '#ffd23f' },
  { gx: 19.5, gy: 2.2, nombre: 'CINTURÓN NORTE', color: '#7ae7ff' },
  { gx: 19.5, gy: 37.6, nombre: 'CINTURÓN SUR', color: '#7ae7ff' },
  { gx: 2.2, gy: 19.5, nombre: 'CINTURÓN OESTE', color: '#7ae7ff' },
  { gx: 37.6, gy: 19.5, nombre: 'CINTURÓN ESTE', color: '#7ae7ff' }
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

// ============================================================
// CONSTRUCCIÓN DE LA CIUDAD
// ============================================================
export function buildCity() {
  tile.fill(T.GRASS);
  solid.fill(0);

  // --- 1. AVENIDAS (doble carril cada una) ---
  for (const c of ROADC) for (let r = 0; r < MAPR; r++) { setT(c, r, T.ROAD); setT(c + 1, r, T.ROAD); }
  for (const r of ROADR) for (let c = 0; c < MAPC; c++) { setT(c, r, T.ROAD); setT(c, r + 1, T.ROAD); }

  // --- 2. MANZANAS: acera perimetral + interior empedrado ---
  // bandas: [0-4] cinturón · [7-13] · [16-22] · [25-31] · [34-39] cinturón
  const Z = [[0, 4], [7, 13], [16, 22], [25, 31], [34, 39]];
  for (const [x0, x1] of Z) for (const [y0, y1] of Z) {
    blockRing(x0, y0, x1, y1);
    const esCinturon = x0 === 0 || x0 === 34 || y0 === 0 || y0 === 34;
    if (!esCinturon) blockInner(x0, y0, x1, y1);
  }

  // --- 3. CRUCES PEATONALES (autorizados sobre las avenidas) ---
  for (const c of ROADC) for (const r of CROSSR) { markCross(c, r); markCross(c + 1, r); }
  for (const r of ROADR) for (const c of CROSSC) { markCross(c, r); markCross(c, r + 1); }

  // ============================================================
  // 4. EDIFICIOS (17 puertas con interior) — manzana por manzana
  // ============================================================
  // --- PLAZA CENTRAL (7-13) ---
  B(8, 8, 3, 3, 150, 'ALICE', '#00f0ff', 0);                 // Torre Alice · HQ
  // --- TECH CAMPUS (16-22) ---
  B(17, 8, 2, 2, 92, 'DATA HUB', '#7ae7ff', 1);
  B(20, 8, 2, 2, 76, 'NEURAL', '#ff2fb3', 2);
  B(17, 11, 2, 2, 64, 'ANALYSIS', '#39ff88', 1);
  // --- INNOVACIÓN (25-31) ---
  B(26, 8, 2, 2, 74, 'AGENT LABS', '#c17aff', 0);
  B(29, 8, 2, 2, 40, 'SRV-7', '#9aa3c0', 3);
  B(26, 11, 2, 2, 54, 'GYM NEÓN', '#ffd23f', 4);
  B(29, 11, 2, 2, 60, 'AGENTS HUB', '#00f0ff', 1);       // v8.2: oficina de reunión de agentes
  // --- MERCADO (7-13 / 16-22) ---
  B(8, 17, 2, 2, 58, 'MERCADO', '#ffb347', 4);
  B(11, 17, 2, 2, 62, 'TU APTO', '#00f0ff', 2);
  B(8, 20, 2, 2, 36, 'CAFETERÍA', '#ff9a3d', 5);
  // --- RESIDENCIAL (16-22 / 16-22) ---
  B(17, 17, 2, 2, 70, 'RESIDENCIAS', '#7a9bff', 0);
  B(20, 17, 2, 2, 26, 'CASA-7', '#ff9a3d', 5);
  B(17, 20, 2, 2, 26, 'CASA-12', '#39ff88', 5);
  // --- LOGÍSTICA (25-31 / 16-22) ---
  B(26, 17, 3, 2, 50, 'LOGISTICA', '#7a9bff', 3);
  // --- SUR (16-22 / 25-31) ---
  B(17, 26, 2, 2, 58, 'CLÍNICA', '#39ff88', 1);
  // --- CINTURONES (suburbios) ---
  B(11, 1, 2, 2, 26, 'CASA-3', '#ff9a3d', 5);                // cinturón norte
  B(36, 18, 2, 2, 26, 'CASA-9', '#39ff88', 5);               // cinturón este

  // --- puertas / puntos de misión (cara SE de cada edificio) ---
  spots.doorAlice = { gx: 11.35, gy: 9.5, label: 'TORRE ALICE · HQ' };
  spots.doorHub = { gx: 19.35, gy: 9.0, label: 'DATA HUB' };
  spots.doorNeural = { gx: 22.35, gy: 9.0, label: 'NEURAL CORE' };
  spots.doorAnalysis = { gx: 19.35, gy: 12.0, label: 'ANALYSIS CENTER' };
  spots.doorLabs = { gx: 28.35, gy: 9.0, label: 'AGENT LABS' };
  spots.doorAgents = { gx: 31.35, gy: 12.0, label: 'AGENTS HUB' };
  spots.doorSrv = { gx: 31.35, gy: 9.0, label: 'SRV-7' };
  spots.doorGym = { gx: 28.35, gy: 12.0, label: 'GYM NEÓN' };
  spots.doorMercado = { gx: 10.35, gy: 18.0, label: 'MERCADO' };
  spots.doorApto = { gx: 13.35, gy: 18.0, label: 'TU APTO' };
  spots.doorCafe = { gx: 10.35, gy: 21.0, label: 'CAFETERÍA' };
  spots.doorResid = { gx: 19.35, gy: 18.0, label: 'RESIDENCIAS' };
  spots.doorCasa7 = { gx: 22.35, gy: 18.0, label: 'CASA-7' };
  spots.doorCasa12 = { gx: 19.35, gy: 21.0, label: 'CASA-12' };
  spots.doorLogistica = { gx: 29.35, gy: 18.0, label: 'LOGÍSTICA' };
  spots.doorClinica = { gx: 19.35, gy: 27.0, label: 'CLÍNICA' };
  spots.doorCasa3 = { gx: 13.35, gy: 2.0, label: 'CASA-3' };
  spots.doorCasa9 = { gx: 38.35, gy: 19.0, label: 'CASA-9' };
  // alias histórico (misiones guardadas)
  spots.doorServicios = spots.doorApto;
  // misiones
  spots.q1a = { gx: 7.6, gy: 11.5, label: 'plaza·oeste' };
  spots.q1b = { gx: 12.5, gy: 7.5, label: 'plaza·norte' };
  spots.q1c = { gx: 9.5, gy: 13.4, label: 'plaza·sur' };
  spots.q5a = { gx: 7.4, gy: 7.4, label: 'cruce NW' };
  spots.q5b = { gx: 25.4, gy: 25.4, label: 'cruce SE' };
  spots.q8a = { gx: 1.5, gy: 1.5, label: 'cinturón NO' };
  spots.q8b = { gx: 38.5, gy: 1.5, label: 'cinturón NE' };
  spots.q8c = { gx: 1.5, gy: 38.5, label: 'cinturón SO' };
  spots.q8d = { gx: 38.5, gy: 38.5, label: 'cinturón SE' };
  spots.q12a = { gx: 7.5, gy: 28.5, label: 'parque·oeste' };
  spots.q12b = { gx: 10.5, gy: 26.4, label: 'parque·norte' };
  spots.q12c = { gx: 12.5, gy: 30.5, label: 'parque·sureste' };

  // ============================================================
  // 5. MOBILIARIO URBANO (holgado: nunca sobre rutas de acera)
  // ============================================================
  // --- PLAZA CENTRAL: fuente + bancos + árboles ---
  for (let y = 10; y <= 11; y++) for (let x = 10; x <= 11; x++) setSolid(x, y);
  prop('fuente', 11, 11, false);
  prop('banco', 8.6, 11.5, true, { dir: 0 });
  prop('banco', 12.4, 11.5, true, { dir: 0 });
  prop('arbol', 8.4, 12.5, true, { big: true });
  prop('arbol', 12.6, 12.5, true, { big: false });
  prop('vending', 12.5, 9.3, true, { c: 0 });
  prop('papelera', 8.5, 9.4);

  // --- TECH CAMPUS: jardín interior ---
  prop('banco', 19.4, 10.5, true, { dir: 0 });
  prop('arbol', 21.5, 10.5, true, { big: true });
  prop('arbol', 18.5, 10.4, false);
  prop('vending', 19.2, 10.35, true, { c: 1 });

  // --- INNOVACIÓN: estacionamiento con autos ---
  prop('banco', 28.4, 10.5, true, { dir: 0 });
  prop('auto', 29.5, 11.55, true, { c: '#e63946' });
  prop('auto', 30.5, 11.55, true, { c: '#00b4d8' });
  prop('auto', 29.5, 12.45, true, { c: '#ffd23f' });
  prop('papelera', 31.3, 10.4);

  // --- MERCADO: kioscos en fila + vending ---
  prop('kiosco', 9.5, 19.5, true, { c: 0 });
  prop('kiosco', 11.5, 19.5, true, { c: 1 });
  prop('vending', 12.4, 18.4, true, { c: 2 });
  prop('arbol', 12.5, 20.5, false);

  // --- RESIDENCIAL: bancas de barrio ---
  prop('banco', 18.5, 19.5, true, { dir: 0 });
  prop('banco', 21.5, 19.5, true, { dir: 1 });
  prop('arbol', 21.5, 20.5, true, { big: false });
  prop('papelera', 18.4, 20.4);
  prop('vending', 20.4, 19.4, true, { c: 0 });

  // --- LOGÍSTICA: patio de cajas ---
  prop('pila', 30.4, 19.5, true);
  prop('pila', 30.4, 20.4, true);
  prop('caja', 29.4, 20.5, true);
  prop('caja', 30.5, 20.5, true);

  // --- PARQUE SUR: senderos en cruz + fuente + quiosco ---
  for (let x = 8; x <= 12; x++) setT(x, 28, T.PLAZA);
  for (let y = 26; y <= 30; y++) setT(10, y, T.PLAZA);
  for (let y = 26; y <= 27; y++) for (let x = 8; x <= 9; x++) setSolid(x, y);
  prop('fuente', 9, 27, false);
  prop('kiosco', 12.55, 29.45, true, { c: 0 });
  prop('banco', 11.5, 29.5, true, { dir: 0 });
  prop('banco', 12.5, 27.5, true, { dir: 1 });
  prop('arbol', 11.5, 26.5, true, { big: true });
  prop('arbol', 12.5, 26.4, false);
  prop('arbol', 8.5, 30.5, true, { big: false });
  prop('papelera', 9.4, 29.4);

  // --- CLÍNICA SUR: jardín de espera ---
  prop('banco', 19.4, 28.5, true, { dir: 0 });
  prop('arbol', 21.5, 28.5, false);
  prop('vending', 20.4, 28.4, true, { c: 1 });

  // --- PLAZA ESTE: fuente + valla gigante ---
  for (let y = 27; y <= 28; y++) for (let x = 27; x <= 28; x++) setSolid(x, y);
  prop('fuente', 28, 28, false);
  prop('banco', 29.5, 28.5, true, { dir: 0 });
  prop('valla', 29.5, 26.5, true, { msg: 0 });
  prop('arbol', 26.5, 29.5, true, { big: true });
  prop('arbol', 30.5, 30.5, false);

  // --- CINTURÓN VERDE: vallas publicitarias + árboles ordenados ---
  prop('valla', 8.5, 2.5, true, { msg: 0 });
  prop('valla', 17.5, 2.5, true, { msg: 2 });
  prop('valla', 26.5, 2.5, true, { msg: 4 });
  prop('valla', 2.5, 8.5, true, { msg: 1 });
  prop('valla', 2.5, 17.5, true, { msg: 3 });
  prop('valla', 2.5, 26.5, true, { msg: 5 });
  prop('valla', 37.5, 8.5, true, { msg: 2 });
  prop('valla', 37.5, 26.5, true, { msg: 0 });
  prop('valla', 8.5, 37.5, true, { msg: 3 });
  prop('valla', 26.5, 37.5, true, { msg: 5 });
  const arboles = [];
  for (let r = 7; r <= 31; r += 3) { arboles.push([1.5, r + 0.5], [3.5, r + 1.5], [36.5, r + 0.5], [38.5, r + 1.5]); }
  for (let c = 7; c <= 31; c += 3) { arboles.push([c + 0.5, 1.5], [c + 1.5, 3.5], [c + 0.5, 36.5], [c + 1.5, 38.5]); }
  for (const a of arboles) {
    if (solid[idx(Math.floor(a[0]), Math.floor(a[1]))] === 1) continue;
    if (tAt(a[0], a[1]) !== T.GRASS) continue;
    prop('arbol', a[0], a[1], true, { big: hash2(a[0] * 10 | 0, a[1] * 10 | 0) > 0.5 });
  }

  // --- FAROLAS (decorativas, no sólidas: nunca rompen rutas NPC) ---
  const farolas = [];
  for (const c of ROADC) for (const r of [7, 12, 16, 21, 25, 30]) farolas.push([c - 0.38, r + 0.5], [c + 2.38, r + 0.5]);
  for (const r of ROADR) for (const c of [7, 12, 16, 21, 25, 30]) farolas.push([c + 0.5, r - 0.38], [c + 0.5, r + 2.38]);
  for (const f of farolas) prop('farola', f[0], f[1], false);

  // --- SEMÁFOROS en los 9 cruces centrales (decorativos) ---
  for (const c of [5, 14, 23]) for (const r of [5, 14, 23]) {
    INTERSECT.push([c + 1, r + 1]);
    lightsPos.push({ gx: c + 1.62, gy: r + 1.62, axis: 'V' });
    lightsPos.push({ gx: c - 0.38, gy: r - 0.38, axis: 'H' });
  }

  // taxi estacionado junto a la plaza central
  prop('taxi', 11.55, 13.3, true);

  // ============================================================
  // 6. RUTAS NPC (solo aceras, plazas y cruces autorizados)
  // ============================================================
  // anillos de las 9 manzanas urbanas
  patrols.push({ pts: ringPts(7, 7, 13, 13), dir: 1 });
  patrols.push({ pts: ringPts(7, 7, 13, 13), dir: -1 });
  patrols.push({ pts: ringPts(16, 7, 22, 13), dir: 1 });
  patrols.push({ pts: ringPts(16, 7, 22, 13), dir: -1 });
  patrols.push({ pts: ringPts(25, 7, 31, 13), dir: 1 });
  patrols.push({ pts: ringPts(7, 16, 13, 22), dir: 1 });
  patrols.push({ pts: ringPts(16, 16, 22, 22), dir: 1 });
  patrols.push({ pts: ringPts(16, 16, 22, 22), dir: -1 });
  patrols.push({ pts: ringPts(25, 16, 31, 22), dir: 1 });
  patrols.push({ pts: ringPts(7, 25, 13, 31), dir: 1 });
  patrols.push({ pts: ringPts(7, 25, 13, 31), dir: -1 });
  patrols.push({ pts: ringPts(16, 25, 22, 31), dir: 1 });
  patrols.push({ pts: ringPts(25, 25, 31, 31), dir: 1 });
  // anillos del cinturón
  patrols.push({ pts: ringPts(0, 0, 4, 4), dir: 1 });
  patrols.push({ pts: ringPts(34, 0, 39, 4), dir: 1 });
  patrols.push({ pts: ringPts(0, 34, 4, 39), dir: 1 });
  patrols.push({ pts: ringPts(34, 34, 39, 39), dir: 1 });
  patrols.push({ pts: ringPts(0, 7, 4, 13), dir: 1 });
  patrols.push({ pts: ringPts(34, 16, 39, 22), dir: 1 });
  // puentes entre manzanas (SOLO por cruces autorizados)
  patrols.push({ pts: [[13.5, 8.5], [16.5, 8.5]], dir: 1 });      // A<->B
  patrols.push({ pts: [[13.5, 12.5], [16.5, 12.5]], dir: -1 });   // A<->B
  patrols.push({ pts: [[22.5, 8.5], [25.5, 8.5]], dir: 1 });      // B<->C
  patrols.push({ pts: [[31.5, 8.5], [34.5, 8.5]], dir: 1 });      // C<->cinturón E
  patrols.push({ pts: [[8.5, 13.5], [8.5, 16.5]], dir: 1 });      // A<->D
  patrols.push({ pts: [[12.5, 13.5], [12.5, 16.5]], dir: -1 });   // A<->D
  patrols.push({ pts: [[17.5, 13.5], [17.5, 16.5]], dir: 1 });    // B<->E
  patrols.push({ pts: [[26.5, 13.5], [26.5, 16.5]], dir: 1 });    // C<->F
  patrols.push({ pts: [[8.5, 22.5], [8.5, 25.5]], dir: 1 });      // D<->G
  patrols.push({ pts: [[17.5, 22.5], [17.5, 25.5]], dir: 1 });    // E<->H
  patrols.push({ pts: [[26.5, 22.5], [26.5, 25.5]], dir: 1 });    // F<->I
  patrols.push({ pts: [[8.5, 4.5], [8.5, 7.5]], dir: 1 });        // A<->cinturón N
  patrols.push({ pts: [[4.5, 17.5], [7.5, 17.5]], dir: 1 });      // D<->cinturón O
  patrols.push({ pts: [[10.5, 31.5], [10.5, 34.5]], dir: 1 });    // G<->cinturón S
  patrols.push({ pts: [[22.5, 17.5], [25.5, 17.5]], dir: 1 });    // E<->F
  // paseos internos de plazas
  patrols.push({ pts: [[8.5, 12.5], [12.5, 12.5]], dir: 1 });     // plaza central sur
  patrols.push({ pts: [[17.5, 9.5], [21.5, 9.5]], dir: 1 });      // campus corredor
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
export const puertas = [
  { spot: 'doorAlice', mapa: 'hq', label: 'TORRE ALICE · HQ' },
  { spot: 'doorHub', mapa: 'hub', label: 'DATA HUB' },
  { spot: 'doorNeural', mapa: 'neural', label: 'NEURAL CORE' },
  { spot: 'doorAnalysis', mapa: 'analysis', label: 'ANALYSIS CENTER' },
  { spot: 'doorLabs', mapa: 'labs', label: 'AGENT LABS' },
  { spot: 'doorAgents', mapa: 'agenthub', label: 'AGENTS HUB' },
  { spot: 'doorSrv', mapa: 'srv7', label: 'SRV-7' },
  { spot: 'doorGym', mapa: 'gym', label: 'GYM NEÓN' },
  { spot: 'doorMercado', mapa: 'mercado', label: 'MERCADO' },
  { spot: 'doorApto', mapa: 'apto', label: 'TU APTO' },
  { spot: 'doorCafe', mapa: 'cafeteria', label: 'CAFETERÍA' },
  { spot: 'doorResid', mapa: 'apto2', label: 'RESIDENCIAS' },
  { spot: 'doorCasa7', mapa: 'casa7', label: 'CASA-7' },
  { spot: 'doorCasa12', mapa: 'casa12', label: 'CASA-12' },
  { spot: 'doorLogistica', mapa: 'logistica', label: 'LOGÍSTICA' },
  { spot: 'doorClinica', mapa: 'clinica', label: 'CLÍNICA' },
  { spot: 'doorCasa3', mapa: 'casa3', label: 'CASA-3' },
  { spot: 'doorCasa9', mapa: 'casa9', label: 'CASA-9' }
];
