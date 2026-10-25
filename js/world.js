// ============ ALICE CITY — Mundo brillante y colorido ============
import * as THREE from 'three';

const rnd = (a, b) => a + Math.random() * (b - a);
const elegir = (arr) => arr[(Math.random() * arr.length) | 0];

// Paleta vibrante (SIN púrpura): coral, sol, menta, cielo, melocotón, lima, turquesa
const COLORES_EDIFICIOS = ['#ff7b6b', '#ffd166', '#7ee8a2', '#6fd6ff', '#ffb38a', '#a3e635', '#4ecdc4', '#ff8fab', '#f9ed69', '#8ad7c1'];

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

// ---------- cielo ----------
function crearCielo(escena) {
  const geo = new THREE.SphereGeometry(400, 24, 16);
  const tex = lienzox(64, 256, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#3aa7e8');      // cenit azul vivo
    gr.addColorStop(.45, '#8ed4f7');
    gr.addColorStop(.75, '#cdeffb');    // horizonte pálido
    gr.addColorStop(1, '#e8fbf2');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
  });
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false });
  const cielo = new THREE.Mesh(geo, mat);
  escena.add(cielo);
  return cielo;
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

// ---------- árbol ----------
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

// ---------- farola ----------
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

// ---------- banco ----------
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

// ---------- puesto de mercado ----------
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
  // toldo rayado
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
  // fruta
  for (let i = 0; i < 8; i++) {
    const fr = new THREE.Mesh(new THREE.SphereGeometry(.11, 7, 6),
      new THREE.MeshStandardMaterial({ color: elegir([0xff5a4e, 0xffb627, 0x7ed957, 0xff8fab]), roughness: .7 }));
    fr.position.set(rnd(-.9, .9), .98, rnd(-.35, .35)); g.add(fr);
  }
  return g;
}

// ---------- cristal minable ----------
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

// ---------- fuente animada ----------
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
  // gotas
  const nG = 26, pos = new Float32Array(nG * 3), geo = new THREE.BufferGeometry();
  const semillas = [];
  for (let i = 0; i < nG; i++) semillas.push({ a: rnd(0, 6.28), f: rnd(.5, 1), h: rnd(.6, 1) });
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const gotas = new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xc9f4ff, size: .09, transparent: true, opacity: .9 }));
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

// ---------- edificio ----------
function crearEdificio(ancho, alto, fondo, color) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ map: texVentanas(color), roughness: .85 });
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(ancho, alto, fondo), mat);
  cuerpo.position.y = alto / 2; cuerpo.castShadow = true; cuerpo.receiveShadow = true; g.add(cuerpo);
  // azotea
  const azo = new THREE.Mesh(new THREE.BoxGeometry(ancho * .9, .3, fondo * .9),
    new THREE.MeshStandardMaterial({ color: 0x3a4148, roughness: .9 }));
  azo.position.y = alto + .15; g.add(azo);
  if (Math.random() < .5) {
    const ac = new THREE.Mesh(new THREE.BoxGeometry(.8, .5, .8),
      new THREE.MeshStandardMaterial({ color: 0x9aa5ad, metalness: .3 }));
    ac.position.set(rnd(-1, 1) * ancho * .25, alto + .55, rnd(-1, 1) * fondo * .25);
    ac.castShadow = true; g.add(ac);
  }
  if (Math.random() < .35) {
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 1.6, 6),
      new THREE.MeshStandardMaterial({ color: 0x5b656d }));
    ant.position.set(0, alto + 1.1, 0); g.add(ant);
    const luz = new THREE.Mesh(new THREE.SphereGeometry(.09, 6, 5),
      new THREE.MeshStandardMaterial({ color: 0xfb2c36, emissive: 0xfb2c36, emissiveIntensity: 2 }));
    luz.position.set(0, alto + 1.95, 0); g.add(luz);
  }
  // toldo de entrada
  const toldo = new THREE.Mesh(new THREE.BoxGeometry(ancho * .5, .1, .7),
    new THREE.MeshStandardMaterial({ color: elegir([0x00F299, 0x00d1ff, 0xfb2c36, 0xffd166]) }));
  toldo.position.set(0, 2.3, fondo / 2 + .3); g.add(toldo);
  return g;
}

