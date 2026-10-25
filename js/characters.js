// ============ ALICE CITY — Personajes detallados ============
// Caras con textura canvas, pelo, cascos por rol y animaciones procedurales.
import * as THREE from 'three';

export const ROLES = {
  minero:      { nombre:'MINERO',      emoji:'⛏️', desc:'+50% monedas al minar',        bono:'mina' },
  constructor: { nombre:'CONSTRUCTOR', emoji:'🏗️', desc:'30% descuento al construir',    bono:'obra' },
  corredor:    { nombre:'CORREDOR',    emoji:'🏃', desc:'+30% velocidad de movimiento',  bono:'velocidad' },
  cocinero:    { nombre:'COCINERO',    emoji:'👨‍🍳', desc:'+40% monedas en contratos',     bono:'contratos' },
  artista:     { nombre:'ARTISTA',     emoji:'🎨', desc:'el ánimo sube el doble',        bono:'animo' },
};
export const PIEL      = ['#ffd9b0','#f2b380','#d29264','#a06a42','#6e4428'];
export const CAMISETAS = ['#00F299','#00d1ff','#fb2c36','#ffd166','#ff7b6b','#ff9f43','#a3e635','#f5f5f0','#ff8fab','#31c48d'];
export const PANTALONES= ['#22343c','#2b3a55','#5d5148','#7a5230','#1f6f54','#3d3d3d','#8a3b2e'];
export const PELOS     = ['#1b1b1b','#5a3a1e','#c98f2f','#e5e5e5','#b34a2e','#00d1ff'];
export const PELO_ESTILOS = ['corto','picos','mono','largo','calvo'];

// ---------- textura de cara ----------
function texturaCara(pielHex, irisHex = '#3b6ea5', sonrisa = true) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = pielHex; g.fillRect(0, 0, 128, 128);
  // mejillas rubor
  g.fillStyle = 'rgba(255,120,100,.28)';
  g.beginPath(); g.arc(30, 78, 11, 0, 7); g.fill();
  g.beginPath(); g.arc(98, 78, 11, 0, 7); g.fill();
  // ojos
  const ojo = (x) => {
    g.fillStyle = '#fff';
    g.beginPath(); g.ellipse(x, 56, 12, 14, 0, 0, 7); g.fill();
    g.fillStyle = irisHex;
    g.beginPath(); g.arc(x, 58, 7, 0, 7); g.fill();
    g.fillStyle = '#141414';
    g.beginPath(); g.arc(x, 58, 3.4, 0, 7); g.fill();
    g.fillStyle = '#fff';
    g.beginPath(); g.arc(x - 2.5, 54.5, 2.2, 0, 7); g.fill();
  };
  ojo(42); ojo(86);
  // cejas
  g.strokeStyle = 'rgba(30,20,10,.85)'; g.lineWidth = 4; g.lineCap = 'round';
  g.beginPath(); g.moveTo(30, 36); g.quadraticCurveTo(42, 31, 54, 36); g.stroke();
  g.beginPath(); g.moveTo(74, 36); g.quadraticCurveTo(86, 31, 98, 36); g.stroke();
  // nariz
  g.fillStyle = 'rgba(0,0,0,.14)';
  g.beginPath(); g.ellipse(64, 70, 4, 5, 0, 0, 7); g.fill();
  // boca
  g.strokeStyle = '#7d3b2e'; g.lineWidth = 4.5;
  g.beginPath();
  if (sonrisa) g.quadraticCurveTo(64, 92, 80, 84);
  else { g.moveTo(56, 86); g.lineTo(72, 86); }
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------- placa de nombre ----------
export function crearPlaca(nombre, colorRol = '#00F299') {
  const c = document.createElement('canvas'); c.width = 256; c.height = 72;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(5,10,14,.72)';
  const r = 16;
  g.beginPath(); g.roundRect(4, 8, 248, 52, r); g.fill();
  g.fillStyle = colorRol; g.beginPath(); g.arc(30, 34, 8, 0, 7); g.fill();
  g.fillStyle = '#fff'; g.font = '800 26px "Segoe UI", sans-serif';
  g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillText(nombre.slice(0, 13), 48, 36);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
  s.scale.set(1.5, 0.42, 1); s.renderOrder = 10;
  return s;
}

