// ============ ALICE CITY v5 — Mundo con plan urbano real ============
// Ciudad en cuadrícula: 6 avenidas (x/z = 0, ±75), rotonda central, 4 manzanas
// interiores con distritos, 4 franjas exteriores con edificios en fila y 4
// distritos de esquina (world2.js). TODO lo registrado colisiona; nada en la
// calzada: mobiliario en aceras, cruces con zebras, carriles para tráfico.
import * as THREE from 'three';
import { PLAN, ZEBRAS, col, tramosAcera } from './colisiones.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const elegir = (arr) => arr[(Math.random() * arr.length) | 0];
const PIE = Math.PI;

const COLORES_EDIFICIOS = ['#ff7b6b', '#ffd166', '#7ee8a2', '#6fd6ff', '#ffb38a', '#a3e635', '#4ecdc4', '#ff8fab', '#f9ed69', '#8ad7c1'];
const NOMBRES_TIENDAS = ['CAFÉ ALICE', 'AGENTES & CO', 'ALICOIN BANK', 'TIENDA ZOLO', 'MINERALES SA', 'PIZZA BOT', 'HOTEL NUBE', 'FARMACIA AI', 'LIBROS & BITS', 'PANADERÍA SOL', 'GIMNASIO PIXEL', 'ESTUDIO LUMA'];

function lienzox(w, h, fn) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  fn(c.getContext('2d'));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------- texturas ----------
function texVentanas(base) {
  return lienzox(128, 256, (g) => {
    g.fillStyle = base; g.fillRect(0, 0, 128, 256);
    for (let y = 10; y < 246; y += 26) {
      for (let x = 10; x < 118; x += 30) {
        const encendida = Math.random() < .12;
        g.fillStyle = encendida ? (Math.random() < .5 ? '#fff3b0' : '#c9f7ff') : 'rgba(20,40,55,.85)';
        g.fillRect(x, y, 20, 16);
        g.fillStyle = 'rgba(255,255,255,.35)';
        g.fillRect(x, y, 20, 4);
      }
    }
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, 246, 128, 10);
  });
}
function texCésped() {
  return lienzox(256, 256, (g) => {
    g.fillStyle = '#79c94e'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = Math.random() < .5 ? 'rgba(96,178,58,.5)' : 'rgba(146,214,92,.45)';
      g.fillRect(Math.random() * 256, Math.random() * 256, 3, 5);
    }
  });
}
texCésped.repeticion = true;
function texAsfalto() {
  const t = lienzox(128, 512, (g) => {
    g.fillStyle = '#4a4e54'; g.fillRect(0, 0, 128, 512);
    for (let i = 0; i < 400; i++) {
      g.fillStyle = `rgba(255,255,255,${rnd(.02, .05)})`;
      g.fillRect(Math.random() * 128, Math.random() * 512, 2, 2);
    }
    g.fillStyle = '#f4e04d';
    for (let y = 0; y < 512; y += 64) g.fillRect(61, y, 6, 34);
  });
  t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 6);
  return t;
}
function texTablero() {
  return lienzox(256, 160, (g) => {
    g.fillStyle = '#123240'; g.fillRect(0, 0, 256, 160);
    g.strokeStyle = '#00F299'; g.lineWidth = 8; g.strokeRect(6, 6, 244, 148);
    g.fillStyle = '#00F299'; g.font = '900 40px sans-serif'; g.textAlign = 'center';
    g.fillText('CONTRATOS', 128, 62);
    g.fillStyle = '#00d1ff'; g.font = '700 24px sans-serif';
    g.fillText('TRABAJA Y GANA', 128, 100);
    g.fillStyle = '#fb2c36'; g.font = '900 20px sans-serif';
    g.fillText('★ MERCADO ★', 128, 136);
  });
}
function texValla() {
  return lienzox(128, 64, (g) => {
    g.fillStyle = '#ffb84d'; g.fillRect(0, 0, 128, 64);
    g.fillStyle = '#2b2b2b';
    for (let x = 0; x < 128; x += 32) g.fillRect(x, 0, 10, 64);
    g.fillRect(0, 26, 128, 12);
  });
}
function texLetrero(nombre, acento = '#00F299') {
  return lienzox(256, 64, (g) => {
    g.fillStyle = '#10181f'; g.fillRect(0, 0, 256, 64);
    g.fillStyle = acento; g.fillRect(0, 0, 8, 64); g.fillRect(248, 0, 8, 64);
    g.fillStyle = '#ffffff'; g.font = '900 30px sans-serif'; g.textAlign = 'center';
    g.fillText(nombre.slice(0, 15), 128, 42);
  });
}
function texMapaCiudad() {
  return lienzox(256, 256, (g) => {
    g.fillStyle = '#e8e2d4'; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = '#4a4e54'; g.lineWidth = 7;
    for (const L of [-75, 0, 75]) {
      const p = 128 + L * (110 / 150);
      g.beginPath(); g.moveTo(p, 73); g.lineTo(p, 183); g.stroke();
      g.beginPath(); g.moveTo(73, p); g.lineTo(183, p); g.stroke();
    }
    const zonas = [['PLAZA', 0, 0, '#00F299'], ['MINAS', -38, -38, '#c9a227'], ['MERCADO', 38, 38, '#fb2c36'],
      ['PARQUE', -38, 38, '#3fae5a'], ['PARCELAS', 38, -52, '#ff9f43'], ['DOWNTOWN', 114, -114, '#00d1ff'],
      ['LAGO', -114, 114, '#2fa8d5'], ['BOSQUE', -114, -114, '#27795a']];
    g.font = '800 13px sans-serif'; g.textAlign = 'center';
    for (const [n, x, z, c] of zonas) {
      const px = 128 + x * (110 / 150), pz = 128 + z * (110 / 150);
      g.fillStyle = c; g.beginPath(); g.arc(px, pz, 11, 0, 6.29); g.fill();
      g.fillStyle = '#10181f'; g.fillText(n, px, pz + 26);
    }
    g.fillStyle = '#10181f'; g.font = '900 17px sans-serif';
    g.fillText('MAPA DE ALICE CITY', 128, 246);
  });
}

// ---------- cielo ----------
function crearCielo(escena) {
  const geo = new THREE.SphereGeometry(400, 24, 16);
  const tex = lienzox(64, 256, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#3aa7e8');
    gr.addColorStop(.45, '#8ed4f7');
    gr.addColorStop(.75, '#cdeffb');
    gr.addColorStop(1, '#e8fbf2');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
  });
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false });
  escena.add(new THREE.Mesh(geo, mat));
}

// ---------- nubes ----------
function crearNube() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true });
  const n = 3 + (Math.random() * 3 | 0);
  for (let i = 0; i < n; i++) {
    const esf = new THREE.Mesh(new THREE.SphereGeometry(rnd(1.2, 2.6), 8, 6), mat);
    esf.position.set(rnd(-3, 3), rnd(-.4, .8), rnd(-1.4, 1.4));
    esf.scale.y = .6; g.add(esf);
  }
  return g;
}

