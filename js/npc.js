// ============ ALICE CITY — Agentes autónomos, coches y pájaros ============
import * as THREE from 'three';
import { crearPersonaje, personajeAleatorio, crearPlaca, ROLES } from './characters.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const elegir = (arr) => arr[(Math.random() * arr.length) | 0];

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

// ---------- coche ----------
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
    r.rotation.z = Math.PI / 2; r.position.set(x, .32, z); g.add(r); ruedas.push(r);
  }
  for (const x of [-.6, .6]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(.3, .14, .06),
      new THREE.MeshStandardMaterial({ color: 0xfff6c9, emissive: 0xffe9a0, emissiveIntensity: .8 }));
    f.position.set(x, .62, 1.82); g.add(f);
  }
  g.userData.ruedas = ruedas;
  return g;
}

// ---------- pájaro ----------
function crearPajaro(color) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: .8, side: THREE.DoubleSide });
  const cuerpo = new THREE.Mesh(new THREE.ConeGeometry(.12, .5, 5), mat);
  cuerpo.rotation.x = Math.PI / 2; g.add(cuerpo);
  const alaGeo = new THREE.PlaneGeometry(.5, .22);
  const alaI = new THREE.Mesh(alaGeo, mat); alaI.position.x = -.26; g.add(alaI);
  const alaD = new THREE.Mesh(alaGeo, mat); alaD.position.x = .26; g.add(alaD);
  g.userData.alas = [alaI, alaD];
  return g;
}