// ---------- pelo ----------
function crearPelo(estilo, color, skinMat) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: .9 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(.60, .16, .60), mat);
  top.position.y = .30; g.add(top);
  if (estilo === 'corto') {
    const fr = new THREE.Mesh(new THREE.BoxGeometry(.60, .14, .10), mat);
    fr.position.set(0, .22, .27); g.add(fr);
  } else if (estilo === 'picos') {
    for (let i = 0; i < 4; i++) {
      const p = new THREE.Mesh(new THREE.ConeGeometry(.09, .22, 5), mat);
      p.position.set(-.18 + i * .12, .42, (i % 2) * .12 - .06);
      p.rotation.z = (i - 1.5) * .18; g.add(p);
    }
  } else if (estilo === 'mono') {
    const b = new THREE.Mesh(new THREE.SphereGeometry(.13, 10, 8), mat);
    b.position.set(0, .44, -.05); g.add(b);
  } else if (estilo === 'largo') {
    const at = new THREE.Mesh(new THREE.BoxGeometry(.60, .44, .14), mat);
    at.position.set(0, .04, -.28); g.add(at);
    const fr = new THREE.Mesh(new THREE.BoxGeometry(.60, .16, .10), mat);
    fr.position.set(0, .20, .27); g.add(fr);
  }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
  return g;
}

// ---------- cascos por rol ----------
function crearCasco(rol) {
  const g = new THREE.Group();
  const add = (mesh) => { mesh.castShadow = true; g.add(mesh); return mesh; };
  if (rol === 'minero' || rol === 'constructor') {
    const col = rol === 'minero' ? 0xffd166 : 0xff9f43;
    const cas = add(new THREE.Mesh(new THREE.SphereGeometry(.34, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: col, roughness: .5 })));
    cas.position.y = .16; cas.scale.y = .8;
    const ala = add(new THREE.Mesh(new THREE.CylinderGeometry(.37, .37, .045, 14),
      new THREE.MeshStandardMaterial({ color: col, roughness: .5 })));
    ala.position.y = .14;
    const foco = add(new THREE.Mesh(new THREE.BoxGeometry(.10, .06, .05),
      new THREE.MeshStandardMaterial({ color: 0xfff6c9, emissive: 0xffe066, emissiveIntensity: 1.6 })));
    foco.position.set(0, .30, .30);
  } else if (rol === 'cocinero') {
    const t = add(new THREE.Mesh(new THREE.CylinderGeometry(.20, .24, .30, 12),
      new THREE.MeshStandardMaterial({ color: 0xf7f7f2, roughness: .8 })));
    t.position.y = .32;
    const p = add(new THREE.Mesh(new THREE.SphereGeometry(.24, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .8 })));
    p.position.y = .48; p.scale.y = .7;
  } else if (rol === 'artista') {
    const b = add(new THREE.Mesh(new THREE.SphereGeometry(.30, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xfb2c36, roughness: .85 })));
    b.position.y = .20; b.scale.y = .45; b.rotation.z = .12;
  } else if (rol === 'corredor') {
    const c = add(new THREE.Mesh(new THREE.SphereGeometry(.32, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.2),
      new THREE.MeshStandardMaterial({ color: 0x00d1ff, roughness: .7 })));
    c.position.y = .12; c.scale.y = .75;
    const v = add(new THREE.Mesh(new THREE.BoxGeometry(.30, .04, .26),
      new THREE.MeshStandardMaterial({ color: 0x00d1ff, roughness: .7 })));
    v.position.set(0, .16, .34);
  }
  return g;
}

