// ============ ALICE CITY v5 — Agentes que caminan por la ciudad de verdad ============
// Navegación por grafo peatonal: aceras, zebras en los cruces, caminos de distrito
// y anillo de la rotonda. Se sientan SOLO en bancos (sobre el asiento), minan en
// las minas, trabajan en los puestos del mercado y jamás atraviesan edificios.
import * as THREE from 'three';
import { crearPersonaje, personajeAleatorio, crearPlaca, ROLES } from './characters.js';
import { PLAN, col, enAsfalto, enZebra, tramosAcera } from './colisiones.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const elegir = (arr) => arr[(Math.random() * arr.length) | 0];
const PIE = Math.PI;
const SIT_Y = .31; // caderas .52 − hundido .34 + asiento .49 − .18 → sobre el banco

const NOMBRES = ['Zolo', 'Pixel', 'Lupa', 'Chispa', 'Turbo', 'Nova', 'Dato', 'Volt', 'Nube', 'Bits',
  'Kiko', 'Lila', 'Rex', 'Mora', 'Iris', 'Teo', 'Nala', 'Gizmo', 'Luz', 'Chip', 'Vega', 'Rulo', 'Puma', 'Mango'];
const DUEÑOS = ['@eddy', '@maria', '@carlos', '@lucia', '@juan', '@sofia', '@mario', '@ana', '@pedro', '@valeria',
  '@luis', '@camila', '@diego', '@paula', '@jorge', '@sara', '@andres', '@emma', '@nicolas', '@julia', '@oscar', '@raquel', '@ivan', '@dani'];

export const ETIQUETAS_ESTADO = {
  pasear: '🚶 Paseando',
  minar: '⛏️ Minando monedas',
  trabajar: '💼 Trabajando en el mercado',
  relajar: '😎 Relajándose en el parque',
  ir: '🚶 Caminando…',
};

const DIALOGOS = {
  minero: [
    'Los cristales más ricos están al fondo de la mina.',
    'Miné 12 cristales hoy. Mi dueño está orgulloso.',
    'Si el ánimo está alto, minas el doble. Ponte a descansar.',
  ],
  constructor: [
    'Tu parcela del norte está esperando una casa bonita.',
    'Con mi rol, construyes 30% más barato.',
    'Un día estas casas se pagarán con Alicoins de verdad.',
  ],
  corredor: [
    'Corro por toda la ciudad… ¡hasta la Torre Alice!',
    '¿Has visto el lago? Los veleros nunca se cansan.',
    'Cada distrito esconde algo. Explora, agente.',
  ],
  cocinero: [
    'Los contratos del mercado son pan comido… ¡y pizza!',
    'Mi dueño dice que pronto cobraremos en Solana. ¿Solana?',
    'Trabajar para AliceLabs tiene sus ventajas.',
  ],
  artista: [
    'Pinté el atardecer del lago. Salieron Alicoins dorados.',
    'La ciudad es mi lienzo, agente.',
    'Dicen que hay luciérnagas en el bosque del norte.',
  ],
  generico: [
    '¡Bienvenido a ALICE CITY, agente!',
    'Dicen que la Torre Alice toca el cielo.',
    'Completa tareas y gana Alicoins 🪙',
    'Pronto pagaremos todo con Alicoins reales.',
    '¿Ya decoraste tu avatar? Yo tengo sombrero nuevo.',
  ],
};

function crearBurbuja(texto) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(10,20,26,.88)';
  g.beginPath(); g.roundRect(8, 10, 496, 84, 22); g.fill();
  g.beginPath(); g.moveTo(230, 94); g.lineTo(256, 122); g.lineTo(282, 94); g.closePath(); g.fill();
  g.fillStyle = '#fff'; g.font = '700 30px "Segoe UI", sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(texto.slice(0, 46), 256, 53);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
  s.scale.set(3.4, .85, 1); s.renderOrder = 30;
  return s;
}

function crearPajaro(color) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: .8, side: THREE.DoubleSide });
  const cuerpo = new THREE.Mesh(new THREE.ConeGeometry(.12, .5, 5), mat);
  cuerpo.rotation.x = PIE / 2; g.add(cuerpo);
  const alaGeo = new THREE.PlaneGeometry(.5, .22);
  const alaI = new THREE.Mesh(alaGeo, mat); alaI.position.x = -.26; g.add(alaI);
  const alaD = new THREE.Mesh(alaGeo, mat); alaD.position.x = .26; g.add(alaD);
  g.userData.alas = [alaI, alaD];
  return g;
}

