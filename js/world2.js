// ============ ALICE CITY v5 — Distritos de esquina y paisajes ============
// Downtown (114,-114) NE · Lago del Sol (-114,114) SO · Bosque de Pinos (-114,-114) NO
// Todos dentro de su manzana de esquina: las avenidas de la cuadrícula quedan libres.
import * as THREE from 'three';
import { crearArbol, crearBanco, crearFarola } from './world.js';
import { col } from './colisiones.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const elegir = (arr) => arr[(Math.random() * arr.length) | 0];
const PIE = Math.PI;

function lienzox(w, h, fn) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  fn(c.getContext('2d'));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function texTorre(base, vidrio) {
  return lienzox(128, 512, (g) => {
    g.fillStyle = base; g.fillRect(0, 0, 128, 512);
    for (let y = 6; y < 506; y += 22) {
      for (let x = 6; x < 122; x += 24) {
        const on = Math.random() < .22;
        g.fillStyle = on ? (Math.random() < .5 ? '#fff3b0' : '#c9f7ff') : vidrio;
        g.fillRect(x, y, 18, 14);
        g.fillStyle = 'rgba(255,255,255,.30)';
        g.fillRect(x, y, 18, 3);
      }
    }
  });
}
function texVallaAnuncio(lineas, acento = '#00F299') {
  return lienzox(512, 192, (g) => {
    g.fillStyle = '#0a1418'; g.fillRect(0, 0, 512, 192);
    g.strokeStyle = acento; g.lineWidth = 8; g.strokeRect(6, 6, 500, 180);
    g.textAlign = 'center';
    g.fillStyle = '#ffffff'; g.font = '900 58px sans-serif';
    g.fillText(lineas[0], 256, 86);
    g.fillStyle = acento; g.font = '800 34px sans-serif';
    g.fillText(lineas[1] || '', 256, 140);
  });
}
function texArena() {
  return lienzox(256, 256, (g) => {
    g.fillStyle = '#f2e2b8'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 700; i++) {
      g.fillStyle = Math.random() < .5 ? 'rgba(222,196,138,.5)' : 'rgba(255,244,214,.6)';
      g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
  });
}
function texCorteza() {
  return lienzox(64, 128, (g) => {
    g.fillStyle = '#6e4a2e'; g.fillRect(0, 0, 64, 128);
    for (let i = 0; i < 22; i++) {
      g.fillStyle = 'rgba(50,32,18,.5)';
      g.fillRect(Math.random() * 60, Math.random() * 124, 3, 14);
    }
  });
}

