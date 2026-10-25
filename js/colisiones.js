// ============ ALICE CITY v5 — Plan urbano maestro, colisiones y zebras ============
// Fuente única de verdad de la geometría de calles: world.js dibuja con esto,
// npc.js navega con esto, trafico.js conduce con esto.

export const PLAN = {
  LINEAS_V: [-75, 0, 75],   // carreteras N-S (x fija)
  LINEAS_H: [-75, 0, 75],   // carreteras E-O (z fija)
  ASFALTO: 4.5,             // semiancho de calzada
  ACERA_DE: 7,              // semiancho hasta el borde exterior de acera
  ACERA_OFF: 5.75,          // centro del andén (carril peatonal)
  LANE: 2.25,               // centro del carril de circulación
  ROTUNDA_IN: 15.2,         // radio interior del anillo de la rotonda
  ROTUNDA_OUT: 23.8,        // radio exterior
  LIMITE: 145,              // límite jugable
  EXT: 150,                 // largo de las carreteras desde el centro
};

// ---------- zebras (paso de cebra): lista compartida dibujo + navegación ----------
export const ZEBRAS = [];
for (const x0 of PLAN.LINEAS_V) {
  for (const z0 of PLAN.LINEAS_H) {
    if (x0 === 0 && z0 === 0) continue; // la rotonda tiene sus propias zebras
    ZEBRAS.push({ x: x0, z: z0 - 7, w: 9, d: 2.4 });    // brazo norte
    ZEBRAS.push({ x: x0, z: z0 + 7, w: 9, d: 2.4 });    // brazo sur
    ZEBRAS.push({ x: x0 - 7, z: z0, w: 2.4, d: 9 });    // brazo oeste
    ZEBRAS.push({ x: x0 + 7, z: z0, w: 2.4, d: 9 });    // brazo este
  }
}
// zebras radiales de la rotonda (cruzan el anillo por los ejes de los brazos,
// con anchura suficiente para cubrir también los hombros del paso)
ZEBRAS.push({ x: 0, z: 19.5, w: 16, d: 9 });
ZEBRAS.push({ x: 0, z: -19.5, w: 16, d: 9 });
ZEBRAS.push({ x: 19.5, z: 0, w: 9, d: 16 });
ZEBRAS.push({ x: -19.5, z: 0, w: 9, d: 16 });

export function enZebra(x, z) {
  for (const zb of ZEBRAS) {
    if (Math.abs(x - zb.x) <= zb.w / 2 + .5 && Math.abs(z - zb.z) <= zb.d / 2 + .5) return true;
  }
  return false;
}

export function enAsfalto(x, z) {
  if (Math.abs(x) > PLAN.EXT + 2 || Math.abs(z) > PLAN.EXT + 2) return false;
  for (const L of PLAN.LINEAS_V) if (Math.abs(x - L) < PLAN.ASFALTO + .4) return true;
  for (const L of PLAN.LINEAS_H) if (Math.abs(z - L) < PLAN.ASFALTO + .4) return true;
  const r = Math.hypot(x, z);
  return r > PLAN.ROTUNDA_IN - .3 && r < PLAN.ROTUNDA_OUT + .5;
}

// ---------- gestor de colisiones ----------
export const col = {
  cajas: [],        // { x0,x1,z0,z1 }
  circulos: [],     // { x,z,r }  agua/estanques: prohibidos caminar
  plataformas: [],  // { x0,x1,z0,z1,y }  suelo elevado transitable (muelle)
  registrar(x, z, w, d) {
    const c = { x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 };
    this.cajas.push(c); return c;
  },
  circulo(x, z, r) { this.circulos.push({ x, z, r }); },
  plataforma(x, z, w, d, y) { this.plataformas.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, y }); },
  // colisión de banco: solo el respaldo, para poder sentarse y levantarse
  banco(x, z, rot) {
    this.registrar(x - Math.sin(rot) * .3, z - Math.cos(rot) * .3, 1.7, .5);
  },
  enPlataforma(x, z) {
    for (const p of this.plataformas) if (x >= p.x0 && x <= p.x1 && z >= p.z0 && z <= p.z1) return true;
    return false;
  },
  alto(x, z) {
    for (const p of this.plataformas) if (x >= p.x0 && x <= p.x1 && z >= p.z0 && z <= p.z1) return p.y;
    return 0;
  },
  _enCaja(x, z, r) {
    for (const c of this.cajas) {
      const cx = Math.max(c.x0, Math.min(x, c.x1));
      const cz = Math.max(c.z0, Math.min(z, c.z1));
      const dx = x - cx, dz = z - cz;
      if (dx * dx + dz * dz < r * r) return true;
    }
    return false;
  },
  _enAgua(x, z, r) {
    for (const c of this.circulos) {
      const dx = x - c.x, dz = z - c.z, rr = c.r + r;
      if (dx * dx + dz * dz < rr * rr) return true;
    }
    return false;
  },
  // jugador: bloquea edificios y agua, PERO permite caminar sobre plataformas (muelle)
  libre(x, z, r = .45) {
    if (this._enCaja(x, z, r)) return false;
    if (this._enAgua(x, z, r) && !this.enPlataforma(x, z)) return false;
    return true;
  },
  // peatones NPC: nunca pisan plataformas ni agua
  libreSuelo(x, z, r = .45) {
    if (this._enCaja(x, z, r)) return false;
    if (this._enAgua(x, z, r)) return false;
    return true;
  },
  // movimiento con deslizamiento por ejes (jugador)
  mover(pos, dx, dz, r = .45) {
    if (dx !== 0 && this.libre(pos.x + dx, pos.z, r)) pos.x += dx;
    if (dz !== 0 && this.libre(pos.x, pos.z + dz, r)) pos.z += dz;
    pos.x = Math.max(-PLAN.LIMITE, Math.min(PLAN.LIMITE, pos.x));
    pos.z = Math.max(-PLAN.LIMITE, Math.min(PLAN.LIMITE, pos.z));
    return pos;
  },
};

// ---------- tramos de acera (para dibujar los bordillos) ----------
// Devuelve segmentos [a,b] a lo largo de cada línea de carretera, saltando
// los cuadros de intersección (allí van las zebras y las esquinas).
export function tramosAcera() {
  const cortes = [...PLAN.LINEAS_V, ...PLAN.LINEAS_H].sort((a, b) => a - b);
  const segs = [];
  let prev = -PLAN.EXT;
  for (const c of cortes) { segs.push([prev, c - PLAN.ACERA_DE]); prev = c + PLAN.ACERA_DE; }
  segs.push([prev, PLAN.EXT]);
  return segs.filter(([a, b]) => b - a > 1);
}
