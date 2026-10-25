// ============ ALICE CITY v5 — Tráfico: coches por carriles con frenado ============
// Circulación por la derecha en bucles de manzana sobre la cuadrícula.
// Frenan ante peatones, agentes y otros coches; nunca atraviesan a nadie.
import * as THREE from 'three';
import { col } from './colisiones.js';

const PIE = Math.PI;

// bucles de manzana (esquinas en carril, mano derecha)
const BUCLES = {
  anillo: [[77.25, -72.75], [77.25, 72.75], [-72.75, 72.75], [-72.75, -72.75]],
  SE: [[2.25, 2.25], [77.25, 2.25], [77.25, 72.75], [2.25, 72.75]],
  NE: [[2.25, -72.75], [77.25, -72.75], [77.25, -2.25], [2.25, -2.25]],
  SO: [[-72.75, 2.25], [-2.25, 2.25], [-2.25, 72.75], [-72.75, 72.75]],
  NO: [[-72.75, -72.75], [-2.25, -72.75], [-2.25, -2.25], [-72.75, -2.25]],
};

function crearCoche(color) {
  const g = new THREE.Group();
  const matC = new THREE.MeshStandardMaterial({ color, roughness: .35, metalness: .25 });
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(1.9, .55, 3.6), matC);
  cuerpo.position.y = .62; cuerpo.castShadow = true; g.add(cuerpo);
  const cabina = new THREE.Mesh(new THREE.BoxGeometry(1.7, .5, 1.8),
    new THREE.MeshStandardMaterial({ color: 0xbfe8f5, roughness: .2, metalness: .1 }));
  cabina.position.set(0, 1.1, -.2); cabina.castShadow = true; g.add(cabina);
  const ruedas = [];
  for (const [x, z] of [[-.95, 1.15], [.95, 1.15], [-.95, -1.15], [.95, -1.15]]) {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, .22, 12),
      new THREE.MeshStandardMaterial({ color: 0x181c1f, roughness: .9 }));
    r.rotation.z = PIE / 2; r.position.set(x, .32, z); g.add(r); ruedas.push(r);
  }
  for (const x of [-.6, .6]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(.3, .14, .06),
      new THREE.MeshStandardMaterial({ color: 0xfff6c9, emissive: 0xffe9a0, emissiveIntensity: .8 }));
    f.position.set(x, .62, 1.82); g.add(f);
  }
  for (const x of [-.55, .55]) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(.24, .12, .05),
      new THREE.MeshStandardMaterial({ color: 0xfb2c36, emissive: 0xfb2c36, emissiveIntensity: .6 }));
    t.position.set(x, .62, -1.82); g.add(t);
  }
  g.userData.ruedas = ruedas;
  return g;
}