// ============================================================
// GRAFO PEATONAL
// ============================================================
function construirGrafo(bancos, zonas2) {
  const nodos = [];
  const claves = new Map();
  const ady = [];

  function add(x, z) {
    const k = `${Math.round(x * 2) / 2}|${Math.round(z * 2) / 2}`;
    if (claves.has(k)) return claves.get(k);
    // nunca sobre asfalto salvo zebra
    if (enAsfalto(x, z) && !enZebra(x, z)) return -1;
    const i = nodos.length;
    nodos.push({ x, z });
    ady.push([]);
    claves.set(k, i);
    return i;
  }
  function conecta(a, b) {
    if (a < 0 || b < 0 || a === b) return;
    if (ady[a].includes(b)) return;
    if (!segmentoOk(nodos[a], nodos[b])) return;
    ady[a].push(b); ady[b].push(a);
  }
  function conectaDirecto(a, b) {
    if (a < 0 || b < 0 || a === b) return;
    if (ady[a].includes(b)) return;
    ady[a].push(b); ady[b].push(a);
  }

  function segmentoOk(n1, n2) {
    const d = Math.hypot(n2.x - n1.x, n2.z - n1.z);
    const n = Math.max(1, Math.ceil(d / 1.5));
    for (let i = 0; i <= n; i++) {
      const x = n1.x + (n2.x - n1.x) * i / n, z = n1.z + (n2.z - n1.z) * i / n;
      if (!col.libreSuelo(x, z, .55)) return false;
      if (enAsfalto(x, z) && !enZebra(x, z)) return false;
    }
    return true;
  }

  // ----- 1. aceras de las 6 avenidas -----
  const tramos = tramosAcera();
  for (const L of PLAN.LINEAS_V) {
    for (const s of [-1, 1]) {
      for (const [a, b] of tramos) {
        for (let z = a; z < b; z += 10) add(L + s * PLAN.ACERA_OFF, z);
        add(L + s * PLAN.ACERA_OFF, b);
      }
    }
  }
  for (const L of PLAN.LINEAS_H) {
    for (const s of [-1, 1]) {
      for (const [a, b] of tramos) {
        for (let x = a; x < b; x += 10) add(x, L + s * PLAN.ACERA_OFF);
        add(b, L + s * PLAN.ACERA_OFF);
      }
    }
  }

  // ----- 2. rotonda: isla, anillo peatonal y puentes con zebra -----
  for (let i = 0; i < 8; i++) { const a = (i / 8) * PIE * 2 + PIE / 8; add(Math.cos(a) * 8, Math.sin(a) * 8); }
  const anillo26 = [];
  for (let i = 0; i < 16; i++) { const a = (i / 16) * PIE * 2; anillo26.push(add(Math.cos(a) * 26.5, Math.sin(a) * 26.5)); }
  for (const [x, z] of [[0, 19.5], [0, -19.5], [19.5, 0], [-19.5, 0]]) add(x, z);
  for (const s of [-1, 1]) {
    for (const p of [12.5, 19.5, 26.5]) { add(s * 5.75, p); add(p, s * 5.75); }
  }
  // puentes explícitos isla ↔ zebra ↔ anillo
  for (const [x1, z1, x2, z2] of [
    [0, 8, 0, 19.5], [0, 19.5, 0, 26.5], [0, -8, 0, -19.5], [0, -19.5, 0, -26.5],
    [8, 0, 19.5, 0], [19.5, 0, 26.5, 0], [-8, 0, -19.5, 0], [-19.5, 0, -26.5, 0],
    [5.75, 7, 5.75, 12.5], [5.75, 12.5, 5.75, 19.5], [5.75, 19.5, 5.75, 26.5],
    [-5.75, 7, -5.75, 12.5], [-5.75, 12.5, -5.75, 19.5], [-5.75, 19.5, -5.75, 26.5],
    [5.75, -7, 5.75, -12.5], [5.75, -12.5, 5.75, -19.5], [5.75, -19.5, 5.75, -26.5],
    [-5.75, -7, -5.75, -12.5], [-5.75, -12.5, -5.75, -19.5], [-5.75, -19.5, -5.75, -26.5],
    [7, 5.75, 12.5, 5.75], [12.5, 5.75, 19.5, 5.75], [19.5, 5.75, 26.5, 5.75],
    [7, -5.75, 12.5, -5.75], [12.5, -5.75, 19.5, -5.75], [19.5, -5.75, 26.5, -5.75],
    [-7, 5.75, -12.5, 5.75], [-12.5, 5.75, -19.5, 5.75], [-19.5, 5.75, -26.5, 5.75],
    [-7, -5.75, -12.5, -5.75], [-12.5, -5.75, -19.5, -5.75], [-19.5, -5.75, -26.5, -5.75],
  ]) conectaDirecto(add(x1, z1), add(x2, z2));

  // ----- 3. zebras de los 8 cruces de la cuadrícula -----
  for (const x0 of PLAN.LINEAS_V) {
    for (const z0 of PLAN.LINEAS_H) {
      if (x0 === 0 && z0 === 0) continue;
      conectaDirecto(add(x0 - PLAN.ACERA_OFF, z0 - 7), add(x0 + PLAN.ACERA_OFF, z0 - 7));
      conectaDirecto(add(x0 - PLAN.ACERA_OFF, z0 + 7), add(x0 + PLAN.ACERA_OFF, z0 + 7));
      conectaDirecto(add(x0 - 7, z0 - PLAN.ACERA_OFF), add(x0 - 7, z0 + PLAN.ACERA_OFF));
      conectaDirecto(add(x0 + 7, z0 - PLAN.ACERA_OFF), add(x0 + 7, z0 + PLAN.ACERA_OFF));
    }
  }

  // ----- 4. plazas y caminos de distrito (cadenas explícitas) -----
  const cadenas = [
    // mercado (38,38): octágono de la plaza
    [29, 29, 37, 29], [37, 29, 47, 29], [47, 29, 47, 37], [47, 37, 47, 46.3],
    [47, 46.3, 37, 46.3], [37, 46.3, 29, 46.3], [29, 46.3, 29, 37], [29, 37, 29, 29],
    [33, 38, 37, 38], [43, 38, 47, 38], [33, 38, 43, 38],
    // mercado → aceras
    [37, 29, 37, 17], [37, 17, 37, 5.75],
    [47, 38, 58, 38], [58, 38, 69.25, 37],
    [37, 46.3, 37, 58], [37, 58, 37, 69.25],
    [29, 38, 17, 38], [17, 38, 5.75, 37],
    // mina (−38,−38): núcleo → portal → plaza / avenida oeste
    [-29, -29, -18, -18], [-18, -18, -8, -8], [-8, -8, -5.75, -8],
    [-29, -29, -43, -38], [-43, -38, -47, -38], [-47, -38, -58, -38], [-58, -38, -69.25, -38],
    // parque (−38,38): anillo r8 y salidas
    [-30, 38, -38, 30], [-38, 30, -46, 38], [-46, 38, -38, 46], [-38, 46, -30, 38],
    [-30, 38, -18, 38], [-18, 38, -8, 38], [-8, 38, -5.75, 37],
    [-38, 30, -37, 17], [-37, 17, -37, 5.75],
    [-46, 38, -58, 38], [-58, 38, -69.25, 37],
    [-38, 46, -37, 58], [-37, 58, -37, 69.25],
    // downtown (114,−114)
    [106, -114, 92, -114], [92, -114, 80.75, -114],
    [114, -106, 114, -92], [114, -92, 114, -80.75],
    [106, -114, 114, -106], [114, -106, 122, -114], [122, -114, 114, -122], [114, -122, 106, -114],
    // lago (−114,114)
    [-86, 114, -80.75, 114], [-114, 86, -114, 80.75],
    [-86, 114, -106, 94], [-106, 94, -122, 94], [-122, 94, -142, 114], [-142, 114, -122, 134],
    [-122, 134, -106, 134], [-106, 134, -86, 114],
    [-114, 86, -94, 106], [-94, 106, -94, 122], [-94, 122, -114, 142], [-114, 142, -134, 122],
    [-134, 122, -134, 106], [-134, 106, -114, 86],
    // bosque (−114,−114): anillo r12.6 y salidas
    [-102, -114, -92, -114], [-92, -114, -80.75, -114],
    [-114, -102, -114, -92], [-114, -92, -114, -80.75],
  ];
  for (const [x1, z1, x2, z2] of cadenas) conectaDirecto(add(x1, z1), add(x2, z2));
  // anillos del lago y bosque
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * PIE * 2 + PIE / 8;
    add(-114 + Math.cos(a) * 28, 114 + Math.sin(a) * 28);
    add(-114 + Math.cos(a) * 12.6, -114 + Math.sin(a) * 12.6);
  }

  // ----- 5. aristas por proximidad (cadenas de acera, anillos, islas) -----
  for (let i = 0; i < nodos.length; i++) {
    for (let j = i + 1; j < nodos.length; j++) {
      const dx = nodos[i].x - nodos[j].x, dz = nodos[i].z - nodos[j].z;
      if (dx * dx + dz * dz < 121) conecta(i, j); // radio 11
    }
  }

  // ----- 6. bancos: frente del banco conectado al nodo más cercano -----
  for (const b of bancos) {
    const fx = b.x + Math.sin(b.rot) * .95, fz = b.z + Math.cos(b.rot) * .95;
    let mejor = -1, mejorD = 7;
    for (let i = 0; i < nodos.length; i++) {
      const d = Math.hypot(nodos[i].x - fx, nodos[i].z - fz);
      if (d < mejorD) { mejorD = d; mejor = i; }
    }
    const ni = add(fx, fz);
    if (ni >= 0 && mejor >= 0) conectaDirecto(ni, mejor);
  }

  function camino(ori, dest) {
    if (ori < 0 || dest < 0) return null;
    if (ori === dest) return [dest];
    const prev = new Array(nodos.length).fill(-2);
    prev[ori] = -1;
    const cola = [ori];
    while (cola.length) {
      const a = cola.shift();
      if (a === dest) break;
      for (const b of ady[a]) if (prev[b] === -2) { prev[b] = a; cola.push(b); }
    }
    if (prev[dest] === -2) return null;
    const ruta = [];
    let a = dest;
    while (a !== -1) { ruta.unshift(a); a = prev[a]; }
    return ruta;
  }
  function nodoCercano(x, z, maxD = 30) {
    let mejor = -1, mejorD = maxD;
    for (let i = 0; i < nodos.length; i++) {
      const d = Math.hypot(nodos[i].x - x, nodos[i].z - z);
      if (d < mejorD) { mejorD = d; mejor = i; }
    }
    return mejor;
  }
  return { nodos, ady, camino, nodoCercano, add };
}

