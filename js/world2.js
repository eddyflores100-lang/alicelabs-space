// ============ ALICE CITY v4 — Distritos nuevos y paisajes ============
// Downtown de rascacielos (NE), Lago con muelle (SO), Bosque de pinos (NO),
// montañas nevadas de fondo, Torre Alice y carreteras del anillo.
import * as THREE from 'three';
import { crearArbol, crearBanco, crearFarola } from './world.js';

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

// ---------- texturas nuevas ----------
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
function texVallaAnuncio(lineas, fondo = '#0a1418', acento = '#00F299') {
  return lienzox(512, 192, (g) => {
    g.fillStyle = fondo; g.fillRect(0, 0, 512, 192);
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
    new THREE.MeshStandardMaterial({ map: texVallaAnuncio(texto, '#0a1418', acento), roughness: .6, emissive: 0x111111 }));
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
export function crearDistritos(escena, animables) {

  // ----- carreteras del anillo + aceras -----
  const texA = lienzox(128, 512, (g) => {
    g.fillStyle = '#3d4147'; g.fillRect(0, 0, 128, 512);
    g.fillStyle = '#f4e04d';
    for (let y = 10; y < 500; y += 52) g.fillRect(62, y, 5, 30);
  });
  texA.wrapS = texA.wrapT = THREE.RepeatWrapping; texA.repeat.set(1, 12);
  const matAsf = new THREE.MeshStandardMaterial({ map: texA, roughness: .95 });
  const carretera = (w, l, x, z, rotY = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l), matAsf);
    m.rotation.x = -PIE / 2; m.rotation.z = rotY; m.position.set(x, .02, z);
    m.receiveShadow = true; escena.add(m);
  };
  carretera(9, 220, 75, 0);          // N-S este (hasta downtown)
  carretera(9, 220, -75, 0);         // N-S oeste (hasta el bosque)
  carretera(9, 150, 0, -75, PIE / 2); // E-W norte (bosque-downtown)
  carretera(9, 150, 0, 75, PIE / 2);  // E-W sur (lago-mercado)
  const matAcera = new THREE.MeshStandardMaterial({ color: 0xcfd6cf, roughness: 1 });
  const acera = (w, l, x, z, rotY = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l), matAcera);
    m.rotation.x = -PIE / 2; m.rotation.z = rotY; m.position.set(x, .015, z);
    m.receiveShadow = true; escena.add(m);
  };
  acera(13, 220, 75, 0); acera(13, 220, -75, 0);
  acera(13, 150, 0, -75, PIE / 2); acera(13, 150, 0, 75, PIE / 2);

  // farolas del anillo
  for (const [x, z] of [[75, 30], [75, -30], [-75, 30], [-75, -30], [30, 75], [-30, 75], [30, -75], [-30, -75]]) {
    const f = crearFarola(); f.position.set(x, 0, z); escena.add(f);
  }

  // ============================================================
  // DOWNTOWN (75, -75) — rascacielos, torre Alice y neones
  // ============================================================
  const plazaDT = new THREE.Mesh(new THREE.CircleGeometry(17, 36),
    new THREE.MeshStandardMaterial({ color: 0xd7dbe2, roughness: 1 }));
  plazaDT.rotation.x = -PIE / 2; plazaDT.position.set(75, .03, -75);
  plazaDT.receiveShadow = true; escena.add(plazaDT);
  const anilloDT = new THREE.Mesh(new THREE.RingGeometry(16.2, 17, 36),
    new THREE.MeshStandardMaterial({ color: 0x00d1ff, roughness: .5 }));
  anilloDT.rotation.x = -PIE / 2; anilloDT.position.set(75, .035, -75); escena.add(anilloDT);

  // TORRE ALICE (landmark central del downtown)
  const torre = rascacielos(44, 9, '#22303a', '#7fd8f7');
  torre.position.set(75, 0, -75); escena.add(torre);
  // rótulo vertical ALICE con luces
  const rotuloTex = lienzox(96, 384, (g) => {
    g.fillStyle = '#10181f'; g.fillRect(0, 0, 96, 384);
    g.fillStyle = '#00F299'; g.font = '900 64px sans-serif'; g.textAlign = 'center';
    for (const [i, ch] of 'ALICE'.split('').entries()) g.fillText(ch, 48, 74 + i * 66);
  });
  const rotulo = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 10.4),
    new THREE.MeshStandardMaterial({ map: rotuloTex, emissive: 0xffffff, emissiveMap: rotuloTex, emissiveIntensity: .85, roughness: .6 }));
  rotulo.position.set(75, 34, -69.9); escena.add(rotulo);
  animables.push((t) => { rotulo.material.emissiveIntensity = .65 + Math.sin(t * 2.2) * .3; });

  // rascacielos alrededor
  const basesDT = [[62, -62], [88, -62], [62, -88], [88, -88], [62, -75], [88, -75], [75, -62], [75, -88]];
  const paresColores = [['#5b7c99', '#bfe8f5'], ['#4a6d8c', '#a5dcf0'], ['#6b8899', '#cfeef8'], ['#557186', '#b2e4f2']];
  basesDT.forEach(([x, z], i) => {
    if (x === 75 && z === -75) return;
    const [ca, cb] = paresColores[i % paresColores.length];
    const t = rascacielos(rnd(20, 34), rnd(7, 9), ca, cb);
    t.position.set(x, 0, z); escena.add(t);
  });
  // vallas de anuncio neón
  const v1 = vallaAnuncio(['ALICOINS', 'trabaja y gana'], '#00F299');
  v1.position.set(60, 0, -52); v1.rotation.y = .5; escena.add(v1);
  const v2 = vallaAnuncio(['ALICE LABS', 'agents at work'], '#00d1ff');
  v2.position.set(92, 0, -58); v2.rotation.y = -.7; escena.add(v2);
  const v3 = vallaAnuncio(['x402 SOON', 'pago por llamada'], '#ffd166');
  v3.position.set(52, 0, -92); v3.rotation.y = 2.2; escena.add(v3);
  // bancos y árboles del downtown
  for (const [x, z, r] of [[66, -68, .8], [84, -68, -.8], [66, -82, 2.3], [84, -82, -2.3]]) {
    const b = crearBanco(); b.position.set(x, 0, z); b.rotation.y = r; escena.add(b);
  }
  for (let i = 0; i < 6; i++) {
    const a = rnd(0, 6.28), r = rnd(12, 16);
    const ar = pino(rnd(.7, 1)); ar.position.set(75 + Math.cos(a) * r, 0, -75 + Math.sin(a) * r);
    escena.add(ar);
  }

  // ============================================================
  // LAGO DEL SOL (-75, 75) — agua, playa, muelle, veleros
  // ============================================================
  const arenaTex = texArena();
  arenaTex.wrapS = arenaTex.wrapT = THREE.RepeatWrapping; arenaTex.repeat.set(10, 10);
  const playa = new THREE.Mesh(new THREE.CircleGeometry(34, 40),
    new THREE.MeshStandardMaterial({ map: arenaTex, roughness: 1 }));
  playa.rotation.x = -PIE / 2; playa.position.set(-75, .025, 75);
  playa.receiveShadow = true; escena.add(playa);

  const aguaGeo = new THREE.CircleGeometry(24, 44);
  const agua = new THREE.Mesh(aguaGeo,
    new THREE.MeshStandardMaterial({ color: 0x2fa8d5, roughness: .15, metalness: .25, transparent: true, opacity: .88 }));
  agua.rotation.x = -PIE / 2; agua.position.set(-75, .09, 75); escena.add(agua);
  // oleaje: ondulación vertical + brillo
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
  // orilla
  const orillaL = new THREE.Mesh(new THREE.RingGeometry(24, 25.4, 44),
    new THREE.MeshStandardMaterial({ color: 0xeadfc2, roughness: 1 }));
  orillaL.rotation.x = -PIE / 2; orillaL.position.set(-75, .07, 75); escena.add(orillaL);

  // muelle de madera
  const muelle = new THREE.Group();
  const matMadera = new THREE.MeshStandardMaterial({ color: 0x9a6a3e, roughness: .9 });
  const tableroM = new THREE.Mesh(new THREE.BoxGeometry(2.2, .18, 16), matMadera);
  tableroM.position.y = .55; tableroM.castShadow = true; muelle.add(tableroM);
  for (let i = 0; i < 5; i++) {
    for (const dx of [-.9, .9]) {
      const pilar = new THREE.Mesh(new THREE.CylinderGeometry(.09, .11, 1.1, 6), matMadera);
      pilar.position.set(dx, .1, -6 + i * 3); muelle.add(pilar);
    }
  }
  muelle.position.set(-58, 0, 64); muelle.rotation.y = -PIE / 2 - .5; escena.add(muelle);

  // veleros navegando
  for (const [ox, oz, vel, fase] of [[-6, 4, .35, 0], [5, -6, -.28, 2]]) {
    const v = velero();
    v.position.set(-75 + ox, .3, 75 + oz);
    escena.add(v);
    animables.push((t) => {
      const a = t * vel + fase;
      v.position.x = -75 + Math.cos(a) * 10 + ox * .2;
      v.position.z = 75 + Math.sin(a) * 10 + oz * .2;
      v.rotation.y = -a + PIE / 2;
      v.rotation.z = Math.sin(t * 1.4 + fase) * .05;
    });
  }
  // palmeras y más patos
  for (let i = 0; i < 8; i++) {
    const a = rnd(0, 6.28), r = rnd(27, 32);
    const p = palmera(); p.position.set(-75 + Math.cos(a) * r, 0, 75 + Math.sin(a) * r);
    p.rotation.y = rnd(0, 6.28); escena.add(p);
  }
  for (let i = 0; i < 3; i++) {
    const pato = new THREE.Group();
    const cue = new THREE.Mesh(new THREE.SphereGeometry(.14, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xfff3c9 }));
    cue.scale.set(1.2, .8, 1.4); pato.add(cue);
    const cab = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), cue.material);
    cab.position.set(0, .12, .12); pato.add(cab);
    pato.position.set(-75 + rnd(-8, 8), .12, 75 + rnd(-8, 8));
    escena.add(pato);
    animables.push((t) => { pato.position.x += Math.cos(t * .5 + i * 2) * .006; pato.position.z += Math.sin(t * .35 + i) * .004; });
  }
  // sombrillas
  for (const [x, z] of [[-52, 88], [-48, 62], [-100, 68], [-96, 92]]) {
    const s = new THREE.Group();
    const palo = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 2.2, 6), matMadera);
    palo.position.y = 1.1; s.add(palo);
    const copa = new THREE.Mesh(new THREE.ConeGeometry(1.3, .5, 8),
      new THREE.MeshStandardMaterial({ color: elegir([0xfb2c36, 0x00d1ff, 0xffd166]), roughness: .7 }));
    copa.position.y = 2.2; copa.castShadow = true; s.add(copa);
    s.position.set(x, 0, z); escena.add(s);
    const toalla = new THREE.Mesh(new THREE.PlaneGeometry(1.4, .8),
      new THREE.MeshStandardMaterial({ color: elegir([0x00F299, 0xff8fab, 0xa3e635]), roughness: 1 }));
    toalla.rotation.x = -PIE / 2; toalla.position.set(x + 1.2, .06, z); escena.add(toalla);
  }

  // ============================================================
  // BOSQUE DE PINOS (-75, -75) — sendero, setas, luciérnagas
  // ============================================================
  const claraboya = new THREE.Mesh(new THREE.CircleGeometry(9, 24),
    new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 1 }));
  claraboya.rotation.x = -PIE / 2; claraboya.position.set(-75, .03, -75);
  claraboya.receiveShadow = true; escena.add(claraboya);
  const pinosPos = [];
  for (let i = 0; i < 34; i++) {
    const a = rnd(0, 6.28), r = rnd(10, 26);
    const x = -75 + Math.cos(a) * r, z = -75 + Math.sin(a) * r;
    if (Math.hypot(x + 75, z + 75) < 5) continue;               // claraboya central
    if (Math.abs(x + 75) < 7.5 || Math.abs(z + 75) < 7.5) continue; // fuera de las carreteras
    let ok = true;
    for (const [ox, oz] of pinosPos) if (Math.hypot(ox - x, oz - z) < 3.4) { ok = false; break; }
    if (!ok) continue;
    pinosPos.push([x, z]);
    const p = pino(rnd(.9, 1.7)); p.position.set(x, 0, z); p.rotation.y = rnd(0, 6.28);
    escena.add(p);
  }
  // setas y rocas
  for (let i = 0; i < 10; i++) {
    const a = rnd(0, 6.28), r = rnd(8, 22);
    const seta = new THREE.Group();
    const tallo = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, .22, 6),
      new THREE.MeshStandardMaterial({ color: 0xf5f0e6 }));
    tallo.position.y = .11; seta.add(tallo);
    const somb = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xfb2c36, roughness: .7 }));
    somb.position.y = .22; seta.add(somb);
    seta.position.set(-75 + Math.cos(a) * r, 0, -75 + Math.sin(a) * r);
    escena.add(seta);
  }
  for (let i = 0; i < 7; i++) {
    const roca = new THREE.Mesh(new THREE.IcosahedronGeometry(rnd(.4, .9), 0),
      new THREE.MeshStandardMaterial({ color: 0x77705f, roughness: 1, flatShading: true }));
    const a = rnd(0, 6.28), r = rnd(9, 24);
    roca.position.set(-75 + Math.cos(a) * r, .25, -75 + Math.sin(a) * r);
    roca.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3));
    roca.castShadow = true; escena.add(roca);
  }
  // luciérnagas del bosque
  const nL = 26, lPos = new Float32Array(nL * 3), lGeo = new THREE.BufferGeometry();
  const lSem = [];
  for (let i = 0; i < nL; i++) lSem.push({ a: rnd(0, 6.28), r: rnd(6, 20), f: rnd(.3, .9), o: rnd(0, 6) });
  lGeo.setAttribute('position', new THREE.BufferAttribute(lPos, 3));
  const luciernagas = new THREE.Points(lGeo, new THREE.PointsMaterial({
    color: 0xfff3b0, size: .18, transparent: true, opacity: .9 }));
  escena.add(luciernagas);
  animables.push((t) => {
    luciernagas.material.opacity = .55 + Math.sin(t * 2.4) * .35;
    for (let i = 0; i < nL; i++) {
      const s = lSem[i];
      lPos[i * 3] = -75 + Math.cos(s.a + t * s.f * .25) * s.r;
      lPos[i * 3 + 1] = .7 + Math.sin(t * s.f + s.o) * .5;
      lPos[i * 3 + 2] = -75 + Math.sin(s.a + t * s.f * .3) * s.r;
    }
    lGeo.attributes.position.needsUpdate = true;
  });

  // ============================================================
  // MONTAÑAS NEVADAS (anillo de fondo, fuera del área jugable)
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
  // colinas verdes intermedias
  for (let i = 0; i < 8; i++) {
    const a = rnd(0, 6.28), dist = rnd(135, 165);
    const h = new THREE.Mesh(new THREE.SphereGeometry(rnd(14, 24), 10, 8),
      new THREE.MeshStandardMaterial({ color: 0x6fbf5a, roughness: 1, flatShading: true }));
    h.position.set(Math.cos(a) * dist, -rnd(6, 10), Math.sin(a) * dist);
    h.scale.y = .55; escena.add(h);
  }

  // árboles redondos extra por las calles del anillo
  for (let i = 0; i < 22; i++) {
    const calles = Math.random() < .5;
    const x = calles ? elegir([-75, 75]) + rnd(-3.2, 3.2) : rnd(-140, 140);
    const z = calles ? rnd(-100, 100) : elegir([-75, 75]) + rnd(-3.2, 3.2);
    if (Math.hypot(x - 75, z + 75) < 22 || Math.hypot(x + 75, z - 75) < 38 || Math.hypot(x + 75, z + 75) < 30) continue;
    if (Math.hypot(x, z) < 30) continue;
    const ar = crearArbol(rnd(.8, 1.4)); ar.position.set(x, 0, z); escena.add(ar);
  }

  const zonas = {
    downtown: new THREE.Vector3(75, 0, -75),
    torre: new THREE.Vector3(75, 0, -66),
    lago: new THREE.Vector3(-75, 0, 75),
    muelle: new THREE.Vector3(-58, 0, 64),
    bosque: new THREE.Vector3(-75, 0, -75),
  };
  return { zonas };
}