// ---------- piezas ----------
function rascacielos(alto, base, colorA, colorB) {
  const g = new THREE.Group();
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(base, alto, base),
    new THREE.MeshStandardMaterial({ map: texTorre(colorA, colorB), roughness: .35, metalness: .25 }));
  cuerpo.position.y = alto / 2; cuerpo.castShadow = true; g.add(cuerpo);
  const azotea = new THREE.Mesh(new THREE.BoxGeometry(base * .55, 1.2, base * .55),
    new THREE.MeshStandardMaterial({ color: 0x37414a, roughness: .7 }));
  azotea.position.y = alto + .6; g.add(azotea);
  const antena = new THREE.Mesh(new THREE.CylinderGeometry(.08, .12, 3.4, 6),
    new THREE.MeshStandardMaterial({ color: 0xb9c4cc, metalness: .6 }));
  antena.position.y = alto + 2.6; g.add(antena);
  const baliza = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0xfb2c36, emissive: 0xfb2c36, emissiveIntensity: 1.4 }));
  baliza.position.y = alto + 4.3; g.add(baliza);
  return g;
}
function vallaAnuncio(texto, acento) {
  const g = new THREE.Group();
  const panel = new THREE.Mesh(new THREE.BoxGeometry(7, 2.6, .25),
    new THREE.MeshStandardMaterial({ map: texVallaAnuncio(texto, acento), roughness: .6, emissive: 0x111111 }));
  panel.position.y = 4.4; panel.castShadow = true; g.add(panel);
  for (const dx of [-2.6, 2.6]) {
    const pata = new THREE.Mesh(new THREE.CylinderGeometry(.12, .14, 3.2, 6),
      new THREE.MeshStandardMaterial({ color: 0x37414a, metalness: .4 }));
    pata.position.set(dx, 1.6, 0); g.add(pata);
  }
  return g;
}
function pino(escala = 1) {
  const g = new THREE.Group();
  const tronco = new THREE.Mesh(new THREE.CylinderGeometry(.12, .16, 1, 6),
    new THREE.MeshStandardMaterial({ map: texCorteza(), roughness: 1 }));
  tronco.position.y = .5; tronco.castShadow = true; g.add(tronco);
  const verde = [0x2e8b57, 0x3fae5a, 0x27795a, 0x4caf6e];
  for (let i = 0; i < 3; i++) {
    const copa = new THREE.Mesh(new THREE.ConeGeometry(1.05 - i * .26, 1.1, 7),
      new THREE.MeshStandardMaterial({ color: elegir(verde), roughness: .9, flatShading: true }));
    copa.position.y = 1.25 + i * .62; copa.castShadow = true; g.add(copa);
  }
  g.scale.setScalar(escala);
  return g;
}
function palmera() {
  const g = new THREE.Group();
  const curva = new THREE.Mesh(new THREE.CylinderGeometry(.10, .17, 3.4, 6),
    new THREE.MeshStandardMaterial({ color: 0x9a6a3e, roughness: .95 }));
  curva.position.y = 1.7; curva.rotation.z = .08; curva.castShadow = true; g.add(curva);
  for (let i = 0; i < 6; i++) {
    const hoja = new THREE.Mesh(new THREE.BoxGeometry(2.1, .05, .42),
      new THREE.MeshStandardMaterial({ color: 0x3fae5a, roughness: .85 }));
    const a = (i / 6) * PIE * 2;
    hoja.position.set(Math.cos(a) * .9 + .13, 3.45, Math.sin(a) * .9);
    hoja.rotation.y = -a; hoja.rotation.z = -.32;
    hoja.castShadow = true; g.add(hoja);
  }
  for (const dx of [.1, .2]) {
    const coco = new THREE.Mesh(new THREE.SphereGeometry(.12, 6, 5),
      new THREE.MeshStandardMaterial({ color: 0x6e4a2e }));
    coco.position.set(dx, 3.3, .1); g.add(coco);
  }
  return g;
}
function velero() {
  const g = new THREE.Group();
  const casco = new THREE.Mesh(new THREE.BoxGeometry(.9, .4, 2.6),
    new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: .5 }));
  casco.position.y = .2; g.add(casco);
  const mastil = new THREE.Mesh(new THREE.CylinderGeometry(.04, .05, 3, 6),
    new THREE.MeshStandardMaterial({ color: 0x8a5a2e }));
  mastil.position.y = 1.9; g.add(mastil);
  const vela = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.9),
    new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: .8 }));
  vela.position.set(0, 2, .1); g.add(vela);
  const franja = new THREE.Mesh(new THREE.PlaneGeometry(1.12, .4),
    new THREE.MeshStandardMaterial({ color: 0x00d1ff, side: THREE.DoubleSide }));
  franja.position.set(0, 1.5, .11); g.add(franja);
  return g;
}