export function traficoCrear(escena) {
  const coches = [];
  const colores = [0xfb2c36, 0x00d1ff, 0xffd166, 0x00F299, 0xff7b6b, 0xf5f5f0];

  // coches en circulación: 2 en el anillo, 1 por manzana interior
  const plan = [
    ['anillo', 0], ['anillo', .5],
    ['SE', 0], ['NE', .3], ['SO', .6], ['NO', .8],
  ];
  plan.forEach(([nombre, fase], i) => {
    const c = crearCoche(colores[i % colores.length]);
    const bucle = BUCLES[nombre];
    const idx0 = (fase * bucle.length) | 0;
    const [sx, sz] = bucle[idx0];
    c.position.set(sx, 0, sz);
    c.userData = {
      ...c.userData, bucle, wp: (idx0 + 1) % bucle.length,
      vel: 0, velMax: 5.4 + Math.random() * 1.4,
      ang: Math.atan2(bucle[idx0][0] - bucle[(idx0 + bucle.length - 1) % bucle.length][0],
        bucle[idx0][1] - bucle[(idx0 + bucle.length - 1) % bucle.length][1]),
    };
    c.rotation.y = c.userData.ang;
    escena.add(c); coches.push(c);
  });

  // ===== APARCAMIENTO público (franja este) =====
  const apX = 100, apZ = 30;
  const solera = new THREE.Mesh(new THREE.PlaneGeometry(20, 13),
    new THREE.MeshStandardMaterial({ color: 0x4a4e54, roughness: .95 }));
  solera.rotation.x = -PIE / 2; solera.position.set(apX, .022, apZ);
  solera.receiveShadow = true; escena.add(solera);
  const matLinea = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: .8 });
  for (let i = 0; i <= 4; i++) {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(.16, 5), matLinea);
    l.rotation.x = -PIE / 2; l.position.set(apX - 8 + i * 4, .03, apZ - 3.2);
    escena.add(l);
  }
  const entrada = new THREE.Mesh(new THREE.PlaneGeometry(.16, 13), matLinea);
  entrada.rotation.x = -PIE / 2; entrada.position.set(apX - 10, .03, apZ); escena.add(entrada);
  // bordillo perimetral con entrada al oeste
  for (const [w, d, ox, oz] of [[20, .3, 0, -6.5], [20, .3, 0, 6.5], [.3, 10, 10, 0]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, .22, d), matLinea);
    b.position.set(apX + ox, .11, apZ + oz); escena.add(b);
    col.registrar(apX + ox, apZ + oz, w, d);
  }
  // coches aparcados en su bahía
  const aparcados = [[-6, -3.2, PIE / 2], [-2, -3.2, PIE / 2], [2, -3.2, PIE / 2], [6, 3.4, -PIE / 2]];
  const coloresAp = [0x8ad7c1, 0xf5f5f0, 0xff7b6b, 0xa3e635];
  aparcados.forEach(([ox, oz, ry], i) => {
    const c = crearCoche(coloresAp[i]);
    c.position.set(apX + ox, 0, apZ + oz); c.rotation.y = ry;
    escena.add(c);
    col.registrar(apX + ox, apZ + oz, ry ? 4.2 : 2.2, ry ? 2.2 : 4.2);
  });
  // cartel del aparcamiento
  const cartelAp = new THREE.Mesh(new THREE.PlaneGeometry(2.2, .8),
    new THREE.MeshStandardMaterial({ map: (function () {
      const c = document.createElement('canvas'); c.width = 128; c.height = 48;
      const g = c.getContext('2d');
      g.fillStyle = '#10181f'; g.fillRect(0, 0, 128, 48);
      g.fillStyle = '#00d1ff'; g.font = '900 26px sans-serif'; g.textAlign = 'center';
      g.fillText('P · FREE', 64, 33);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    })(), roughness: .6, side: THREE.DoubleSide }));
  cartelAp.position.set(apX - 10, 2.6, apZ - 6.2); escena.add(cartelAp);

  // ----- update -----
  const obstaculos = []; // {x,z,r} reconstruido por frame
  function update(dt, jugadorPos = null, npcs = null) {
    obstaculos.length = 0;
    if (jugadorPos) obstaculos.push({ x: jugadorPos.x, z: jugadorPos.z, r: 1.7 });
    if (npcs) for (const n of npcs) {
      const p = n.pj.grupo.position;
      obstaculos.push({ x: p.x, z: p.z, r: 1.35 });
    }
    for (const c of coches) obstaculos.push({ x: c.position.x, z: c.position.z, r: 2.6 });

    for (const c of coches) {
      const u = c.userData;
      const [wx, wz] = u.bucle[u.wp];
      const dx = wx - c.position.x, dz = wz - c.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 2.2) u.wp = (u.wp + 1) % u.bucle.length;
      const dirX = dx / (dist || 1), dirZ = dz / (dist || 1);

      // frenar si hay obstáculo delante
      const alcance = 3 + u.vel * .75;
      const px = c.position.x + dirX * alcance, pz = c.position.z + dirZ * alcance;
      let frenar = false;
      for (const o of obstaculos) {
        if (o.x === c.position.x && o.z === c.position.z) continue;
        const ddx = o.x - px, ddz = o.z - pz;
        if (ddx * ddx + ddz * ddz < (o.r + 1.1) * (o.r + 1.1)) { frenar = true; break; }
      }
      const objetivo = frenar ? 0 : u.velMax;
      u.vel += (objetivo - u.vel) * Math.min(1, dt * (frenar ? 6 : 2.2));

      c.position.x += dirX * u.vel * dt;
      c.position.z += dirZ * u.vel * dt;
      const ang = Math.atan2(dirX, dirZ);
      let dif = ang - u.ang;
      while (dif > PIE) dif -= 2 * PIE;
      while (dif < -PIE) dif += 2 * PIE;
      u.ang += dif * Math.min(1, dt * 5);
      c.rotation.y = u.ang;
      for (const w of u.ruedas) w.rotation.x += u.vel * dt * 2.2;
    }
  }

  return { coches, update };
}