// ---------- árbol / farola / banco / cristal (exportados) ----------
export function crearArbol(escala = 1) {
  const g = new THREE.Group();
  const tronco = new THREE.Mesh(new THREE.CylinderGeometry(.14 * escala, .2 * escala, 1.1 * escala, 7),
    new THREE.MeshStandardMaterial({ color: 0x8a5a2e, roughness: 1 }));
  tronco.position.y = .55 * escala; tronco.castShadow = true; g.add(tronco);
  const verdes = [0x3fae5a, 0x58c96b, 0x2f9e4f];
  for (let i = 0; i < 3; i++) {
    const copa = new THREE.Mesh(new THREE.IcosahedronGeometry(rnd(.75, 1.05) * escala, 0),
      new THREE.MeshStandardMaterial({ color: elegir(verdes), roughness: .95, flatShading: true }));
    copa.position.set(rnd(-.25, .25) * escala, (1.25 + i * .5) * escala, rnd(-.25, .25) * escala);
    copa.castShadow = true; g.add(copa);
  }
  return g;
}
export function crearFarola() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x2f3b44, roughness: .6, metalness: .4 });
  const poste = new THREE.Mesh(new THREE.CylinderGeometry(.06, .09, 3.4, 8), mat);
  poste.position.y = 1.7; poste.castShadow = true; g.add(poste);
  const brazo = new THREE.Mesh(new THREE.BoxGeometry(.9, .07, .07), mat);
  brazo.position.set(.4, 3.35, 0); g.add(brazo);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0xfff7cc, emissive: 0xffe98a, emissiveIntensity: .5 }));
  lamp.position.set(.82, 3.28, 0); g.add(lamp);
  return g;
}
export function crearBanco() {
  const g = new THREE.Group();
  const matMad = new THREE.MeshStandardMaterial({ color: 0xb0793f, roughness: .9 });
  const matPata = new THREE.MeshStandardMaterial({ color: 0x37414a, metalness: .3 });
  const asiento = new THREE.Mesh(new THREE.BoxGeometry(1.5, .08, .5), matMad);
  asiento.position.y = .45; asiento.castShadow = true; g.add(asiento);
  const resp = new THREE.Mesh(new THREE.BoxGeometry(1.5, .45, .07), matMad);
  resp.position.set(0, .72, -.22); resp.castShadow = true; g.add(resp);
  for (const x of [-.6, .6]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(.08, .45, .45), matPata);
    p.position.set(x, .22, 0); g.add(p);
  }
  return g;
}
export function crearCristal(color = 0x00d1ff) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: .55, roughness: .25, metalness: .1, flatShading: true,
  });
  for (let i = 0; i < 3; i++) {
    const p = new THREE.Mesh(new THREE.ConeGeometry(rnd(.16, .3), rnd(.6, 1.1), 5), mat);
    p.position.set(rnd(-.25, .25), .3, rnd(-.25, .25));
    p.rotation.set(rnd(-.25, .25), rnd(0, 3), rnd(-.25, .25));
    p.castShadow = true; g.add(p);
  }
  return g;
}

// ---------- fuente ----------
function crearFuente() {
  const g = new THREE.Group();
  const piedra = new THREE.MeshStandardMaterial({ color: 0xd8cfc0, roughness: .9 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.9, .5, 24), piedra);
  base.position.y = .25; base.castShadow = true; base.receiveShadow = true; g.add(base);
  const agua = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.35, .18, 24),
    new THREE.MeshStandardMaterial({ color: 0x53d5f0, transparent: true, opacity: .8, roughness: .15 }));
  agua.position.y = .48; g.add(agua);
  const pilar = new THREE.Mesh(new THREE.CylinderGeometry(.35, .5, 1.4, 12), piedra);
  pilar.position.y = 1.1; pilar.castShadow = true; g.add(pilar);
  const taza = new THREE.Mesh(new THREE.CylinderGeometry(1, .6, .3, 16), piedra);
  taza.position.y = 1.8; g.add(taza);
  const chorro = new THREE.Mesh(new THREE.CylinderGeometry(.07, .16, 1.1, 8),
    new THREE.MeshStandardMaterial({ color: 0xaeeaff, transparent: true, opacity: .75 }));
  chorro.position.y = 2.5; g.add(chorro);
  const nG = 26, pos = new Float32Array(nG * 3), geo = new THREE.BufferGeometry();
  const semillas = [];
  for (let i = 0; i < nG; i++) semillas.push({ a: rnd(0, 6.28), f: rnd(.5, 1), h: rnd(.6, 1) });
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const gotas = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xc9f4ff, size: .09, transparent: true, opacity: .9 }));
  g.add(gotas);
  g.userData.animar = (t) => {
    for (let i = 0; i < nG; i++) {
      const s = semillas[i];
      const fr = ((t * s.f + i / nG) % 1);
      pos[i * 3] = Math.cos(s.a) * fr * 1.7;
      pos[i * 3 + 1] = 3 - fr * s.h * 2.6;
      pos[i * 3 + 2] = Math.sin(s.a) * fr * 1.7;
    }
    geo.attributes.position.needsUpdate = true;
    agua.position.y = .48 + Math.sin(t * 2) * .015;
  };
  return g;
}

// ---------- edificio v5: fachada con portal, escaparate, toldo y rótulo ----------
function crearEdificioV5(ancho, alto, fondo, color, nombre) {
  const g = new THREE.Group();
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(ancho, alto, fondo),
    new THREE.MeshStandardMaterial({ map: texVentanas(color), roughness: .85 }));
  cuerpo.position.y = alto / 2; cuerpo.castShadow = true; cuerpo.receiveShadow = true; g.add(cuerpo);
  const azo = new THREE.Mesh(new THREE.BoxGeometry(ancho * .9, .3, fondo * .9),
    new THREE.MeshStandardMaterial({ color: 0x3a4148, roughness: .9 }));
  azo.position.y = alto + .15; g.add(azo);
  if (Math.random() < .6) {
    const ac = new THREE.Mesh(new THREE.BoxGeometry(.8, .5, .8),
      new THREE.MeshStandardMaterial({ color: 0x9aa5ad, metalness: .3 }));
    ac.position.set(rnd(-1, 1) * ancho * .25, alto + .55, rnd(-1, 1) * fondo * .25);
    ac.castShadow = true; g.add(ac);
  }
  if (Math.random() < .4) {
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 1.6, 6),
      new THREE.MeshStandardMaterial({ color: 0x5b656d }));
    ant.position.set(0, alto + 1.1, 0); g.add(ant);
    const luz = new THREE.Mesh(new THREE.SphereGeometry(.09, 6, 5),
      new THREE.MeshStandardMaterial({ color: 0xfb2c36, emissive: 0xfb2c36, emissiveIntensity: 2 }));
    luz.position.set(0, alto + 1.95, 0); g.add(luz);
  }
  const fz = fondo / 2;
  // portal
  const puerta = new THREE.Mesh(new THREE.BoxGeometry(.95, 2.05, .12),
    new THREE.MeshStandardMaterial({ color: 0x2b3a44, roughness: .6 }));
  puerta.position.set(-ancho * .18, 1.02, fz + .05); g.add(puerta);
  const marco = new THREE.Mesh(new THREE.BoxGeometry(1.15, 2.2, .08),
    new THREE.MeshStandardMaterial({ color: 0xf5f0e6, roughness: .8 }));
  marco.position.set(-ancho * .18, 1.1, fz + .02); g.add(marco);
  // escalones
  for (let i = 0; i < 2; i++) {
    const e = new THREE.Mesh(new THREE.BoxGeometry(1.5 - i * .2, .09, .5 - i * .18),
      new THREE.MeshStandardMaterial({ color: 0xcfd6cf, roughness: 1 }));
    e.position.set(-ancho * .18, .05 + i * .09, fz + .3 + i * .22); g.add(e);
  }
  // escaparates
  for (const dx of [ancho * .18, ancho * .38]) {
    const v = new THREE.Mesh(new THREE.BoxGeometry(ancho * .16, 1.35, .08),
      new THREE.MeshStandardMaterial({ color: 0x9fd8ec, roughness: .15, metalness: .3 }));
    v.position.set(dx, 1.15, fz + .04); g.add(v);
  }
  // toldo
  const toldo = new THREE.Mesh(new THREE.BoxGeometry(ancho * .62, .1, .8),
    new THREE.MeshStandardMaterial({ color: elegir([0x00F299, 0x00d1ff, 0xfb2c36, 0xffd166]) }));
  toldo.position.set(0, 2.32, fz + .34); toldo.castShadow = true; g.add(toldo);
  // rótulo
  const rot = new THREE.Mesh(new THREE.PlaneGeometry(ancho * .7, .62),
    new THREE.MeshStandardMaterial({ map: texLetrero(nombre), roughness: .5, emissive: 0x222222, emissiveIntensity: .35 }));
  rot.position.set(0, 2.85, fz + .03); g.add(rot);
  return g;
}