// ============================================================
export function crearDistritos(escena, animables, mundo = null) {
  const bancos = mundo && mundo.bancosPos ? mundo.bancosPos : [];

  // ============================================================
  // DOWNTOWN (114, -114) — rascacielos en anillo, Torre Alice, neones
  // ============================================================
  const dtX = 114, dtZ = -114;
  const plazaDT = new THREE.Mesh(new THREE.CircleGeometry(17, 36),
    new THREE.MeshStandardMaterial({ color: 0xd7dbe2, roughness: 1 }));
  plazaDT.rotation.x = -PIE / 2; plazaDT.position.set(dtX, .03, dtZ);
  plazaDT.receiveShadow = true; escena.add(plazaDT);
  const anilloDT = new THREE.Mesh(new THREE.RingGeometry(16.2, 17, 36),
    new THREE.MeshStandardMaterial({ color: 0x00d1ff, roughness: .5 }));
  anilloDT.rotation.x = -PIE / 2; anilloDT.position.set(dtX, .035, dtZ); escena.add(anilloDT);

  // TORRE ALICE
  const torre = rascacielos(44, 9, '#22303a', '#7fd8f7');
  torre.position.set(dtX, 0, dtZ); escena.add(torre);
  col.registrar(dtX, dtZ, 9.4, 9.4);
  const rotuloTex = lienzox(96, 384, (g) => {
    g.fillStyle = '#10181f'; g.fillRect(0, 0, 96, 384);
    g.fillStyle = '#00F299'; g.font = '900 64px sans-serif'; g.textAlign = 'center';
    for (const [i, ch] of 'ALICE'.split('').entries()) g.fillText(ch, 48, 74 + i * 66);
  });
  const rotulo = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 10.4),
    new THREE.MeshStandardMaterial({ map: rotuloTex, emissive: 0xffffff, emissiveMap: rotuloTex, emissiveIntensity: .85, roughness: .6 }));
  rotulo.position.set(dtX, 34, dtZ + 4.6); escena.add(rotulo);
  animables.push((t) => { rotulo.material.emissiveIntensity = .65 + Math.sin(t * 2.2) * .3; });

  // 8 rascacielos en anillo ordenado
  const paresColores = [['#5b7c99', '#bfe8f5'], ['#4a6d8c', '#a5dcf0'], ['#6b8899', '#cfeef8'], ['#557186', '#b2e4f2']];
  let k = 0;
  for (const [ox, oz] of [[12.47, 5.17], [5.17, 12.47], [-5.17, 12.47], [-12.47, 5.17], [-12.47, -5.17], [-5.17, -12.47], [5.17, -12.47], [12.47, -5.17]]) {
    const [ca, cb] = paresColores[k % paresColores.length];
    const t = rascacielos(20 + (k % 4) * 4.5, 8, ca, cb);
    t.position.set(dtX + ox, 0, dtZ + oz); escena.add(t);
    col.registrar(dtX + ox, dtZ + oz, 8.4, 8.4);
    k++;
  }
  // vallas de neón en las esquinas de la manzana, mirando a las avenidas
  const v1 = vallaAnuncio(['ALICOINS', 'trabaja y gana'], '#00F299');
  v1.position.set(86, 0, -86); v1.rotation.y = -PIE / 4; escena.add(v1);
  col.registrar(86, -86, 5, 5);
  const v2 = vallaAnuncio(['ALICE LABS', 'agents at work'], '#00d1ff');
  v2.position.set(142, 0, -100); v2.rotation.y = -PIE / 2; escena.add(v2);
  col.registrar(142, -100, 1.4, 7);
  const v3 = vallaAnuncio(['x402 SOON', 'pago por llamada'], '#ffd166');
  v3.position.set(100, 0, -142); v3.rotation.y = PIE; escena.add(v3);
  col.registrar(100, -142, 7, 1.4);
  // bancos, maceteros y pinos del downtown
  for (const [ox, oz] of [[-10, -4, ], [-10, 4], [10, -4], [10, 4]]) {
    const x = dtX + ox, z = dtZ + oz;
    const rot = Math.atan2(-ox, -oz);
    const b = crearBanco(); b.position.set(x, 0, z); b.rotation.y = rot; escena.add(b);
    bancos.push({ x, z, rot });
    col.banco(x, z, rot);
  }
  for (const [ox, oz] of [[-16, 0], [16, 0], [0, 16], [0, -16]]) {
    const x = dtX + ox * 1.05, z = dtZ + oz * 1.05;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(.55, .62, .6, 8),
      new THREE.MeshStandardMaterial({ color: 0xb0654a, roughness: .9 }));
    m.position.set(x, .3, z); m.castShadow = true; escena.add(m);
    const arb = new THREE.Mesh(new THREE.IcosahedronGeometry(.45, 0),
      new THREE.MeshStandardMaterial({ color: 0x3fae5a, roughness: .95, flatShading: true }));
    arb.position.set(x, .85, z); escena.add(arb);
    col.registrar(x, z, 1.2, 1.2);
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * PIE * 2 + .5;
    const x = dtX + Math.cos(a) * 20.5, z = dtZ + Math.sin(a) * 20.5;
    const ar = pino(rnd(.7, .95)); ar.position.set(x, 0, z); escena.add(ar);
    col.registrar(x, z, .8, .8);
  }
  // caminos pintados hacia las avenidas (oeste y norte)
  const matCaminoDT = new THREE.MeshStandardMaterial({ color: 0xc2c8cf, roughness: 1 });
  const c1 = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 22), matCaminoDT);
  c1.rotation.x = -PIE / 2; c1.position.set(dtX - 20, .028, dtZ); escena.add(c1);
  const c2 = new THREE.Mesh(new THREE.PlaneGeometry(22, 2.2), matCaminoDT);
  c2.rotation.x = -PIE / 2; c2.position.set(dtX, .028, dtZ + 20); escena.add(c2);

  // ============================================================
  // LAGO DEL SOL (-114, 114) — agua, playa, muelle, veleros
  // ============================================================
  const lgX = -114, lgZ = 114;
  const arenaTex = texArena();
  arenaTex.wrapS = arenaTex.wrapT = THREE.RepeatWrapping; arenaTex.repeat.set(10, 10);
  const playa = new THREE.Mesh(new THREE.CircleGeometry(34, 40),
    new THREE.MeshStandardMaterial({ map: arenaTex, roughness: 1 }));
  playa.rotation.x = -PIE / 2; playa.position.set(lgX, .025, lgZ);
  playa.receiveShadow = true; escena.add(playa);

  const aguaGeo = new THREE.CircleGeometry(24, 44);
  const agua = new THREE.Mesh(aguaGeo,
    new THREE.MeshStandardMaterial({ color: 0x2fa8d5, roughness: .15, metalness: .25, transparent: true, opacity: .88 }));
  agua.rotation.x = -PIE / 2; agua.position.set(lgX, .09, lgZ); escena.add(agua);
  col.circulo(lgX, lgZ, 24.2);
  const posAgua = aguaGeo.attributes.position;
  animables.push((t) => {
    agua.position.y = .09 + Math.sin(t * 1.2) * .04;
    agua.material.opacity = .84 + Math.sin(t * .9) * .05;
    for (let i = 0; i < posAgua.count; i += 4) {
      const x = posAgua.getX(i), y = posAgua.getY(i);
      posAgua.setZ(i, Math.sin(x * .5 + t * 1.6) * .12 + Math.cos(y * .6 + t * 1.2) * .10);
    }
    posAgua.needsUpdate = true;
  });
  const orillaL = new THREE.Mesh(new THREE.RingGeometry(24, 25.4, 44),
    new THREE.MeshStandardMaterial({ color: 0xeadfc2, roughness: 1 }));
  orillaL.rotation.x = -PIE / 2; orillaL.position.set(lgX, .07, lgZ); escena.add(orillaL);

  // muelle transitable (plataforma con altura) hacia el oeste
  const muelle = new THREE.Group();
  const matMadera = new THREE.MeshStandardMaterial({ color: 0x9a6a3e, roughness: .9 });
  const tableroM = new THREE.Mesh(new THREE.BoxGeometry(16, .18, 2.4), matMadera);
  tableroM.position.y = .55; tableroM.castShadow = true; muelle.add(tableroM);
  for (const dx of [-7.4, -2.5, 2.5, 7.4]) {
    for (const dz of [-1, 1]) {
      const pilar = new THREE.Mesh(new THREE.CylinderGeometry(.09, .11, 1.1, 6), matMadera);
      pilar.position.set(dx, .1, dz); muelle.add(pilar);
    }
  }
  for (const dz of [-1.2, 1.2]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(16, .1, .08), matMadera);
    rail.position.set(0, .95, dz); muelle.add(rail);
    for (const dx of [-7.4, -2.5, 2.5, 7.4]) {
      const bal = new THREE.Mesh(new THREE.BoxGeometry(.08, .4, .08), matMadera);
      bal.position.set(dx, .78, dz); muelle.add(bal);
    }
  }
  muelle.position.set(-96, 0, 114); escena.add(muelle);
  col.plataforma(-96, 114, 16, 2.4, .64);
  // barca amarrada
  const barca = new THREE.Group();
  const cascoB = new THREE.Mesh(new THREE.BoxGeometry(2.4, .5, 1.1),
    new THREE.MeshStandardMaterial({ color: 0xc96f4a, roughness: .7 }));
  cascoB.position.y = .25; barca.add(cascoB);
  const asientoB = new THREE.Mesh(new THREE.BoxGeometry(2, .08, .8),
    new THREE.MeshStandardMaterial({ color: 0x8a5a2e }));
  asientoB.position.y = .42; barca.add(asientoB);
  barca.position.set(-89.5, .12, 110.5); barca.rotation.y = .5; escena.add(barca);

  // veleros navegando
  for (const [r, vel, fase] of [[12, .3, 0], [15, -.24, 2]]) {
    const v = velero();
    escena.add(v);
    animables.push((t) => {
      const a = t * vel + fase;
      v.position.set(lgX + Math.cos(a) * r, .3, lgZ + Math.sin(a) * r);
      v.rotation.y = -a + PIE / 2;
      v.rotation.z = Math.sin(t * 1.4 + fase) * .05;
    });
  }
  // boyas
  for (const [ox, oz] of [[-20, 8], [16, -14], [4, 19], [-12, -18]]) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(.3, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xfb2c36, roughness: .5 }));
    b.position.set(lgX + ox, .15, lgZ + oz); escena.add(b);
    animables.push((t) => { b.position.y = .15 + Math.sin(t * 1.5 + ox) * .06; });
  }
  // palmeras y bancos de la orilla
  for (const a of [.5, 1.1, 1.8, 2.5, 3.2, 3.9, 4.6, 5.5]) {
    const r = rnd(28, 31.5);
    const x = lgX + Math.cos(a) * r, z = lgZ + Math.sin(a) * r;
    const p = palmera(); p.position.set(x, 0, z); p.rotation.y = rnd(0, 6.28); escena.add(p);
    col.registrar(x, z, .8, .8);
  }
  for (const a of [-2.2, -0.9, .6, 2.4]) {
    const x = lgX + Math.cos(a) * 27.5, z = lgZ + Math.sin(a) * 27.5;
    const rot = Math.atan2(lgX - x, lgZ - z);
    const b = crearBanco(); b.position.set(x, 0, z); b.rotation.y = rot; escena.add(b);
    bancos.push({ x, z, rot });
    col.banco(x, z, rot);
  }
  // sombrillas y toallas
  for (const [x, z] of [[-88, 128], [-92, 96], [-138, 100], [-134, 138]]) {
    const s = new THREE.Group();
    const palo = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 2.2, 6), matMadera);
    palo.position.y = 1.1; s.add(palo);
    const copa = new THREE.Mesh(new THREE.ConeGeometry(1.3, .5, 8),
      new THREE.MeshStandardMaterial({ color: elegir([0xfb2c36, 0x00d1ff, 0xffd166]), roughness: .7 }));
    copa.position.y = 2.2; copa.castShadow = true; s.add(copa);
    s.position.set(x, 0, z); escena.add(s);
    col.registrar(x, z, .5, .5);
    const toalla = new THREE.Mesh(new THREE.PlaneGeometry(1.4, .8),
      new THREE.MeshStandardMaterial({ color: elegir([0x00F299, 0xff8fab, 0xa3e635]), roughness: 1 }));
    toalla.rotation.x = -PIE / 2; toalla.position.set(x + 1.2, .06, z); escena.add(toalla);
  }
  // patos del lago
  for (let i = 0; i < 3; i++) {
    const pato = new THREE.Group();
    const cue = new THREE.Mesh(new THREE.SphereGeometry(.14, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xfff3c9 }));
    cue.scale.set(1.2, .8, 1.4); pato.add(cue);
    const cab = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), cue.material);
    cab.position.set(0, .12, .12); pato.add(cab);
    pato.position.set(lgX + rnd(-8, 8), .12, lgZ + rnd(-8, 8));
    escena.add(pato);
    animables.push((t) => { pato.position.x += Math.cos(t * .5 + i * 2) * .006; pato.position.z += Math.sin(t * .35 + i) * .004; });
  }
  // caminos de tablas hacia las avenidas (este y norte)
  const matCaminoLG = new THREE.MeshStandardMaterial({ color: 0xc9b287, roughness: 1 });
  const c3 = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 20), matCaminoLG);
  c3.rotation.x = -PIE / 2; c3.position.set(lgX + 24, .028, lgZ); escena.add(c3);
  const c4 = new THREE.Mesh(new THREE.PlaneGeometry(20, 2.2), matCaminoLG);
  c4.rotation.x = -PIE / 2; c4.position.set(lgX, .028, lgZ - 24); escena.add(c4);

  // ============================================================
  // BOSQUE DE PINOS (-114, -114) — sendero, cabaña, luciérnagas
  // ============================================================
  const bsX = -114, bsZ = -114;
  const claraboya = new THREE.Mesh(new THREE.CircleGeometry(9, 24),
    new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 1 }));
  claraboya.rotation.x = -PIE / 2; claraboya.position.set(bsX, .03, bsZ);
  claraboya.receiveShadow = true; escena.add(claraboya);
  const senderoB = new THREE.Mesh(new THREE.RingGeometry(10.2, 11.8, 32),
    new THREE.MeshStandardMaterial({ color: 0xa89468, roughness: 1 }));
  senderoB.rotation.x = -PIE / 2; senderoB.position.set(bsX, .038, bsZ); escena.add(senderoB);
  // cabaña del leñador
  const cabana = new THREE.Group();
  const matTronco = new THREE.MeshStandardMaterial({ color: 0x6e4a2e, roughness: 1 });
  const cuerpoC = new THREE.Mesh(new THREE.BoxGeometry(5, 2.6, 4), matTronco);
  cuerpoC.position.y = 1.3; cuerpoC.castShadow = true; cabana.add(cuerpoC);
  const techoC = new THREE.Mesh(new THREE.ConeGeometry(4.1, 1.9, 4),
    new THREE.MeshStandardMaterial({ color: 0x503622, roughness: 1, flatShading: true }));
  techoC.position.y = 3.5; techoC.rotation.y = PIE / 4; cabana.add(techoC);
  const puertaC = new THREE.Mesh(new THREE.BoxGeometry(.9, 1.7, .1),
    new THREE.MeshStandardMaterial({ color: 0x3a2818 }));
  puertaC.position.set(0, .85, 2.05); cabana.add(puertaC);
  const ventanaC = new THREE.Mesh(new THREE.PlaneGeometry(.8, .7),
    new THREE.MeshStandardMaterial({ color: 0xffd98a, emissive: 0xffb84d, emissiveIntensity: .9 }));
  ventanaC.position.set(1.7, 1.4, 2.03); cabana.add(ventanaC);
  const chimenea = new THREE.Mesh(new THREE.BoxGeometry(.6, 1.6, .6),
    new THREE.MeshStandardMaterial({ color: 0x77705f, roughness: 1 }));
  chimenea.position.set(-1.6, 3.6, -1); cabana.add(chimenea);
  // leña apilada
  for (let i = 0; i < 6; i++) {
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .9, 6), matTronco);
    tr.rotation.z = PIE / 2;
    tr.position.set(3.1, .13 + (i % 2) * .22, -1 + Math.floor(i / 2) * .3);
    cabana.add(tr);
  }
  const letreroB = new THREE.Mesh(new THREE.PlaneGeometry(2.6, .7),
    new THREE.MeshStandardMaterial({ map: lienzox(256, 64, (g) => {
      g.fillStyle = '#274d35'; g.fillRect(0, 0, 256, 64);
      g.fillStyle = '#e8f5e9'; g.font = '900 30px sans-serif'; g.textAlign = 'center';
      g.fillText('BOSQUE DE PINOS', 128, 42);
    }), roughness: .7 }));
  letreroB.position.set(0, 2.2, 2.1); cabana.add(letreroB);
  cabana.position.set(bsX - 14, 0, bsZ + 10); cabana.rotation.y = -.5;
  escena.add(cabana);
  col.registrar(bsX - 14, bsZ + 10, 5.6, 5);
  // pinos del bosque (fuera de la claraboya, del sendero y de la cabaña)
  const pinosPos = [];
  for (let i = 0; i < 30; i++) {
    const a = rnd(0, 6.28), r = rnd(13, 29);
    const x = bsX + Math.cos(a) * r, z = bsZ + Math.sin(a) * r;
    if (Math.hypot(x - (bsX - 14), z - (bsZ + 10)) < 6.5) continue;  // cabaña
    if (r > 10.5 && r < 14.5) continue;                              // sendero libre
    if (z > bsZ - 1 && z < bsZ + 3.5 && x > bsX) continue;           // camino este
    if (x > bsX - 1 && x < bsX + 3.5 && z > bsZ) continue;           // camino norte
    let ok = true;
    for (const [ox, oz] of pinosPos) if (Math.hypot(ox - x, oz - z) < 3.4) { ok = false; break; }
    if (!ok) continue;
    pinosPos.push([x, z]);
    const p = pino(rnd(.9, 1.7)); p.position.set(x, 0, z); p.rotation.y = rnd(0, 6.28);
    escena.add(p);
    col.registrar(x, z, .8, .8);
  }
  // setas y rocas
  for (let i = 0; i < 10; i++) {
    const a = rnd(0, 6.28), r = rnd(6, 24);
    const seta = new THREE.Group();
    const tallo = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, .22, 6),
      new THREE.MeshStandardMaterial({ color: 0xf5f0e6 }));
    tallo.position.y = .11; seta.add(tallo);
    const somb = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xfb2c36, roughness: .7 }));
    somb.position.y = .22; seta.add(somb);
    seta.position.set(bsX + Math.cos(a) * r, 0, bsZ + Math.sin(a) * r);
    escena.add(seta);
  }
  for (let i = 0; i < 7; i++) {
    const roca = new THREE.Mesh(new THREE.IcosahedronGeometry(rnd(.4, .9), 0),
      new THREE.MeshStandardMaterial({ color: 0x77705f, roughness: 1, flatShading: true }));
    const a = rnd(0, 6.28), r = rnd(12, 26);
    roca.position.set(bsX + Math.cos(a) * r, .25, bsZ + Math.sin(a) * r);
    roca.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3));
    roca.castShadow = true; escena.add(roca);
  }
  // bancos de la claraboya
  for (const a of [1, 4.2]) {
    const x = bsX + Math.cos(a) * 12.6, z = bsZ + Math.sin(a) * 12.6;
    const rot = Math.atan2(bsX - x, bsZ - z);
    const b = crearBanco(); b.position.set(x, 0, z); b.rotation.y = rot; escena.add(b);
    bancos.push({ x, z, rot });
    col.banco(x, z, rot);
  }
  // caminos hacia las avenidas (este y norte)
  const matCaminoB = new THREE.MeshStandardMaterial({ color: 0xa89468, roughness: 1 });
  const c5 = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 20), matCaminoB);
  c5.rotation.x = -PIE / 2; c5.position.set(bsX + 24, .028, bsZ); escena.add(c5);
  const c6 = new THREE.Mesh(new THREE.PlaneGeometry(20, 2.2), matCaminoB);
  c6.rotation.x = -PIE / 2; c6.position.set(bsX, .028, bsZ + 24); escena.add(c6);
  // luciérnagas
  const nL = 26, lPos = new Float32Array(nL * 3), lGeo = new THREE.BufferGeometry();
  const lSem = [];
  for (let i = 0; i < nL; i++) lSem.push({ a: rnd(0, 6.28), r: rnd(6, 20), f: rnd(.3, .9), o: rnd(0, 6) });
  lGeo.setAttribute('position', new THREE.BufferAttribute(lPos, 3));
  const luciernagas = new THREE.Points(lGeo, new THREE.PointsMaterial({ color: 0xfff3b0, size: .18, transparent: true, opacity: .9 }));
  escena.add(luciernagas);
  animables.push((t) => {
    luciernagas.material.opacity = .55 + Math.sin(t * 2.4) * .35;
    for (let i = 0; i < nL; i++) {
      const s = lSem[i];
      lPos[i * 3] = bsX + Math.cos(s.a + t * s.f * .25) * s.r;
      lPos[i * 3 + 1] = .7 + Math.sin(t * s.f + s.o) * .5;
      lPos[i * 3 + 2] = bsZ + Math.sin(s.a + t * s.f * .3) * s.r;
    }
    lGeo.attributes.position.needsUpdate = true;
  });

  // ============================================================
  // MONTAÑAS NEVADAS + colinas (paisaje de fondo)
  // ============================================================
  const picos = 14;
  for (let i = 0; i < picos; i++) {
    const a = (i / picos) * PIE * 2 + rnd(-.1, .1);
    const dist = rnd(185, 235);
    const alto = rnd(38, 74);
    const m = new THREE.Mesh(new THREE.ConeGeometry(rnd(28, 46), alto, 6),
      new THREE.MeshStandardMaterial({ color: elegir([0x7d94a6, 0x6c8296, 0x8ba0b0]), roughness: 1, flatShading: true }));
    m.position.set(Math.cos(a) * dist, alto / 2 - 2, Math.sin(a) * dist);
    m.rotation.y = rnd(0, 6.28);
    escena.add(m);
    const nieve = new THREE.Mesh(new THREE.ConeGeometry(rnd(8, 13), alto * .28, 6),
      new THREE.MeshStandardMaterial({ color: 0xf4f9ff, roughness: .8, flatShading: true }));
    nieve.position.set(m.position.x, alto - alto * .14 - 2, m.position.z);
    nieve.rotation.y = m.rotation.y;
    escena.add(nieve);
  }
  for (let i = 0; i < 8; i++) {
    const a = rnd(0, 6.28), dist = rnd(135, 165);
    const h = new THREE.Mesh(new THREE.SphereGeometry(rnd(14, 24), 10, 8),
      new THREE.MeshStandardMaterial({ color: 0x6fbf5a, roughness: 1, flatShading: true }));
    h.position.set(Math.cos(a) * dist, -rnd(6, 10), Math.sin(a) * dist);
    h.scale.y = .55; escena.add(h);
  }

  const zonas = {
    downtown: new THREE.Vector3(dtX, 0, dtZ),
    torre: new THREE.Vector3(dtX, 0, dtZ + 8),
    lago: new THREE.Vector3(lgX, 0, lgZ),
    muelle: new THREE.Vector3(-96, 0, 114),
    bosque: new THREE.Vector3(bsX, 0, bsZ),
  };
  return { zonas };
}