// ============================================================
export function crearNPCs(escena, mundo, distritos = null) {
  const npcs = [];
  const PIE2 = Math.PI;

  const bancos = mundo.bancosPos || [];
  const z2 = distritos ? distritos.zonas : {};
  const grafo = construirGrafo(bancos, z2);

  // puntos de interés con ancla exacta
  const POIS = {
    mina: [[-34.5, -34.5], [-43, -38], [-33, -41], [-41, -33]],
    puesto: [[28, 35.6], [38, 35.6], [48, 35.6], [28, 40.4], [38, 40.4], [48, 40.4], [38, 45.3]],
    downtown: [[106, -114], [122, -114], [114, -106], [114, -122]],
    lago: [[-86, 114], [-106, 94], [-122, 134], [-94, 106], [-134, 122]],
    bosque: [[-102, -114], [-114, -102], [-126, -114], [-114, -126]],
    plaza: [[0, 10], [-10, 4], [8, -8], [-6, 9]],
  };

  const tipos = ['pasear', 'pasear', 'minar', 'trabajar', 'relajar', 'visitar'];
  for (let i = 0; i < 24; i++) {
    const tipoBase = tipos[i % tipos.length];
    const cfg = personajeAleatorio();
    cfg.nombre = NOMBRES[i];
    cfg.rol = elegir(Object.keys(ROLES));
    const pj = crearPersonaje(cfg);
    // spawn sobre un nodo de acera
    const ni = (Math.random() * grafo.nodos.length) | 0;
    const n0 = grafo.nodos[ni];
    pj.grupo.position.set(n0.x, 0, n0.z);
    escena.add(pj.grupo);

    const placa = crearPlaca(cfg.nombre, ROLES[cfg.rol].nombre === 'MINERO' ? '#00F299' :
      ROLES[cfg.rol].nombre === 'CONSTRUCTOR' ? '#ff9f43' : ROLES[cfg.rol].nombre === 'ARTISTA' ? '#fb2c36' : '#00d1ff');
    placa.position.y = 1.95; pj.grupo.add(placa);

    const npc = {
      id: i, nombre: cfg.nombre, rol: cfg.rol, dueño: DUEÑOS[i], pj,
      estado: 'ir', tipo: tipoBase,
      ruta: null, paso: 0, ancla: null,
      timer: rnd(0, 3), velocidad: rnd(2.1, 2.9),
      recuento: 0, sentado: null,
      etiqueta() { return ETIQUETAS_ESTADO[this.estado === 'ir' ? 'pasear' : this.estado] || '🚶'; },
      hablar() {
        const banco = [...(DIALOGOS[cfg.rol] || []), ...DIALOGOS.generico];
        const linea = banco[(Math.random() * banco.length) | 0];
        if (npc.burbuja) pj.grupo.remove(npc.burbuja);
        npc.burbuja = crearBurbuja(linea);
        npc.burbuja.position.y = 2.5;
        pj.grupo.add(npc.burbuja);
        setTimeout(() => {
          if (npc.burbuja) { pj.grupo.remove(npc.burbuja); npc.burbuja = null; }
        }, 3600);
        return linea;
      },
    };
    planificar(npc, true);
    npcs.push(npc);
  }

  // ----- planificar ruta según el tipo de agente -----
  function planificar(npc, inicial = false) {
    npc.ruta = null; npc.ancla = null; npc.paso = 0;
    const tipo = npc.tipo;
    let destino = null, ancla = null;
    if (tipo === 'minar') { ancla = elegir(POIS.mina); npc.recuento = 1 + (Math.random() * 3 | 0); }
    else if (tipo === 'trabajar') { ancla = elegir(POIS.puesto); npc.recuento = 1; }
    else if (tipo === 'relajar') {
      const b = elegir(bancos);
      ancla = [b.x + Math.sin(b.rot) * .95, b.z + Math.cos(b.rot) * .95];
      npc.bancoObj = b; npc.recuento = 1;
    } else if (tipo === 'visitar') {
      ancla = Math.random() < .55 ? elegir(POIS.downtown) : elegir(POIS.lago);
      if (Math.random() < .25) ancla = elegir(POIS.bosque);
      npc.recuento = 1;
    } else { ancla = elegir(POIS.plaza); }
    destino = ancla;
    const ori = grafo.nodoCercano(npc.pj.grupo.position.x, npc.pj.grupo.position.z);
    const dest = grafo.nodoCercano(destino[0], destino[1]);
    const ruta = grafo.camino(ori, dest);
    npc.ruta = ruta;
    npc.ancla = ancla;
    npc.paso = 0;
    if (!ruta) { npc.estado = 'idle'; npc.timer = rnd(.5, 1.5); }
    else npc.estado = 'ir';
  }

  function update(dt, t) {
    for (const npc of npcs) {
      const pj = npc.pj;

      if (npc.estado === 'ir') {
        let objetivo = null;
        if (npc.ruta && npc.paso < npc.ruta.length) {
          const n = grafo.nodos[npc.ruta[npc.paso]];
          objetivo = { x: n.x, z: n.z };
        } else if (npc.ancla) {
          objetivo = { x: npc.ancla[0], z: npc.ancla[1] };
        }
        if (!objetivo) { npc.estado = 'idle'; npc.timer = rnd(1, 2); continue; }

        const dx = objetivo.x - pj.grupo.position.x, dz = objetivo.z - pj.grupo.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist < .45) {
          if (npc.ruta && npc.paso < npc.ruta.length) { npc.paso++; continue; }
          // llegó al ancla
          if (npc.tipo === 'minar' && npc.recuento > 0) { npc.estado = 'minar'; npc.timer = rnd(5, 9); continue; }
          if (npc.tipo === 'trabajar' && npc.recuento > 0) { npc.estado = 'trabajar'; npc.timer = rnd(9, 16); continue; }
          if (npc.tipo === 'relajar' && npc.recuento > 0) {
            const b = npc.bancoObj;
            pj.grupo.position.set(b.x, SIT_Y, b.z);
            pj.grupo.rotation.y = b.rot;
            pj.setEstado('sit'); npc.sentado = true;
            npc.estado = 'relajar'; npc.timer = rnd(7, 14);
            continue;
          }
          if (npc.tipo === 'visitar' && npc.recuento > 0) { npc.estado = 'relajar'; npc.timer = rnd(4, 8); continue; }
          npc.tipo = elegir(tipos); planificar(npc);
          continue;
        }
        // avanzar con colisión
        const ux = dx / dist, uz = dz / dist;
        const paso = npc.velocidad * dt;
        const px = pj.grupo.position.x, pz = pj.grupo.position.z;
        if (col.libreSuelo(px + ux * paso, pz + uz * paso, .4)) {
          pj.grupo.position.x += ux * paso;
          pj.grupo.position.z += uz * paso;
        } else if (col.libreSuelo(px + ux * paso, pz, .4)) {
          pj.grupo.position.x += ux * paso;
        } else if (col.libreSuelo(px, pz + uz * paso, .4)) {
          pj.grupo.position.z += uz * paso;
        } else {
          planificar(npc); // bloqueado: replanifica
          continue;
        }
        const ang = Math.atan2(ux, uz);
        let dif = ang - pj.grupo.rotation.y;
        while (dif > PIE2) dif -= 2 * PIE2;
        while (dif < -PIE2) dif += 2 * PIE2;
        pj.grupo.rotation.y += dif * Math.min(1, dt * 8);
        pj.grupo.position.y = col.alto(pj.grupo.position.x, pj.grupo.position.z);
        pj.update(t, true);
        continue;
      }

      if (npc.estado === 'minar') {
        pj.setEstado('mine'); pj.update(t);
        npc.timer -= dt;
        if (npc.timer <= 0) {
          npc.recuento--;
          if (npc.recuento > 0) npc.timer = rnd(5, 9);
          else { npc.tipo = elegir(tipos); planificar(npc); }
        }
        continue;
      }
      if (npc.estado === 'trabajar') {
        pj.setEstado('work'); pj.update(t);
        npc.timer -= dt;
        if (npc.timer <= 0) { npc.tipo = elegir(tipos); planificar(npc); }
        continue;
      }
      if (npc.estado === 'relajar') {
        pj.update(t);
        npc.timer -= dt;
        if (npc.timer <= 0) {
          if (npc.sentado) { pj.grupo.position.y = 0; npc.sentado = null; }
          pj.setEstado('idle');
          npc.tipo = elegir(tipos); planificar(npc);
        }
        continue;
      }
      // idle
      pj.update(t);
      npc.timer -= dt;
      if (npc.timer <= 0) { planificar(npc); }
    }

    // ----- separación suave entre agentes -----
    for (let i = 0; i < npcs.length; i++) {
      for (let j = i + 1; j < npcs.length; j++) {
        const a = npcs[i].pj.grupo.position, b = npcs[j].pj.grupo.position;
        const dx = b.x - a.x, dz = b.z - a.z;
        const d2 = dx * dx + dz * dz;
        if (d2 > .64 || d2 < 1e-6) continue;
        const d = Math.sqrt(d2), empuje = (.8 - d) * .5;
        const ux = dx / d, uz = dz / d;
        if (col.libreSuelo(a.x - ux * empuje, a.z - uz * empuje, .35)) { a.x -= ux * empuje; a.z -= uz * empuje; }
        if (col.libreSuelo(b.x + ux * empuje, b.z + uz * empuje, .35)) { b.x += ux * empuje; b.z += uz * empuje; }
      }
    }

    // ----- pájaros -----
    for (const p of pajaros) {
      const u = p.userData;
      u.ang += u.vel * dt;
      p.position.set(Math.cos(u.ang) * u.r, u.y + Math.sin(t * 1.3 + u.o) * .8, Math.sin(u.ang) * u.r);
      p.rotation.y = -u.ang + PIE2 / 2;
      const flap = Math.sin(t * 11 + u.o) * .55;
      u.alas[0].rotation.z = flap; u.alas[1].rotation.z = -flap;
    }
  }

  // ----- pájaros -----
  const pajaros = [];
  for (let i = 0; i < 6; i++) {
    const p = crearPajaro(elegir([0x2b2b2b, 0xe8e8e8, 0x00d1ff, 0xffd166]));
    Object.assign(p.userData, {
      ang: rnd(0, 6.28), r: rnd(30, 64), y: rnd(15, 26),
      vel: rnd(.25, .5) * (Math.random() < .5 ? 1 : -1), o: rnd(0, 6),
    });
    escena.add(p); pajaros.push(p);
  }

  return { npcs, update };
}