// ---------- factoría del personaje ----------
export function crearPersonaje(cfg) {
  const piel  = cfg.piel  ?? PIEL[0];
  const cami  = cfg.camiseta ?? CAMISETAS[0];
  const pant  = cfg.pantalon ?? PANTALONES[0];
  const rol   = cfg.rol || 'minero';
  const grupo = new THREE.Group();

  const matPiel = new THREE.MeshStandardMaterial({ color: piel, roughness: .75 });
  const matCami = new THREE.MeshStandardMaterial({ color: cami, roughness: .8 });
  const matPant = new THREE.MeshStandardMaterial({ color: pant, roughness: .85 });
  const matZapa = new THREE.MeshStandardMaterial({ color: 0x22262a, roughness: .9 });

  // ----- piernas -----
  const caderas = new THREE.Group(); caderas.position.y = .52; grupo.add(caderas);
  const pierna = (lado) => {
    const p = new THREE.Group();
    const muslo = new THREE.Mesh(new THREE.BoxGeometry(.17, .44, .19), matPant);
    muslo.position.y = -.22; muslo.castShadow = true; p.add(muslo);
    const zap = new THREE.Mesh(new THREE.BoxGeometry(.19, .10, .28), matZapa);
    zap.position.set(0, -.48, .04); zap.castShadow = true; p.add(zap);
    p.position.x = lado * .11; caderas.add(p); return p;
  };
  const piernaI = pierna(-1), piernaD = pierna(1);

  // ----- torso -----
  const torso = new THREE.Group(); torso.position.y = .52; grupo.add(torso);
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(.44, .46, .26), matCami);
  cuerpo.position.y = .25; cuerpo.castShadow = true; torso.add(cuerpo);
  // cinturón
  const cint = new THREE.Mesh(new THREE.BoxGeometry(.46, .07, .28),
    new THREE.MeshStandardMaterial({ color: 0x1a1d20, roughness: .9 }));
  cint.position.y = .05; torso.add(cint);

  // ----- brazos -----
  const brazo = (lado) => {
    const h = new THREE.Group(); h.position.set(lado * .27, .42, 0);
    const braz = new THREE.Mesh(new THREE.BoxGeometry(.13, .38, .15), matCami);
    braz.position.y = -.17; braz.castShadow = true; h.add(braz);
    const mano = new THREE.Mesh(new THREE.SphereGeometry(.085, 8, 6), matPiel);
    mano.position.y = -.40; mano.castShadow = true; h.add(mano);
    torso.add(h); return h;
  };
  const brazoI = brazo(-1), brazoD = brazo(1);

  // ----- cabeza -----
  const cabeza = new THREE.Group(); cabeza.position.y = .48; torso.add(cabeza);
  const craneo = new THREE.Mesh(new THREE.BoxGeometry(.46, .44, .44), matPiel);
  craneo.position.y = .24; craneo.castShadow = true; cabeza.add(craneo);
  const cara = new THREE.Mesh(new THREE.PlaneGeometry(.42, .42),
    new THREE.MeshStandardMaterial({ map: texturaCara(piel, cfg.iris || '#3b6ea5'), roughness: .7 }));
  cara.position.set(0, .24, .221); cabeza.add(cara);
  const pelo = crearPelo(cfg.peloEstilo ?? 'corto', cfg.peloColor ?? PELOS[0]);
  pelo.position.y = .38; cabeza.add(pelo);
  const casco = crearCasco(rol); cabeza.add(casco);

  // ----- herramienta según rol -----
  const herramienta = new THREE.Group();
  if (rol === 'minero') {
    const palo = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .5, 6),
      new THREE.MeshStandardMaterial({ color: 0x8a5a2e }));
    const punta = new THREE.Mesh(new THREE.ConeGeometry(.07, .16, 4),
      new THREE.MeshStandardMaterial({ color: 0xb9c4cc, metalness: .6, roughness: .4 }));
    punta.position.y = .30; punta.rotation.x = Math.PI / 2;
    herramienta.add(palo, punta); herramienta.position.set(.12, -.42, .05);
    brazoD.add(herramienta);
  } else if (rol === 'constructor') {
    const palo = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .45, 6),
      new THREE.MeshStandardMaterial({ color: 0xc9a86a }));
    const cab = new THREE.Mesh(new THREE.BoxGeometry(.22, .07, .07),
      new THREE.MeshStandardMaterial({ color: 0x9aa5ad, metalness: .5 }));
    cab.position.y = .24; herramienta.add(palo, cab);
    herramienta.position.set(.12, -.40, .05); brazoD.add(herramienta);
  } else if (rol === 'artista') {
    const lienzo = new THREE.Mesh(new THREE.BoxGeometry(.26, .2, .03),
      new THREE.MeshStandardMaterial({ color: 0xf5f0e6 }));
    lienzo.position.set(0, .28, .12);
    herramienta.add(lienzo); herramienta.position.set(0, -.4, .1); brazoD.add(herramienta);
  } else if (rol === 'cocinero') {
    const sart = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .04, 12),
      new THREE.MeshStandardMaterial({ color: 0x2c2c2c, metalness: .4 }));
    sart.position.y = .1; herramienta.add(sart);
    herramienta.position.set(.1, -.42, .06); brazoD.add(herramienta);
  } else {
    const balon = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xffffff }));
    balon.position.y = -.44; brazoD.add(balon);
  }

  // ----- estado de animación -----
  let estado = 'idle', fase = Math.random() * 10;
  const api = {
    grupo, cfg, rol,
    partes: { cabeza, torso, caderas, brazoI, brazoD, piernaI, piernaD, pelo, casco },
    setEstado(s) { estado = s; },
    get estado() { return estado; },
    update(t, moviendo = false) {
      if (moviendo) estado = 'walk';
      else if (estado === 'walk') estado = 'idle';
      const k = t + fase;
      if (estado === 'walk') {
        const s = Math.sin(k * 9);
        piernaI.rotation.x = s * .75; piernaD.rotation.x = -s * .75;
        brazoI.rotation.x = -s * .6; brazoD.rotation.x = s * .6;
        grupo.position.y = Math.abs(Math.sin(k * 9)) * .045;
        cabeza.rotation.z = Math.sin(k * 4.5) * .04;
      } else if (estado === 'mine') {
        brazoD.rotation.x = -1.5 + Math.abs(Math.sin(k * 5)) * 2.1;
        brazoI.rotation.x = -.3;
        torso.rotation.y = Math.sin(k * 5) * .12;
        piernaI.rotation.x = .15; piernaD.rotation.x = -.15;
      } else if (estado === 'work') {
        brazoD.rotation.x = -1.1 + Math.sin(k * 14) * .12;
        brazoI.rotation.x = -1.05 + Math.cos(k * 13) * .12;
        cabeza.rotation.x = .25;
      } else if (estado === 'sit' || estado === 'relax') {
        piernaI.rotation.x = piernaD.rotation.x = -1.45;
        brazoI.rotation.x = brazoD.rotation.x = -.25;
        grupo.position.y = -.34;
        cabeza.rotation.z = Math.sin(k * 1.2) * .08;
      } else { // idle
        const b = Math.sin(k * 2) * .5 + .5;
        torso.scale.y = 1 + b * .02;
        brazoI.rotation.x = Math.sin(k * 2) * .06;
        brazoD.rotation.x = -Math.sin(k * 2) * .06;
        cabeza.rotation.y = Math.sin(k * .6) * .3;
        piernaI.rotation.x = piernaD.rotation.x = 0;
        grupo.position.y = 0;
      }
    },
  };
  return api;
}

// aleatorio
export function personajeAleatorio(base = {}) {
  const roles = Object.keys(ROLES);
  return {
    nombre: base.nombre || '',
    rol: roles[(Math.random() * roles.length) | 0],
    piel: PIEL[(Math.random() * PIEL.length) | 0],
    camiseta: CAMISETAS[(Math.random() * CAMISETAS.length) | 0],
    pantalon: PANTALONES[(Math.random() * PANTALONES.length) | 0],
    peloEstilo: PELO_ESTILOS[(Math.random() * PELO_ESTILOS.length) | 0],
    peloColor: PELOS[(Math.random() * PELOS.length) | 0],
    ...base,
  };
}