// ============================================================
export function crearMundo(escena) {
  const animables = [];

  // ----- luces (BRILLANTE) -----
  const hemi = new THREE.HemisphereLight(0xcfeaff, 0x7cc952, 1.05);
  escena.add(hemi);
  const sol = new THREE.DirectionalLight(0xfff2d8, 2.2);
  sol.position.set(60, 90, 40);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  sol.shadow.camera.left = -160; sol.shadow.camera.right = 160;
  sol.shadow.camera.top = 160; sol.shadow.camera.bottom = -160;
  sol.shadow.camera.far = 420;
  sol.shadow.bias = -0.0004;
  escena.add(sol);
  escena.add(new THREE.AmbientLight(0xdfeff8, .5));

  crearCielo(escena);
  escena.fog = new THREE.Fog(0xbfe6f8, 110, 400);

  // ----- suelo -----
  const texG = texCésped(); texG.wrapS = texG.wrapT = THREE.RepeatWrapping; texG.repeat.set(58, 58);
  const suelo = new THREE.Mesh(new THREE.CircleGeometry(340, 56),
    new THREE.MeshStandardMaterial({ map: texG, roughness: 1 }));
  suelo.rotation.x = -PIE / 2; suelo.receiveShadow = true; escena.add(suelo);

  // ===== CALLES: 6 avenidas en cuadrícula =====
  const matAsf = new THREE.MeshStandardMaterial({ map: texAsfalto(), roughness: .95 });
  const carretera = (w, l, x, z, rotY = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l), matAsf);
    m.rotation.x = -PIE / 2; m.rotation.z = rotY; m.position.set(x, .02, z);
    m.receiveShadow = true; escena.add(m);
  };
  for (const L of PLAN.LINEAS_V) carretera(9, PLAN.EXT * 2, L, 0);
  for (const L of PLAN.LINEAS_H) carretera(9, PLAN.EXT * 2, 0, L, PIE / 2);

  // rotonda
  const rotonda = new THREE.Mesh(new THREE.RingGeometry(PLAN.ROTUNDA_IN, PLAN.ROTUNDA_OUT, 48),
    new THREE.MeshStandardMaterial({ color: 0x4a4e54, roughness: .95 }));
  rotonda.rotation.x = -PIE / 2; rotonda.position.y = .02; rotonda.receiveShadow = true; escena.add(rotonda);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * PIE * 2;
    const marca = new THREE.Mesh(new THREE.PlaneGeometry(.3, 2),
      new THREE.MeshStandardMaterial({ color: 0xf4e04d }));
    marca.rotation.x = -PIE / 2; marca.rotation.z = -a;
    marca.position.set(Math.cos(a) * 19.5, .025, Math.sin(a) * 19.5);
    escena.add(marca);
  }

  // ===== ACERAS en tramos + esquinas + bordillos =====
  const matAcera = new THREE.MeshStandardMaterial({ color: 0xcfd6cf, roughness: 1 });
  const matBorde = new THREE.MeshStandardMaterial({ color: 0x9aa39c, roughness: 1 });
  const plano = (w, l, x, z, y, mat) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l), mat);
    m.rotation.x = -PIE / 2; m.position.set(x, y, z); m.receiveShadow = true; escena.add(m);
  };
  const tramos = tramosAcera();
  for (const L of PLAN.LINEAS_V) {
    for (const s of [-1, 1]) {
      for (const [a, b] of tramos) {
        plano(2.5, b - a, L + s * PLAN.ACERA_OFF, (a + b) / 2, .015, matAcera);
        plano(.28, b - a, L + s * (PLAN.ASFALTO + .14), (a + b) / 2, .028, matBorde);
      }
    }
  }
  for (const L of PLAN.LINEAS_H) {
    for (const s of [-1, 1]) {
      for (const [a, b] of tramos) {
        plano(b - a, 2.5, (a + b) / 2, L + s * PLAN.ACERA_OFF, .015, matAcera);
        plano(b - a, .28, (a + b) / 2, L + s * (PLAN.ASFALTO + .14), .028, matBorde);
      }
    }
  }
  for (const x0 of PLAN.LINEAS_V) {
    for (const z0 of PLAN.LINEAS_H) {
      if (x0 === 0 && z0 === 0) continue;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) plano(2.5, 2.5, x0 + sx * 5.75, z0 + sz * 5.75, .016, matAcera);
    }
  }
  // anillo peatonal exterior de la rotonda
  const anilloPeatonal = new THREE.Mesh(new THREE.RingGeometry(PLAN.ROTUNDA_OUT, PLAN.ROTUNDA_OUT + 3, 48), matAcera);
  anilloPeatonal.rotation.x = -PIE / 2; anilloPeatonal.position.y = .016; anilloPeatonal.receiveShadow = true; escena.add(anilloPeatonal);

  // ===== ZEBRAS pintadas =====
  const matZebra = new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: .85 });
  for (const zb of ZEBRAS) {
    const horizontal = zb.w >= zb.d; // se cruza caminando en x
    const n = Math.floor((horizontal ? zb.w : zb.d) / 1.8);
    for (let i = 0; i < n; i++) {
      const off = (i + .5) * ((horizontal ? zb.w : zb.d) / n) - (horizontal ? zb.w : zb.d) / 2;
      const bar = horizontal
        ? new THREE.PlaneGeometry(.62, zb.d - .4)
        : new THREE.PlaneGeometry(zb.w - .4, .62);
      const m = new THREE.Mesh(bar, matZebra);
      m.rotation.x = -PIE / 2;
      m.position.set(horizontal ? zb.x + off : zb.x, .028, horizontal ? zb.z : zb.z + off);
      escena.add(m);
    }
  }

  // ===== MOBILIARIO: farolas, papeleras, hidrantes, semáforos =====
  const papelera = (x, z) => {
    const g = new THREE.Group();
    const c = new THREE.Mesh(new THREE.CylinderGeometry(.22, .18, .62, 8),
      new THREE.MeshStandardMaterial({ color: 0x37414a, roughness: .7, metalness: .2 }));
    c.position.y = .31; c.castShadow = true; g.add(c);
    const aro = new THREE.Mesh(new THREE.TorusGeometry(.23, .03, 6, 12),
      new THREE.MeshStandardMaterial({ color: 0x00F299, roughness: .5 }));
    aro.rotation.x = PIE / 2; aro.position.y = .62; g.add(aro);
    g.position.set(x, 0, z); escena.add(g);
    col.registrar(x, z, .5, .5);
  };
  const hidrante = (x, z) => {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0xfb2c36, roughness: .5 });
    const c = new THREE.Mesh(new THREE.CylinderGeometry(.12, .15, .55, 8), mat);
    c.position.y = .28; c.castShadow = true; g.add(c);
    const t = new THREE.Mesh(new THREE.SphereGeometry(.13, 8, 6), mat);
    t.position.y = .58; g.add(t);
    for (const dz of [-.09, .09]) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .22, 6), mat);
      b.rotation.x = PIE / 2; b.position.set(0, .34, dz); g.add(b);
    }
    g.position.set(x, 0, z); escena.add(g);
    col.registrar(x, z, .4, .4);
  };
  const farolasAnim = [];
  const farolaEn = (x, z, rotY) => {
    const f = crearFarola(); f.position.set(x, 0, z); f.rotation.y = rotY; escena.add(f);
    col.registrar(x, z, .4, .4);
    return f;
  };
  for (const L of PLAN.LINEAS_V) {
    for (const s of [-1, 1]) {
      for (let z = -132; z <= 132; z += 44) {
        if (PLAN.LINEAS_H.some((H) => Math.abs(z - H) < 9)) continue;
        if (Math.hypot(L, z) < 28) continue;
        farolaEn(L + s * 6.6, z, s > 0 ? PIE : 0);
      }
    }
  }
  for (const L of PLAN.LINEAS_H) {
    for (const s of [-1, 1]) {
      for (let x = -132; x <= 132; x += 44) {
        if (PLAN.LINEAS_V.some((V) => Math.abs(x - V) < 9)) continue;
        if (Math.hypot(x, L) < 28) continue;
        const f = farolaEn(x, L + s * 6.6, s > 0 ? PIE / 2 : -PIE / 2);
      }
    }
  }
  for (const x0 of PLAN.LINEAS_V) {
    for (const z0 of PLAN.LINEAS_H) {
      if (x0 === 0 && z0 === 0) continue;
      papelera(x0 + 6.6, z0 + 6.6);
      if ((x0 + z0) % 75 !== 0) papelera(x0 - 6.6, z0 - 6.6);
    }
  }
  for (const [x, z] of [[30, 6.6], [-30, -6.6], [6.6, 30], [-6.6, -30], [-30, -82.5], [82.5, 30], [30, 82.5], [-82.5, -30]]) hidrante(x, z);

  // semáforos de la rotonda (ciclan de verdad)
  const faros = [];
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const g = new THREE.Group();
    const poste = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, 3.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x2f3b44, metalness: .4 }));
    poste.position.y = 1.6; poste.castShadow = true; g.add(poste);
    const caja = new THREE.Mesh(new THREE.BoxGeometry(.34, .95, .22),
      new THREE.MeshStandardMaterial({ color: 0x10181f, roughness: .6 }));
    caja.position.set(0, 3.4, 0); g.add(caja);
    const luzes = [];
    for (const [i, c] of [[0, 0xfb2c36], [1, 0xffd166], [2, 0x00F299]].entries()) {
      const l = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6),
        new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: .12 }));
      l.position.set(0, 3.72 - i * .32, .12); g.add(l); luzes.push(l);
    }
    g.position.set(sx * 19.8, 0, sz * 19.8);
    g.lookAt(0, 0, 0); g.position.y = 0;
    escena.add(g);
    col.registrar(sx * 19.8, sz * 19.8, .4, .4);
    faros.push({ luzes, fase: (sx * sz > 0 ? 0 : Math.PI) });
  }
  animables.push((t) => {
    for (const f of faros) {
      const ciclo = ((t + f.fase) % 8) / 8;
      f.luzes[0].material.emissiveIntensity = ciclo < .42 ? 2.2 : .12;
      f.luzes[1].material.emissiveIntensity = (ciclo >= .42 && ciclo < .5) ? 2.2 : .12;
      f.luzes[2].material.emissiveIntensity = ciclo >= .5 ? 2.2 : .12;
    }
  });

  // ===== PLAZA CENTRAL (isla peatonal r15) =====
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(15, 40),
    new THREE.MeshStandardMaterial({ color: 0xe8e2d4, roughness: 1 }));
  plaza.rotation.x = -PIE / 2; plaza.position.y = .03; plaza.receiveShadow = true; escena.add(plaza);
  const anillo = new THREE.Mesh(new THREE.RingGeometry(14.2, 15, 40),
    new THREE.MeshStandardMaterial({ color: 0x00F299, roughness: .6 }));
  anillo.rotation.x = -PIE / 2; anillo.position.y = .035; escena.add(anillo);
  const fuente = crearFuente(); escena.add(fuente);
  animables.push((t) => fuente.userData.animar(t));
  col.registrar(0, 0, 5.8, 5.8);

  // cartel ALICE CITY — dentro de la isla, mirando al sur (spawn)
  const cartel = new THREE.Group();
  const tab = new THREE.Mesh(new THREE.BoxGeometry(10, 3, .3),
    new THREE.MeshStandardMaterial({ map: lienzox(512, 160, (g) => {
      g.fillStyle = '#0a1418'; g.fillRect(0, 0, 512, 160);
      g.strokeStyle = '#00F299'; g.lineWidth = 10; g.strokeRect(8, 8, 496, 144);
      g.fillStyle = '#ffffff'; g.font = '900 74px sans-serif'; g.textAlign = 'center';
      g.fillText('ALICE ', 190, 105);
      g.fillStyle = '#00F299'; g.fillText('CITY', 360, 105);
      g.fillStyle = '#00d1ff'; g.font = '700 26px sans-serif';
      g.fillText('EL MUNDO DE LOS AGENTES', 256, 142);
    }), roughness: .7 }));
  tab.position.y = 5.4; cartel.add(tab);
  for (const dx of [-4, 4]) {
    const pata = new THREE.Mesh(new THREE.CylinderGeometry(.18, .22, 5.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x37414a, metalness: .4 }));
    pata.position.set(dx, 2.7, 0); cartel.add(pata);
  }
  cartel.position.set(0, 0, -11.6); escena.add(cartel);
  col.registrar(0, -11.6, 10, .8);
  col.registrar(-4, -11.6, .6, .6); col.registrar(4, -11.6, .6, .6);

  // banderas (esquivando el cartel)
  const matPoste = new THREE.MeshStandardMaterial({ color: 0x8b939b, metalness: .5 });
  for (const ang of [.55, 1.75, 2.95, 5.5]) {
    const px = Math.cos(ang) * 11, pz = Math.sin(ang) * 11;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 5, 6), matPoste);
    p.position.set(px, 2.5, pz); p.castShadow = true; escena.add(p);
    const bandera = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .9),
      new THREE.MeshStandardMaterial({ color: elegir([0x00F299, 0x00d1ff, 0xfb2c36, 0xffd166]), side: THREE.DoubleSide }));
    bandera.position.set(px + .82, 4.4, pz);
    escena.add(bandera);
    animables.push((t) => { bandera.rotation.y = Math.sin(t * 2 + ang) * .35; });
    col.registrar(px, pz, .4, .4);
  }
  // puestos de la plaza — dentro de la isla, nunca en la rotonda
  for (const [x, z, c] of [[10.5, 10.5, '#fb2c36'], [-10.5, 10.5, '#00d1ff'], [10.5, -10.5, '#00F299'], [-10.5, -10.5, '#ffd166']]) {
    const p = crearPuesto(c); p.position.set(x, 0, z); p.lookAt(0, 0, 0); escena.add(p);
    col.registrar(x, z, 3.1, 3.1);
  }
  // maceteros alrededor de la fuente
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * PIE * 2 + .3;
    const x = Math.cos(a) * 4.6, z = Math.sin(a) * 4.6;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(.42, .5, .5, 8),
      new THREE.MeshStandardMaterial({ color: 0xb0654a, roughness: .9 }));
    m.position.set(x, .25, z); m.castShadow = true; escena.add(m);
    const arbusto = new THREE.Mesh(new THREE.IcosahedronGeometry(.34, 0),
      new THREE.MeshStandardMaterial({ color: elegir([0x3fae5a, 0x58c96b]), roughness: .95, flatShading: true }));
    arbusto.position.set(x, .72, z); escena.add(arbusto);
    col.registrar(x, z, .9, .9);
  }
  // globos flotando
  for (let i = 0; i < 7; i++) {
    const gl = crearGlobo(elegir([0x00F299, 0x00d1ff, 0xfb2c36, 0xffd166, 0xff7b6b]));
    const a = rnd(0, 6.28), r = rnd(4, 10);
    gl.position.set(Math.cos(a) * r, rnd(2.4, 4), Math.sin(a) * r);
    escena.add(gl);
    animables.push((t) => { gl.position.y += Math.sin(t * 1.4 + i) * .0025; gl.rotation.z = Math.sin(t + i) * .08; });
  }
  // kiosco con el mapa de la ciudad
  const kiosco = new THREE.Group();
  const mapa = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, .14),
    new THREE.MeshStandardMaterial({ map: texMapaCiudad(), roughness: .6 }));
  mapa.position.y = 2.1; mapa.castShadow = true; kiosco.add(mapa);
  const techoK = new THREE.Mesh(new THREE.BoxGeometry(3.6, .14, .9),
    new THREE.MeshStandardMaterial({ color: 0x00d1ff, roughness: .6 }));
  techoK.position.set(0, 3.35, -.1); kiosco.add(techoK);
  for (const dx of [-1.3, 1.3]) {
    const pata = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, 2.1, 6),
      new THREE.MeshStandardMaterial({ color: 0x37414a, metalness: .4 }));
    pata.position.set(dx, 1.05, -.1); kiosco.add(pata);
  }
  kiosco.position.set(-9, 0, 5.5); kiosco.rotation.y = Math.atan2(9, -5.5);
  escena.add(kiosco);
  col.registrar(-9, 5.5, 2.2, 1.4);
  // bancos de la plaza
  const bancosPos = [];
  for (const ang of [.4, 1.6, 3.35, 5.35]) {
    const x = Math.cos(ang) * 11.5, z = Math.sin(ang) * 11.5;
    const rot = Math.atan2(-x, -z) + PIE; // mira al centro
    const b = crearBanco(); b.position.set(x, 0, z); b.rotation.y = rot; escena.add(b);
    bancosPos.push({ x, z, rot });
    col.banco(x, z, rot);
  }

  // ===== MINAS DEL OESTE (-38, -38) — manzana NO =====
  const minaX = -38, minaZ = -38;
  const zonaMina = new THREE.Mesh(new THREE.CircleGeometry(16, 28),
    new THREE.MeshStandardMaterial({ color: 0x9a8f7a, roughness: 1 }));
  zonaMina.rotation.x = -PIE / 2; zonaMina.position.set(minaX, .03, minaZ); zonaMina.receiveShadow = true; escena.add(zonaMina);
  const nucleo = new THREE.Mesh(new THREE.CircleGeometry(9, 24),
    new THREE.MeshStandardMaterial({ color: 0x837a67, roughness: 1 }));
  nucleo.rotation.x = -PIE / 2; nucleo.position.set(minaX, .035, minaZ); escena.add(nucleo);
  // raíles circulares con traviesas + vagoneta
  const lecho = new THREE.Mesh(new THREE.RingGeometry(7.5, 8.6, 36),
    new THREE.MeshStandardMaterial({ color: 0x6e6555, roughness: 1 }));
  lecho.rotation.x = -PIE / 2; lecho.position.set(minaX, .04, minaZ); escena.add(lecho);
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * PIE * 2;
    const tr = new THREE.Mesh(new THREE.BoxGeometry(1.7, .06, .3),
      new THREE.MeshStandardMaterial({ color: 0x5b4a34, roughness: 1 }));
    tr.rotation.x = -PIE / 2; tr.rotation.z = -a + PIE / 2;
    tr.position.set(minaX + Math.cos(a) * 8.05, .05, minaZ + Math.sin(a) * 8.05);
    escena.add(tr);
  }
  for (const rOff of [-.22, .22]) {
    const rail = new THREE.Mesh(new THREE.TorusGeometry(8.05 + 0, .04, 5, 40),
      new THREE.MeshStandardMaterial({ color: 0x8b939b, metalness: .6, roughness: .4 }));
    rail.rotation.x = -PIE / 2; rail.position.set(minaX, .1, minaZ); rail.scale.setScalar(1 + rOff * .02);
    escena.add(rail);
  }
  const vagoneta = new THREE.Group();
  const cub = new THREE.Mesh(new THREE.BoxGeometry(1.4, .7, .9),
    new THREE.MeshStandardMaterial({ color: 0x5b656d, metalness: .4 }));
  cub.position.y = .75; vagoneta.add(cub);
  const mineral = new THREE.Mesh(new THREE.IcosahedronGeometry(.35, 0),
    new THREE.MeshStandardMaterial({ color: 0x00d1ff, emissive: 0x00d1ff, emissiveIntensity: .4, flatShading: true }));
  mineral.position.y = 1.2; vagoneta.add(mineral);
  for (const dx of [-.5, .5]) for (const dz of [-.32, .32]) {
    const rueda = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .08, 10),
      new THREE.MeshStandardMaterial({ color: 0x2c2c2c }));
    rueda.rotation.x = PIE / 2; rueda.position.set(dx, .2, dz); vagoneta.add(rueda);
  }
  vagoneta.position.set(minaX + 8.05, 0, minaZ);
  vagoneta.rotation.y = PIE / 2; escena.add(vagoneta);
  col.registrar(minaX + 8.05, minaZ, 1.6, 1);
  // rocas del anillo
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * PIE * 2 + rnd(-.2, .2);
    if (Math.abs(Math.sin(a - PIE / 4)) < .45 && Math.cos(a) > 0) continue; // hueco de entrada NE
    const roca = new THREE.Mesh(new THREE.IcosahedronGeometry(rnd(.55, 1.15), 0),
      new THREE.MeshStandardMaterial({ color: 0x77705f, roughness: 1, flatShading: true }));
    roca.position.set(minaX + Math.cos(a) * rnd(12.5, 14.5), .3, minaZ + Math.sin(a) * rnd(12.5, 14.5));
    roca.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3));
    roca.castShadow = true; escena.add(roca);
    col.registrar(roca.position.x, roca.position.z, 1.7, 1.7);
  }
  // cristales decorativos interiores (los minables los pone economy.js)
  for (let i = 0; i < 6; i++) {
    const c = crearCristal(Math.random() < .5 ? 0x00d1ff : 0x00F299);
    const a = rnd(0, 6.28), r = rnd(3.5, 6.8);
    c.position.set(minaX + Math.cos(a) * r, 0, minaZ + Math.sin(a) * r);
    c.scale.setScalar(rnd(.8, 1.4)); escena.add(c);
  }
  // portal de entrada NE con rótulo y faroles
  const portalM = new THREE.Group();
  const matMaderaM = new THREE.MeshStandardMaterial({ color: 0x6e4a2e, roughness: .95 });
  for (const dx of [-2, 2]) {
    const poste = new THREE.Mesh(new THREE.BoxGeometry(.3, 3.4, .3), matMaderaM);
    poste.position.set(dx, 1.7, 0); poste.castShadow = true; portalM.add(poste);
    col.registrar(minaX + 10.5 + dx, minaZ + 10.5, .5, .5);
  }
  const dintel = new THREE.Mesh(new THREE.BoxGeometry(4.6, .35, .4), matMaderaM);
  dintel.position.y = 3.4; portalM.add(dintel);
  const rótuloM = new THREE.Mesh(new THREE.PlaneGeometry(4, .9),
    new THREE.MeshStandardMaterial({ map: lienzox(256, 64, (g) => {
      g.fillStyle = '#10181f'; g.fillRect(0, 0, 256, 64);
      g.strokeStyle = '#c9a227'; g.lineWidth = 6; g.strokeRect(4, 4, 248, 56);
      g.fillStyle = '#ffd166'; g.font = '900 34px sans-serif'; g.textAlign = 'center';
      g.fillText('MINAS DEL OESTE', 128, 44);
    }), roughness: .6 }));
  rótuloM.position.y = 2.95; portalM.add(rótuloM);
  for (const dx of [-1.4, 1.4]) {
    const farol = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xffe9a0, emissive: 0xffc94d, emissiveIntensity: 1.1 }));
    farol.position.set(dx, 2.4, .25); portalM.add(farol);
  }
  portalM.position.set(minaX + 10.5, 0, minaZ + 10.5);
  portalM.rotation.y = -PIE / 4 - PIE / 2;
  escena.add(portalM);
  // camino de tierra entrada → núcleo
  const caminoMina = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 15),
    new THREE.MeshStandardMaterial({ color: 0xa89468, roughness: 1 }));
  caminoMina.rotation.x = -PIE / 2;
  caminoMina.position.set(minaX + 7.2, .028, minaZ + 7.2);
  caminoMina.rotation.z = -PIE / 4;
  escena.add(caminoMina);

  // ===== MERCADO DEL ESTE (38, 38) — manzana SE, plaza ordenada =====
  const merX = 38, merZ = 38;
  plano(26, 26, merX, merZ, .03, new THREE.MeshStandardMaterial({ color: 0xd9c9a8, roughness: 1 }));
  plano(4.4, 26, merX, merZ, .038, new THREE.MeshStandardMaterial({ color: 0xcbb98f, roughness: 1 }));
  // hileras de puestos mirando al pasillo central
  const filasM = [[28, 33.5], [38, 33.5], [48, 33.5], [28, 42.5], [38, 42.5], [48, 42.5]];
  filasM.forEach(([x, z], i) => {
    const p = crearPuesto(['#fb2c36', '#00d1ff', '#00F299', '#ffd166', '#ff8fab', '#7ee8a2'][i]);
    p.position.set(x, 0, z); p.lookAt(x, 0, merZ); escena.add(p);
    col.registrar(x, z, 2.8, 2.4);
    // cajones de fruta junto al puesto
    const cz = z < merZ ? z + 1.9 : z - 1.9;
    const caj = new THREE.Mesh(new THREE.BoxGeometry(.8, .5, .6),
      new THREE.MeshStandardMaterial({ color: 0xa9805a, roughness: .95 }));
    caj.position.set(x + 1.9, .25, cz); caj.castShadow = true; escena.add(caj);
    col.registrar(x + 1.9, cz, .9, .7);
    // cartel de precio
    const precio = new THREE.Mesh(new THREE.PlaneGeometry(.7, .35),
      new THREE.MeshStandardMaterial({ map: lienzox(96, 48, (g) => {
        g.fillStyle = '#f5f0e6'; g.fillRect(0, 0, 96, 48);
        g.fillStyle = '#10181f'; g.font = '900 26px sans-serif'; g.textAlign = 'center';
        g.fillText(`${3 + i} ALC`, 48, 34);
      }), roughness: .7, side: THREE.DoubleSide }));
    precio.position.set(x - 1.2, 1.15, cz); precio.rotation.y = x < merX ? -PIE / 2 : PIE / 2;
    escena.add(precio);
  });
  // guirnaldas de luces sobre el pasillo
  for (const zz of [35.8, 38, 40.2]) {
    const bombillas = [];
    for (let i = 0; i <= 8; i++) {
      const x = 24 + i * 3.5;
      const b = new THREE.Mesh(new THREE.SphereGeometry(.09, 6, 5),
        new THREE.MeshStandardMaterial({ color: 0xfff3b0, emissive: 0xffd166, emissiveIntensity: 1 }));
      b.position.set(x, 2.6 - Math.sin((i / 8) * PIE) * .5, zz); escena.add(b);
      bombillas.push(b);
    }
    animables.push((t) => { const k = .75 + Math.sin(t * 3 + zz) * .3; for (const b of bombillas) b.material.emissiveIntensity = k; });
  }
  // tablero de contratos al norte de la plaza
  const tablero = new THREE.Group();
  const panel = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.6, .2),
    new THREE.MeshStandardMaterial({ map: texTablero(), roughness: .8 }));
  panel.position.y = 2.4; panel.castShadow = true; tablero.add(panel);
  for (const dx of [-1.8, 1.8]) {
    const pata = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, 2.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x6b5a3e }));
    pata.position.set(dx, 1.2, 0); tablero.add(pata);
  }
  tablero.position.set(merX, 0, 47.5); tablero.rotation.y = PIE; escena.add(tablero);
  col.registrar(merX, 47.5, 4.6, 1);
  // bancos del mercado
  for (const [x, z, r] of [[33, 45.2, PIE], [43, 45.2, PIE]]) {
    const b = crearBanco(); b.position.set(x, 0, z); b.rotation.y = r; escena.add(b);
    bancosPos.push({ x, z, rot: r });
    col.banco(x, z, r);
  }
  papelera(26.5, 28); papelera(49.5, 28);

  // ===== PARQUE SUR (-38, 38) — manzana SO =====
  const parX = -38, parZ = 38;
  const cespedParque = new THREE.Mesh(new THREE.CircleGeometry(18, 36),
    new THREE.MeshStandardMaterial({ color: 0x8ad35f, roughness: 1 }));
  cespedParque.rotation.x = -PIE / 2; cespedParque.position.set(parX, .032, parZ); cespedParque.receiveShadow = true; escena.add(cespedParque);
  // sendero circular + radiales
  const sendero = new THREE.Mesh(new THREE.RingGeometry(7.6, 9.4, 36),
    new THREE.MeshStandardMaterial({ color: 0xd9c9a8, roughness: 1 }));
  sendero.rotation.x = -PIE / 2; sendero.position.set(parX, .04, parZ); escena.add(sendero);
  for (const [dx, dz, len] of [[1, 0, 19], [-1, 0, 19], [0, 1, 19], [0, -1, 19]]) {
    const camino = new THREE.Mesh(new THREE.PlaneGeometry(2, len),
      new THREE.MeshStandardMaterial({ color: 0xd9c9a8, roughness: 1 }));
    camino.rotation.x = -PIE / 2;
    camino.position.set(parX + dx * (9 + len / 2 - 1), .04, parZ + dz * (9 + len / 2 - 1));
    camino.rotation.z = dx !== 0 ? PIE / 2 : 0;
    escena.add(camino);
  }
  // estanque con patos
  const estanque = new THREE.Mesh(new THREE.CircleGeometry(5.5, 28),
    new THREE.MeshStandardMaterial({ color: 0x4fc3e8, roughness: .2, metalness: .1 }));
  estanque.rotation.x = -PIE / 2; estanque.position.set(parX, .045, parZ); escena.add(estanque);
  const orillaP = new THREE.Mesh(new THREE.RingGeometry(5.5, 6.3, 28),
    new THREE.MeshStandardMaterial({ color: 0xd8cfc0 }));
  orillaP.rotation.x = -PIE / 2; orillaP.position.set(parX, .048, parZ); escena.add(orillaP);
  col.circulo(parX, parZ, 5.7);
  for (let i = 0; i < 3; i++) {
    const pato = new THREE.Group();
    const cue = new THREE.Mesh(new THREE.SphereGeometry(.14, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xfff3c9 }));
    cue.scale.set(1.2, .8, 1.4); pato.add(cue);
    const cab = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), cue.material);
    cab.position.set(0, .12, .12); pato.add(cab);
    const pico = new THREE.Mesh(new THREE.ConeGeometry(.03, .08, 5),
      new THREE.MeshStandardMaterial({ color: 0xff9f43 }));
    pico.rotation.x = PIE / 2; pico.position.set(0, .12, .22); pato.add(pico);
    pato.position.set(parX + rnd(-3, 3), .06, parZ + rnd(-3, 3));
    escena.add(pato);
    animables.push((t) => { pato.position.x += Math.cos(t * .4 + i) * .004; pato.position.z += Math.sin(t * .3 + i) * .003; });
  }
  // pérgola
  const pergola = new THREE.Group();
  const matPer = new THREE.MeshStandardMaterial({ color: 0x8a5a2e, roughness: .95 });
  for (const [dx, dz] of [[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(.18, 2.4, .18), matPer);
    p.position.set(dx, 1.2, dz); p.castShadow = true; pergola.add(p);
  }
  for (let i = 0; i < 5; i++) {
    const list = new THREE.Mesh(new THREE.BoxGeometry(2.6, .08, .16), matPer);
    list.position.set(0, 2.45, -1.1 + i * .55); pergola.add(list);
  }
  const bancoPerg = crearBanco(); bancoPerg.position.set(0, 0, .1); pergola.add(bancoPerg);
  pergola.position.set(parX - 11, 0, parZ + 11); pergola.rotation.y = PIE / 4;
  escena.add(pergola);
  col.registrar(parX - 11, parZ + 11, 3, 3);
  bancosPos.push({ x: parX - 11, z: parZ + 11, rot: PIE / 4 });
  // bancos alrededor del estanque (en diagonales, fuera de los caminos)
  for (const ang of [.7, 2.2, 3.6, 5.2]) {
    const x = parX + Math.cos(ang) * 11, z = parZ + Math.sin(ang) * 11;
    const rot = Math.atan2(parX - x, parZ - z);
    const b = crearBanco(); b.position.set(x, 0, z); b.rotation.y = rot; escena.add(b);
    bancosPos.push({ x, z, rot });
    col.banco(x, z, rot);
  }
  // flores y árboles del parque
  for (let i = 0; i < 26; i++) {
    const a = rnd(0, 6.28), r = rnd(11, 16.5);
    const flor = new THREE.Group();
    const tallo = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .3, 4),
      new THREE.MeshStandardMaterial({ color: 0x3fae5a }));
    tallo.position.y = .15; flor.add(tallo);
    const cor = new THREE.Mesh(new THREE.SphereGeometry(.09, 6, 5),
      new THREE.MeshStandardMaterial({ color: elegir([0xff5a4e, 0xffd166, 0xff8fab, 0xa3e635]), roughness: .7 }));
    cor.position.y = .32; flor.add(cor);
    flor.position.set(parX + Math.cos(a) * r, 0, parZ + Math.sin(a) * r);
    escena.add(flor);
  }
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * PIE * 2 + .35;
    const x = parX + Math.cos(a) * 16.2, z = parZ + Math.sin(a) * 16.2;
    if (Math.abs((x - parX)) < 4 || Math.abs((z - parZ)) < 4) continue; // hueco para caminos
    const ar = crearArbol(rnd(1, 1.4)); ar.position.set(x, 0, z); escena.add(ar);
    col.registrar(x, z, .8, .8);
  }
  papelera(parX + 8.5, parZ - 8.5); hidrante(parX - 8.5, parZ + 8.5);

  // ===== PARCELAS DEL NORTE — manzana NE, fila ordenada =====
  const texV = texValla();
  const parcelas = { jugador: { x: 14, z: -52 }, bots: [] };
  const crearParcela = (x, z, esJugador) => {
    const g = new THREE.Group();
    const tierra = new THREE.Mesh(new THREE.PlaneGeometry(14, 10),
      new THREE.MeshStandardMaterial({ color: esJugador ? 0xc9b287 : 0xb5a582, roughness: 1 }));
    tierra.rotation.x = -PIE / 2; tierra.position.y = .03; tierra.receiveShadow = true; g.add(tierra);
    const matValla = new THREE.MeshStandardMaterial({ map: texV, roughness: .9 });
    // vallas: norte completa, este/oeste, sur con hueco de 3 (entrada)
    for (const [w, l, ox, oz] of [[14, .18, 0, -5], [.18, 10, -7, 0], [.18, 10, 7, 0]]) {
      const v = new THREE.Mesh(new THREE.BoxGeometry(w, .9, l), matValla);
      v.position.set(ox, .45, oz); v.castShadow = true; g.add(v);
    }
    for (const s of [-1, 1]) {
      const v = new THREE.Mesh(new THREE.BoxGeometry(5.5, .9, .18), matValla);
      v.position.set(s * 4.25, .45, 5); v.castShadow = true; g.add(v);
    }
    g.position.set(x, 0, z); escena.add(g);
    // colisiones de la valla (con hueco al sur)
    col.registrar(x, z - 5, 14, .4);
    col.registrar(x - 7, z, .4, 10);
    col.registrar(x + 7, z, .4, 10);
    col.registrar(x - 4.25, z + 5, 5.5, .4);
    col.registrar(x + 4.25, z + 5, 5.5, .4);
    if (esJugador) {
      const letrero = new THREE.Mesh(new THREE.BoxGeometry(3, .9, .12),
        new THREE.MeshStandardMaterial({ color: 0x00F299, emissive: 0x00F299, emissiveIntensity: .25 }));
      letrero.position.set(0, 1.9, 5.3); g.add(letrero);
      const texto = new THREE.Mesh(new THREE.PlaneGeometry(2.8, .7),
        new THREE.MeshStandardMaterial({ map: lienzox(256, 64, (c) => {
          c.fillStyle = '#003b26'; c.font = '900 38px sans-serif'; c.textAlign = 'center';
          c.fillText('TU PARCELA', 128, 44);
        }), roughness: .6 }));
      texto.position.set(0, 1.9, 5.38); g.add(texto);
      for (const dx of [-1.2, 1.2]) {
        const pata = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.9, 6),
          new THREE.MeshStandardMaterial({ color: 0x8b939b }));
        pata.position.set(dx, .95, 5.3); g.add(pata);
      }
    }
  };
  crearParcela(parcelas.jugador.x, parcelas.jugador.z, true);
  for (let i = 0; i < 3; i++) {
    const px = 30 + i * 16;
    crearParcela(px, -52, false);
    parcelas.bots.push({ x: px, z: -52 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(4, rnd(1.5, 2.6), 3.4),
      new THREE.MeshStandardMaterial({ color: elegir(COLORES_EDIFICIOS), roughness: .9 }));
    base.position.set(px, base.geometry.parameters.height / 2, -52);
    base.castShadow = true; escena.add(base);
    col.registrar(px, -52, 4.2, 3.6);
    const esc = new THREE.Mesh(new THREE.ConeGeometry(.4, .8, 4),
      new THREE.MeshStandardMaterial({ color: 0xff9f43 }));
    esc.position.set(px + 2.4, .4, -49); esc.rotation.z = .7; escena.add(esc);
  }
  // camino de tierra hacia las parcelas
  const caminoP = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 34),
    new THREE.MeshStandardMaterial({ color: 0xa89468, roughness: 1 }));
  caminoP.rotation.x = -PIE / 2; caminoP.position.set(38, .028, -30); escena.add(caminoP);

  // ===== EDIFICIOS EN FILA — 4 franjas exteriores, ordenados y alineados =====
  const plantas = [9, 14, 11, 17, 10, 15, 12, 13];
  const traseras = [12, 16];
  let nomIdx = 0;
  const filaEdificios = (esE, esN) => {
    // franja E/O: x fija, filas según z — franja N/S: z fija, filas según x
    const principales = [16, 32, 48, 64];
    const secundarias = [24, 56];
    for (const s of [1, -1]) {
      principales.forEach((p, i) => {
        const h = plantas[i % plantas.length];
        const nombre = NOMBRES_TIENDAS[(nomIdx++) % NOMBRES_TIENDAS.length];
        const e = crearEdificioV5(12, h, 11, elegir(COLORES_EDIFICIOS), nombre);
        if (esE !== null) {
          const x = esE ? (esE === true ? 89 : -89) : 0;
          const z = s * p;
          e.position.set(x, 0, z); e.rotation.y = esE === true ? -PIE / 2 : PIE / 2;
          escena.add(e); col.registrar(x, z, 11, 12);
        } else {
          const z = esN ? -89 : 89;
          const x = s * p;
          e.position.set(x, 0, z); e.rotation.y = esN ? 0 : PIE;
          escena.add(e); col.registrar(x, z, 12, 11);
        }
      });
      secundarias.forEach((p, i) => {
        const h = traseras[i % traseras.length];
        const nombre = NOMBRES_TIENDAS[(nomIdx++) % NOMBRES_TIENDAS.length];
        const e = crearEdificioV5(12, h, 11, elegir(COLORES_EDIFICIOS), nombre);
        if (esE !== null) {
          const x = esE === true ? 106 : -106;
          const z = s * p;
          e.position.set(x, 0, z); e.rotation.y = esE === true ? -PIE / 2 : PIE / 2;
          escena.add(e); col.registrar(x, z, 11, 12);
        } else {
          const z = esN ? -106 : 106;
          const x = s * p;
          e.position.set(x, 0, z); e.rotation.y = esN ? 0 : PIE;
          escena.add(e); col.registrar(x, z, 12, 11);
        }
      });
    }
  };
  filaEdificios(true, null);   // franja este (detrás de la avenida x=75)
  filaEdificios(false, null);  // franja oeste
  filaEdificios(null, true);   // franja norte
  filaEdificios(null, false);  // franja sur

  // ===== PARADA DE BUS (av. central, acera norte) =====
  const parada = new THREE.Group();
  const matPar = new THREE.MeshStandardMaterial({ color: 0x37414a, metalness: .4, roughness: .5 });
  for (const dx of [-1.4, 1.4]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(.1, 2.4, .1), matPar);
    p.position.set(dx, 1.2, 0); parada.add(p);
  }
  const techoP = new THREE.Mesh(new THREE.BoxGeometry(3.2, .1, 1.3),
    new THREE.MeshStandardMaterial({ color: 0x00d1ff, roughness: .5 }));
  techoP.position.y = 2.45; techoP.castShadow = true; parada.add(techoP);
  const trasP = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.9, .06),
    new THREE.MeshStandardMaterial({ color: 0x9fd8ec, roughness: .15, metalness: .3, transparent: true, opacity: .55 }));
  trasP.position.set(0, 1.25, -.55); parada.add(trasP);
  const bancoPar = crearBanco(); bancoPar.position.set(0, 0, -.15); bancoPar.rotation.y = PIE; parada.add(bancoPar);
  const cartelP = new THREE.Mesh(new THREE.PlaneGeometry(.9, .5),
    new THREE.MeshStandardMaterial({ map: lienzox(96, 48, (g) => {
      g.fillStyle = '#00d1ff'; g.fillRect(0, 0, 96, 48);
      g.fillStyle = '#10181f'; g.font = '900 30px sans-serif'; g.textAlign = 'center';
      g.fillText('BUS', 48, 36);
    }), roughness: .6, side: THREE.DoubleSide }));
  cartelP.position.set(1.7, 2.75, 0); parada.add(cartelP);
  const rutaP = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .8),
    new THREE.MeshStandardMaterial({ map: lienzox(96, 72, (g) => {
      g.fillStyle = '#f5f0e6'; g.fillRect(0, 0, 96, 72);
      g.fillStyle = '#00d1ff'; g.font = '900 20px sans-serif'; g.textAlign = 'center';
      g.fillText('LÍNEA 1', 48, 26);
      g.fillStyle = '#10181f'; g.font = '700 13px sans-serif';
      g.fillText('Plaza → Mercado', 48, 46); g.fillText('→ Downtown', 48, 62);
    }), roughness: .7 }));
  rutaP.position.set(-1.55, 1.5, .08); parada.add(rutaP);
  parada.position.set(30, 0, -5.6); escena.add(parada);
  col.registrar(30, -5.6, 3.4, 1.4);
  bancosPos.push({ x: 30, z: -5.75, rot: PIE });
  papelera(25.5, -6.6);

  // ===== SEÑALES DE CALLE en la rotonda =====
  for (const [x, z, n1, n2] of [[-6.9, 6.9, 'AV ALICE', 'CALLE ZOLO'], [6.9, -6.9, 'AV ALICE', 'CALLE PIXEL']]) {
    const g = new THREE.Group();
    const p = new THREE.Mesh(new THREE.CylinderGeometry(.05, .06, 2.6, 6),
      new THREE.MeshStandardMaterial({ color: 0x8b939b, metalness: .5 }));
    p.position.y = 1.3; g.add(p);
    for (const [i, txt] of [n1, n2].entries()) {
      const pl = new THREE.Mesh(new THREE.BoxGeometry(1.5, .3, .04),
        new THREE.MeshStandardMaterial({ map: lienzox(160, 32, (c) => {
          c.fillStyle = '#1a6e8e'; c.fillRect(0, 0, 160, 32);
          c.fillStyle = '#ffffff'; c.font = '900 20px sans-serif'; c.textAlign = 'center';
          c.fillText(txt, 80, 23);
        }), roughness: .6 }));
      pl.position.set(.75, 2.45 - i * .42, 0); pl.rotation.y = i === 0 ? PIE / 4 : -PIE / 4;
      g.add(pl);
    }
    g.position.set(x, 0, z); escena.add(g);
    col.registrar(x, z, .4, .4);
  }

  // ===== ÁRBOLES en alineación (verdes de calle) =====
  const cercaDistrito = (x, z) =>
    Math.hypot(x - 38, z - 38) < 21 || Math.hypot(x + 38, z - 38) < 20 ||
    Math.hypot(x + 38, z + 38) < 19 || (x > 5 && x < 70 && z < -44 && z > -62) ||
    Math.hypot(x - 114, z + 114) < 27 || Math.hypot(x + 114, z - 114) < 38 || Math.hypot(x + 114, z + 114) < 32 ||
    Math.abs(x - 100) < 14 && Math.abs(z - 30) < 12; // aparcamiento
  for (const L of [...PLAN.LINEAS_V, ...PLAN.LINEAS_H]) {
    const vertical = PLAN.LINEAS_V.includes(L);
    for (const s of [-1, 1]) {
      for (let p = -132; p <= 132; p += 30) {
        const x = vertical ? L + s * 8.2 : p;
        const z = vertical ? p : L + s * 8.2;
        if (Math.abs(x) > 146 || Math.abs(z) > 146) continue;
        if (PLAN.LINEAS_H.some((H) => Math.abs((vertical ? z : x) - H) < 10)) continue;
        if (Math.hypot(x, z) < 28) continue;
        if (cercaDistrito(x, z)) continue;
        const ar = crearArbol(rnd(.9, 1.3)); ar.position.set(x, 0, z); escena.add(ar);
        col.registrar(x, z, .7, .7);
      }
    }
  }

  // ===== NUBES =====
  for (let i = 0; i < 9; i++) {
    const n = crearNube();
    n.position.set(rnd(-140, 140), rnd(38, 62), rnd(-140, 140));
    escena.add(n);
    animables.push((t) => {
      n.position.x += .028;
      if (n.position.x > 160) n.position.x = -160;
    });
  }

  // mariposas del parque
  const nM = 14, mPos = new Float32Array(nM * 3), mGeo = new THREE.BufferGeometry();
  const mSem = [];
  for (let i = 0; i < nM; i++) mSem.push({ a: rnd(0, 6.28), r: rnd(6, 13), f: rnd(.4, 1), o: rnd(0, 6) });
  mGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
  const mariposas = new THREE.Points(mGeo, new THREE.PointsMaterial({ color: 0xffd166, size: .14, transparent: true, opacity: .95 }));
  escena.add(mariposas);
  animables.push((t) => {
    for (let i = 0; i < nM; i++) {
      const s = mSem[i];
      mPos[i * 3] = -38 + Math.cos(s.a + t * s.f * .3) * s.r;
      mPos[i * 3 + 1] = .8 + Math.sin(t * s.f + s.o) * .45;
      mPos[i * 3 + 2] = 38 + Math.sin(s.a + t * s.f * .25) * s.r;
    }
    mGeo.attributes.position.needsUpdate = true;
  });

  const zonas = {
    plaza: new THREE.Vector3(0, 0, 12),
    mina: new THREE.Vector3(-38, 0, -38),
    mercado: new THREE.Vector3(38, 0, 38),
    parque: new THREE.Vector3(-38, 0, 38),
    parcela: new THREE.Vector3(parcelas.jugador.x, 0, -45),
    tablero: new THREE.Vector3(38, 0, 45),
  };
  return { animables, zonas, parcelas, bancosPos };
}