// ---------- globo ----------
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

// ============================================================
export function crearMundo(escena) {
  const animables = [];
  const PIE = Math.PI;

  // ----- luces (BRILLANTE) -----
  const hemi = new THREE.HemisphereLight(0xcfeaff, 0x7cc952, 1.05);
  escena.add(hemi);
  const sol = new THREE.DirectionalLight(0xfff2d8, 2.2);
  sol.position.set(60, 90, 40);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  sol.shadow.camera.left = -110; sol.shadow.camera.right = 110;
  sol.shadow.camera.top = 110; sol.shadow.camera.bottom = -110;
  sol.shadow.camera.far = 300;
  sol.shadow.bias = -0.0004;
  escena.add(sol);
  const ambiente = new THREE.AmbientLight(0xdfeff8, .5);
  escena.add(ambiente);

  crearCielo(escena);
  escena.fog = new THREE.Fog(0xbfe6f8, 90, 260);

  // ----- suelo -----
  const texG = texCésped(); texG.wrapS = texG.wrapT = THREE.RepeatWrapping; texG.repeat.set(40, 40);
  const suelo = new THREE.Mesh(new THREE.CircleGeometry(240, 48),
    new THREE.MeshStandardMaterial({ map: texG, roughness: 1 }));
  suelo.rotation.x = -PIE / 2; suelo.receiveShadow = true; escena.add(suelo);

  // ----- carreteras (cruz + avenida norte) -----
  const matAsf = new THREE.MeshStandardMaterial({ map: texAsfalto(), roughness: .95 });
  const carretera = (w, l, x, z, rotY = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l), matAsf);
    m.rotation.x = -PIE / 2; m.rotation.z = rotY; m.position.set(x, .02, z);
    m.receiveShadow = true; escena.add(m); return m;
  };
  carretera(9, 220, 0, 0);           // N-S
  carretera(9, 220, 0, 0, PIE / 2);  // E-W
  // aceras
  const matAcera = new THREE.MeshStandardMaterial({ color: 0xcfd6cf, roughness: 1 });
  const acera = (w, l, x, z) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l), matAcera);
    m.rotation.x = -PIE / 2; m.position.set(x, .015, z); m.receiveShadow = true; escena.add(m);
  };
  acera(13, 220, 0, 0); acera(13, 220, 0, 0) /* reusar */;
  acera(220, 13, 0, 0);

  // rotonda alrededor de la plaza
  const rotonda = new THREE.Mesh(new THREE.RingGeometry(15.2, 23.8, 48),
    new THREE.MeshStandardMaterial({ color: 0x4a4e54, roughness: .95 }));
  rotonda.rotation.x = -PIE / 2; rotonda.position.y = .02; rotonda.receiveShadow = true; escena.add(rotonda);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * PIE * 2;
    const marca = new THREE.Mesh(new THREE.PlaneGeometry(.3, 2),
      new THREE.MeshStandardMaterial({ color: 0xf4e04d }));
    marca.rotation.x = -PIE / 2; marca.rotation.z = -a;
    marca.position.set(Math.cos(a) * 19.5, .025, Math.sin(a) * 19.5);
    escena.add(marca);
  }

  // ----- edificios perimetrales -----
  const edifGeoCache = {};
  const edificioEn = (x, z, rotY = 0) => {
    const color = elegir(COLORES_EDIFICIOS);
    const clave = color;
    const a = rnd(6, 10), h = rnd(7, 16), f = rnd(6, 9);
    const e = crearEdificio(a, h, f, color);
    e.position.set(x, 0, z); e.rotation.y = rotY;
    escena.add(e); return e;
  };
  const posEdif = [];
  for (let i = 0; i < 9; i++) { posEdif.push([rnd(-95, -22), -rnd(18, 95)]); posEdif.push([rnd(22, 95), -rnd(18, 95)]); }
  for (let i = 0; i < 7; i++) { posEdif.push([-rnd(18, 95), rnd(22, 95)]); posEdif.push([rnd(18, 95), rnd(22, 95)]); }
  const cercaZona = (x, z) =>
    Math.hypot(x - 60, z) < 20 || Math.hypot(x + 60, z) < 20 ||
    Math.hypot(x, z - 60) < 18 || (z > -76 && z < -46 && x > -24 && x < 60);
  for (const [x, z] of posEdif) {
    if (cercaZona(x, z)) continue;
    let ok = true;
    for (const [px, pz] of posEdif) if (px !== x && Math.hypot(px - x, pz - z) < 11) { ok = false; break; }
    if (ok) edificioEn(x, z, Math.round(rnd(0, 3)) * PIE / 2);
  }

  // ===== PLAZA CENTRAL (0,0) =====
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(15, 40),
    new THREE.MeshStandardMaterial({ color: 0xe8e2d4, roughness: 1 }));
  plaza.rotation.x = -PIE / 2; plaza.position.y = .03; plaza.receiveShadow = true; escena.add(plaza);
  const anillo = new THREE.Mesh(new THREE.RingGeometry(14.2, 15, 40),
    new THREE.MeshStandardMaterial({ color: 0x00F299, roughness: .6 }));
  anillo.rotation.x = -PIE / 2; anillo.position.y = .035; escena.add(anillo);

  const fuente = crearFuente(); escena.add(fuente);
  animables.push((t) => fuente.userData.animar(t));

  // banderas
  const matPoste = new THREE.MeshStandardMaterial({ color: 0x8b939b, metalness: .5 });
  for (const ang of [0.7, 2.3, 3.9, 5.5]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 5, 6), matPoste);
    p.position.set(Math.cos(ang) * 11, 2.5, Math.sin(ang) * 11); p.castShadow = true; escena.add(p);
    const bandera = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .9),
      new THREE.MeshStandardMaterial({ color: elegir([0x00F299, 0x00d1ff, 0xfb2c36, 0xffd166]), side: THREE.DoubleSide }));
    bandera.position.set(Math.cos(ang) * 11 + .82, 4.4, Math.sin(ang) * 11);
    escena.add(bandera);
    animables.push((t) => { bandera.rotation.y = Math.sin(t * 2 + ang) * .35; });
  }
  // globos
  for (let i = 0; i < 7; i++) {
    const gl = crearGlobo(elegir([0x00F299, 0x00d1ff, 0xfb2c36, 0xffd166, 0xff7b6b]));
    const a = rnd(0, 6.28), r = rnd(4, 12);
    gl.position.set(Math.cos(a) * r, rnd(2.4, 4), Math.sin(a) * r);
    escena.add(gl);
    animables.push((t) => { gl.position.y += Math.sin(t * 1.4 + i) * .0025; gl.rotation.z = Math.sin(t + i) * .08; });
  }
  // puestos alrededor de la plaza
  for (const [x, z, c] of [[8, 8, '#fb2c36'], [-8, 8, '#00d1ff'], [8, -8, '#00F299'], [-8, -8, '#ffd166']]) {
    const p = crearPuesto(c); p.position.set(x * 1.8, 0, z * 1.8);
    p.lookAt(0, 0, 0); escena.add(p);
  }

  // ===== MINAS DEL OESTE (-60, 0) =====
  const zonaMina = new THREE.Mesh(new THREE.CircleGeometry(16, 24),
    new THREE.MeshStandardMaterial({ color: 0x9a8f7a, roughness: 1 }));
  zonaMina.rotation.x = -PIE / 2; zonaMina.position.set(-60, .03, 0); zonaMina.receiveShadow = true; escena.add(zonaMina);
  for (let i = 0; i < 10; i++) {
    const roca = new THREE.Mesh(new THREE.IcosahedronGeometry(rnd(.5, 1.2), 0),
      new THREE.MeshStandardMaterial({ color: 0x77705f, roughness: 1, flatShading: true }));
    const a = rnd(0, 6.28), r = rnd(8, 14);
    roca.position.set(-60 + Math.cos(a) * r, .3, Math.sin(a) * r);
    roca.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3));
    roca.castShadow = true; escena.add(roca);
  }
  // vagoneta decorativa
  const vagoneta = new THREE.Group();
  const cub = new THREE.Mesh(new THREE.BoxGeometry(1.4, .7, .9),
    new THREE.MeshStandardMaterial({ color: 0x5b656d, metalness: .4 }));
  cub.position.y = .5; vagoneta.add(cub);
  for (const dx of [-.5, .5]) {
    const rueda = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .1, 10),
      new THREE.MeshStandardMaterial({ color: 0x2c2c2c }));
    rueda.rotation.x = PIE / 2; rueda.position.set(dx, .22, .48); vagoneta.add(rueda);
    const r2 = rueda.clone(); r2.position.z = -.48; vagoneta.add(r2);
  }
  vagoneta.position.set(-52, 0, 7); vagoneta.rotation.y = .6; escena.add(vagoneta);
  // cristales decorativos de fondo (los minables los crea economy.js)
  for (let i = 0; i < 6; i++) {
    const c = crearCristal(Math.random() < .5 ? 0x00d1ff : 0x00F299);
    const a = rnd(0, 6.28), r = rnd(9, 13);
    c.position.set(-60 + Math.cos(a) * r, 0, Math.sin(a) * r);
    c.scale.setScalar(rnd(.8, 1.5)); escena.add(c);
  }

  // ===== MERCADO DEL ESTE (60, 0) =====
  const zonaMerc = new THREE.Mesh(new THREE.CircleGeometry(15, 24),
    new THREE.MeshStandardMaterial({ color: 0xd9c9a8, roughness: 1 }));
  zonaMerc.rotation.x = -PIE / 2; zonaMerc.position.set(60, .03, 0); zonaMerc.receiveShadow = true; escena.add(zonaMerc);
  for (const [x, z, c] of [[55, 8, '#fb2c36'], [65, 8, '#00d1ff'], [55, -8, '#00F299'], [65, -8, '#ffd166']]) {
    const p = crearPuesto(c); p.position.set(x, 0, z); p.lookAt(60, 0, 0); escena.add(p);
  }
  // tablero de contratos
  const tablero = new THREE.Group();
  const panel = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.6, .2),
    new THREE.MeshStandardMaterial({ map: texTablero(), roughness: .8 }));
  panel.position.y = 2.4; panel.castShadow = true; tablero.add(panel);
  for (const dx of [-1.8, 1.8]) {
    const pata = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, 2.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x6b5a3e }));
    pata.position.set(dx, 1.2, 0); tablero.add(pata);
  }
  tablero.position.set(68, 0, 0); tablero.rotation.y = -PIE / 2; escena.add(tablero);

  // ===== PARQUE SUR (0, 60) =====
  const estanque = new THREE.Mesh(new THREE.CircleGeometry(5.5, 28),
    new THREE.MeshStandardMaterial({ color: 0x4fc3e8, roughness: .2, metalness: .1 }));
  estanque.rotation.x = -PIE / 2; estanque.position.set(0, .04, 60); escena.add(estanque);
  const orilla = new THREE.Mesh(new THREE.RingGeometry(5.5, 6.3, 28),
    new THREE.MeshStandardMaterial({ color: 0xd8cfc0 }));
  orilla.rotation.x = -PIE / 2; orilla.position.set(0, .035, 60); escena.add(orilla);
  // patos
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
    pato.position.set(rnd(-3, 3), .06, 60 + rnd(-3, 3));
    escena.add(pato);
    animables.push((t) => { pato.position.x += Math.cos(t * .4 + i) * .004; pato.position.z += Math.sin(t * .3 + i) * .003; });
  }
  // bancos del parque
  const bancosPos = [[-7, 52, .6], [7, 52, -.6], [-7, 68, 2.4], [7, 68, -2.4], [0, 72, PIE], [0, 48, 0]];
  for (const [x, z, r] of bancosPos) {
    const b = crearBanco(); b.position.set(x, 0, z); b.rotation.y = r; escena.add(b);
  }
  // flores
  for (let i = 0; i < 26; i++) {
    const a = rnd(0, 6.28), r = rnd(8, 13);
    const flor = new THREE.Group();
    const tallo = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .3, 4),
      new THREE.MeshStandardMaterial({ color: 0x3fae5a }));
    tallo.position.y = .15; flor.add(tallo);
    const cor = new THREE.Mesh(new THREE.SphereGeometry(.09, 6, 5),
      new THREE.MeshStandardMaterial({ color: elegir([0xff5a4e, 0xffd166, 0xff8fab, 0xa3e635]), roughness: .7 }));
    cor.position.y = .32; flor.add(cor);
    flor.position.set(Math.cos(a) * r, 0, 60 + Math.sin(a) * r);
    escena.add(flor);
  }

  // ===== PARCELAS DEL NORTE (0, -60) =====
  const texV = texValla();
  const parcelas = { jugador: { x: -9, z: -60 }, bots: [] };
  const crearParcela = (x, z, esJugador) => {
    const g = new THREE.Group();
    const tierra = new THREE.Mesh(new THREE.PlaneGeometry(14, 10),
      new THREE.MeshStandardMaterial({ color: esJugador ? 0xc9b287 : 0xb5a582, roughness: 1 }));
    tierra.rotation.x = -PIE / 2; tierra.position.y = .03; tierra.receiveShadow = true; g.add(tierra);
    const matValla = new THREE.MeshStandardMaterial({ map: texV, roughness: .9 });
    for (const [w, l, ox, oz] of [[14, .18, 0, -5], [14, .18, 0, 5], [.18, 10, -7, 0], [.18, 10, 7, 0]]) {
      const v = new THREE.Mesh(new THREE.BoxGeometry(w, .9, l), matValla);
      v.position.set(ox, .45, oz); v.castShadow = true; g.add(v);
    }
    if (esJugador) {
      const letrero = new THREE.Mesh(new THREE.BoxGeometry(3, .9, .12),
        new THREE.MeshStandardMaterial({ color: 0x00F299, emissive: 0x00F299, emissiveIntensity: .25 }));
      letrero.position.set(0, 1.9, -5.4); g.add(letrero);
      const texto = new THREE.Mesh(new THREE.PlaneGeometry(2.8, .7),
        new THREE.MeshStandardMaterial({ map: lienzox(256, 64, (c) => {
          c.fillStyle = '#003b26'; c.font = '900 38px sans-serif'; c.textAlign = 'center';
          c.fillText('TU PARCELA', 128, 44);
        }), roughness: .6 }));
      texto.position.set(0, 1.9, -5.32); g.add(texto);
      for (const dx of [-1.2, 1.2]) {
        const pata = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.9, 6),
          new THREE.MeshStandardMaterial({ color: 0x8b939b }));
        pata.position.set(dx, .95, -5.4); g.add(pata);
      }
    }
    g.position.set(x, 0, z); escena.add(g);
    return g;
  };
  crearParcela(parcelas.jugador.x, parcelas.jugador.z, true);
  for (let i = 0; i < 3; i++) {
    const px = 9 + i * 17;
    crearParcela(px, -60, false);
    parcelas.bots.push({ x: px, z: -60 });
    // casa a medio construir del vecino
    const base = new THREE.Mesh(new THREE.BoxGeometry(4, rnd(1.5, 2.6), 3.4),
      new THREE.MeshStandardMaterial({ color: elegir(COLORES_EDIFICIOS), roughness: .9 }));
    base.position.set(px, base.geometry.parameters.height / 2, -60);
    base.castShadow = true; escena.add(base);
    const esc = new THREE.Mesh(new THREE.ConeGeometry(.4, .8, 4),
      new THREE.MeshStandardMaterial({ color: 0xff9f43 }));
    esc.position.set(px + 2.4, .4, -57); esc.rotation.z = .7; escena.add(esc);
  }

  // ===== ÁRBOLES Y FAROLAS por la ciudad =====
  const arbolPos = [];
  for (let i = 0; i < 34; i++) {
    const a = rnd(0, 6.28), r = rnd(16, 100);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.abs(x) < 9 || Math.abs(z) < 9) continue;
    if (Math.hypot(x - 60, z) < 18 || Math.hypot(x + 60, z) < 18 || Math.hypot(x, z - 60) < 14 || Math.hypot(x, z + 60) < 16) continue;
    if (z > -76 && z < -46 && x > -24 && x < 60) continue;
    let ok = true;
    for (const [ox, oz] of arbolPos) if (Math.hypot(ox - x, oz - z) < 5) { ok = false; break; }
    if (!ok) continue;
    arbolPos.push([x, z]);
    const ar = crearArbol(rnd(.8, 1.5)); ar.position.set(x, 0, z); escena.add(ar);
  }
  for (const [x, z] of [[-7.5, 12], [7.5, 12], [-7.5, -12], [7.5, -12], [-12, 7.5], [-12, -7.5], [12, 7.5], [12, -7.5],
    [-7.5, 40], [7.5, 40], [-7.5, -40], [7.5, -40], [-40, 7.5], [40, 7.5], [-40, -7.5], [40, -7.5]]) {
    const f = crearFarola(); f.position.set(x, 0, z); f.rotation.y = Math.atan2(-x, -z); escena.add(f);
  }

  // ===== CARTEL ALICE CITY =====
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
  tab.position.y = 7; cartel.add(tab);
  for (const dx of [-4, 4]) {
    const pata = new THREE.Mesh(new THREE.CylinderGeometry(.18, .22, 7, 8),
      new THREE.MeshStandardMaterial({ color: 0x37414a, metalness: .4 }));
    pata.position.set(dx, 3.5, 0); cartel.add(pata);
  }
  cartel.position.set(0, 0, -26); cartel.rotation.y = PIE; escena.add(cartel);

  // ===== NUBES =====
  const nubes = [];
  for (let i = 0; i < 9; i++) {
    const n = crearNube();
    n.position.set(rnd(-140, 140), rnd(38, 62), rnd(-140, 140));
    escena.add(n); nubes.push(n);
    animables.push((t) => {
      n.position.x += .028;
      if (n.position.x > 160) n.position.x = -160;
    });
  }

  // mariposas (puntos de color en el parque)
  const nM = 14, mPos = new Float32Array(nM * 3), mGeo = new THREE.BufferGeometry();
  const mSem = [];
  for (let i = 0; i < nM; i++) mSem.push({ a: rnd(0, 6.28), r: rnd(6, 13), f: rnd(.4, 1), o: rnd(0, 6) });
  mGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
  const mariposas = new THREE.Points(mGeo, new THREE.PointsMaterial({
    color: 0xffd166, size: .14, transparent: true, opacity: .95 }));
  escena.add(mariposas);
  animables.push((t) => {
    for (let i = 0; i < nM; i++) {
      const s = mSem[i];
      mPos[i * 3] = Math.cos(s.a + t * s.f * .3) * s.r;
      mPos[i * 3 + 1] = .8 + Math.sin(t * s.f + s.o) * .45;
      mPos[i * 3 + 2] = 60 + Math.sin(s.a + t * s.f * .25) * s.r;
    }
    mGeo.attributes.position.needsUpdate = true;
  });

  const zonas = {
    plaza: new THREE.Vector3(0, 0, 14),
    mina: new THREE.Vector3(-60, 0, 0),
    mercado: new THREE.Vector3(60, 0, 0),
    parque: new THREE.Vector3(0, 0, 60),
    parcela: new THREE.Vector3(parcelas.jugador.x, 0, -52),
    tablero: new THREE.Vector3(66, 0, 0),
  };
  return { animables, zonas, parcelas, bancosPos };
}