// ============================================================
export function crearNPCs(escena, mundo) {
  const npcs = [];
  const PIE = Math.PI;

  // puntos de interés
  const plazaPt = () => { const a = rnd(0, 6.28), r = rnd(4, 13); return new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r); };
  const minaPt = () => { const a = rnd(0, 6.28), r = rnd(3, 11); return new THREE.Vector3(-60 + Math.cos(a) * r, 0, Math.sin(a) * r); };
  const mercPt = () => { const a = rnd(0, 6.28), r = rnd(3, 10); return new THREE.Vector3(60 + Math.cos(a) * r, 0, Math.sin(a) * r); };
  const callePt = () => elegir([
    new THREE.Vector3(rnd(-95, 95), 0, rnd(6, 8) * (Math.random() < .5 ? 1 : -1)),
    new THREE.Vector3(rnd(6, 8) * (Math.random() < .5 ? 1 : -1), 0, rnd(-95, 95)),
  ]);

  const tipos = ['pasear', 'pasear', 'minar', 'trabajar', 'relajar'];
  for (let i = 0; i < 24; i++) {
    const tipoBase = tipos[i % tipos.length];
    const cfg = personajeAleatorio();
    cfg.nombre = NOMBRES[i];
    cfg.rol = elegir(Object.keys(ROLES));
    const pj = crearPersonaje(cfg);
    pj.grupo.position.set(...plazaPt().toArray());
    escena.add(pj.grupo);

    // placa de nombre
    const placa = crearPlaca(cfg.nombre, ROLES[cfg.rol].nombre === 'MINERO' ? '#00F299' :
      ROLES[cfg.rol].nombre === 'CONSTRUCTOR' ? '#ff9f43' : ROLES[cfg.rol].nombre === 'ARTISTA' ? '#fb2c36' : '#00d1ff');
    placa.position.y = 1.95; pj.grupo.add(placa);

    const npc = {
      id: i, nombre: cfg.nombre, rol: cfg.rol, dueño: DUEÑOS[i], pj,
      estado: 'ir', tipo: tipoBase,
      target: plazaPt(), timer: rnd(0, 3), velocidad: rnd(2.1, 2.9), 
      recuento: 0, sentado: null,
      etiqueta() { return ETIQUETAS_ESTADO[this.estado === 'ir' ? 'pasear' : this.estado] || '🚶'; },
    };
    npcs.push(npc);
  }

  // ----- bancos como puntos de relax -----
  const bancos = mundo.bancosPos.map(([x, z]) => new THREE.Vector3(x, 0, z));

  function nuevoObjetivo(npc) {
    switch (npc.tipo) {
      case 'minar': npc.target = minaPt(); npc.recuento = 1 + (Math.random() * 3 | 0); break;
      case 'trabajar': npc.target = mercPt(); npc.recuento = 1; break;
      case 'relajar': npc.target = elegir(bancos).clone(); npc.recuento = 1; break;
      default: npc.target = Math.random() < .6 ? plazaPt() : callePt();
    }
  }

  function update(dt, t) {
    for (const npc of npcs) {
      const pj = npc.pj;
      if (npc.estado === 'ir') {
        const d = npc.target.clone().sub(pj.grupo.position); d.y = 0;
        const dist = d.length();
        if (dist < .5) {
          // llegó
          if (npc.tipo === 'minar' && npc.recuento > 0) { npc.estado = 'minar'; npc.timer = rnd(5, 9); }
          else if (npc.tipo === 'trabajar' && npc.recuento > 0) { npc.estado = 'trabajar'; npc.timer = rnd(9, 16); }
          else if (npc.tipo === 'relajar' && npc.recuento > 0) {
            npc.estado = 'relajar'; npc.timer = rnd(7, 14);
            pj.setEstado('sit');
            pj.grupo.position.set(npc.target.x, 0, npc.target.z + .12);
            pj.grupo.rotation.y = Math.atan2(-npc.target.z, -npc.target.x) + PIE;
            continue;
          } else { npc.tipo = elegir(tipos); nuevoObjetivo(npc); }
        } else {
          d.normalize();
          pj.grupo.position.addScaledVector(d, npc.velocidad * dt);
          const ang = Math.atan2(d.x, d.z);
          let dif = ang - pj.grupo.rotation.y;
          while (dif > PIE) dif -= 2 * PIE; while (dif < -PIE) dif += 2 * PIE;
          pj.grupo.rotation.y += dif * Math.min(1, dt * 8);
          pj.update(t, true);
          continue;
        }
      }
      if (npc.estado === 'minar') {
        pj.setEstado('mine'); pj.update(t);
        npc.timer -= dt;
        if (npc.timer <= 0) {
          npc.recuento--;
          if (npc.recuento > 0) npc.timer = rnd(5, 9);
          else { npc.tipo = elegir(tipos); nuevoObjetivo(npc); npc.estado = 'ir'; }
        }
        continue;
      }
      if (npc.estado === 'trabajar') {
        pj.setEstado('work'); pj.update(t);
        npc.timer -= dt;
        if (npc.timer <= 0) { npc.tipo = elegir(tipos); nuevoObjetivo(npc); npc.estado = 'ir'; }
        continue;
      }
      if (npc.estado === 'relajar') {
        pj.update(t);
        npc.timer -= dt;
        if (npc.timer <= 0) { pj.setEstado('idle'); npc.tipo = elegir(tipos); nuevoObjetivo(npc); npc.estado = 'ir'; }
        continue;
      }
      // idle/paseo parado
      pj.update(t);
      npc.timer -= dt;
      if (npc.timer <= 0) { nuevoObjetivo(npc); npc.estado = 'ir'; }
    }

    // ----- coches en la rotonda de la plaza -----
    for (const coche of coches) {
      coche.userData.ang += coche.userData.vel * dt;
      const r = coche.userData.radio;
      coche.position.set(Math.cos(coche.userData.ang) * r, 0, Math.sin(coche.userData.ang) * r);
      coche.rotation.y = -coche.userData.ang + (coche.userData.vel > 0 ? 0 : PIE);
      for (const w of coche.userData.ruedas) w.rotation.x += dt * 9;
    }
    // ----- pájaros -----
    for (const p of pajaros) {
      const u = p.userData;
      u.ang += u.vel * dt;
      p.position.set(Math.cos(u.ang) * u.r, u.y + Math.sin(t * 1.3 + u.o) * .8, Math.sin(u.ang) * u.r);
      p.rotation.y = -u.ang + PIE / 2;
      const flap = Math.sin(t * 11 + u.o) * .55;
      u.alas[0].rotation.z = flap; u.alas[1].rotation.z = -flap;
    }
  }

  // ----- crear coches -----
  const coches = [];
  const coloresCoches = [0xfb2c36, 0x00d1ff, 0xffd166, 0x00F299, 0xff7b6b, 0xf5f5f0];
  for (let i = 0; i < 6; i++) {
    const c = crearCoche(coloresCoches[i]);
    c.userData.ang = (i / 6) * Math.PI * 2;
    c.userData.radio = 19.5 + (i % 2) * 2.2;
    c.userData.vel = (i % 2 ? 1 : -1) * rnd(.22, .34);
    // orientar: el frente del coche apunta tangencial
    escena.add(c); coches.push(c);
  }
  // coche aparcado
  const aparcado = crearCoche(0x8ad7c1);
  aparcado.position.set(-24, 0, 5.6); aparcado.rotation.y = PIE / 2; escena.add(aparcado);

  // ----- pájaros -----
  const pajaros = [];
  for (let i = 0; i < 6; i++) {
    const p = crearPajaro(elegir([0x2b2b2b, 0xe8e8e8, 0x00d1ff, 0xffd166]));
    Object.assign(p.userData, {
      ang: rnd(0, 6.28), r: rnd(26, 60), y: rnd(15, 26),
      vel: rnd(.25, .5) * (Math.random() < .5 ? 1 : -1), o: rnd(0, 6),
    });
    escena.add(p); pajaros.push(p);
  }

  return { npcs, update };
}