// ---------- globo / puesto (usados arriba; hoisted) ----------
function crearGlobo(color) {
  const g = new THREE.Group();
  const esf = new THREE.Mesh(new THREE.SphereGeometry(.5, 12, 10),
    new THREE.MeshStandardMaterial({ color, roughness: .4 }));
  esf.scale.y = 1.15; g.add(esf);
  const hilo = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, 1.4, 4),
    new THREE.MeshStandardMaterial({ color: 0xffffff }));
  hilo.position.y = -.7; g.add(hilo);
  return g;
}
function crearPuesto(colorToldo) {
  const g = new THREE.Group();
  const mesa = new THREE.Mesh(new THREE.BoxGeometry(2.2, .12, 1.1),
    new THREE.MeshStandardMaterial({ color: 0xc98d4e, roughness: .9 }));
  mesa.position.y = .85; mesa.castShadow = true; g.add(mesa);
  for (const [x, z] of [[-1, -.45], [1, -.45], [-1, .45], [1, .45]]) {
    const pata = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .85, 6),
      new THREE.MeshStandardMaterial({ color: 0x8a6a3e }));
    pata.position.set(x, .42, z); g.add(pata);
  }
  const toldo = new THREE.Mesh(new THREE.BoxGeometry(2.5, .08, 1.5),
    new THREE.MeshStandardMaterial({ map: lienzox(128, 64, (c) => {
      c.fillStyle = '#fff'; c.fillRect(0, 0, 128, 64);
      c.fillStyle = colorToldo;
      for (let x = 0; x < 128; x += 24) c.fillRect(x, 0, 12, 64);
    }), roughness: .85 }));
  toldo.position.y = 2.05; toldo.rotation.x = -.12; toldo.castShadow = true; g.add(toldo);
  for (const [x, z] of [[-1.15, -.65], [1.15, -.65], [-1.15, .65], [1.15, .65]]) {
    const palo = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 2, 6),
      new THREE.MeshStandardMaterial({ color: 0xd9d2c5 }));
    palo.position.set(x, 1, z); g.add(palo);
  }
  for (let i = 0; i < 8; i++) {
    const fr = new THREE.Mesh(new THREE.SphereGeometry(.11, 7, 6),
      new THREE.MeshStandardMaterial({ color: elegir([0xff5a4e, 0xffb627, 0x7ed957, 0xff8fab]), roughness: .7 }));
    fr.position.set(rnd(-.9, .9), .98, rnd(-.35, .35)); g.add(fr);
  }
  return g;
}
