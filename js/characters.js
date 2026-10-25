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

// ---------- TIENDA DE ACCESORIOS (precios en ALC; 0 = gratis) ----------
export const TIENDA = {
  sombrero: [
    { id: 'ninguno',   nombre: 'Nada',           precio: 0 },
    { id: 'boina',     nombre: 'Boina artista',  precio: 60 },
    { id: 'copa',      nombre: 'Copa elegante',  precio: 120 },
    { id: 'orejas',    nombre: 'Orejas de gato', precio: 90 },
    { id: 'corona',    nombre: 'Corona dorada',  precio: 250 },
    { id: 'propulsor', nombre: 'Casco cohete',   precio: 300 },
  ],
  gafas: [
    { id: 'ninguno', nombre: 'Ninguna',  precio: 0 },
    { id: 'sol',     nombre: 'De sol',   precio: 50 },
    { id: 'pixel',   nombre: 'Pixel 8-bit', precio: 75 },
    { id: 'visor',   nombre: 'Visor neón',  precio: 150 },
    { id: 'corazon', nombre: 'Corazones',   precio: 100 },
  ],
  espalda: [
    { id: 'ninguno',  nombre: 'Nada',        precio: 0 },
    { id: 'mochila',  nombre: 'Mochila',     precio: 120 },
    { id: 'alas',     nombre: 'Alas de agente', precio: 350 },
    { id: 'jetpack',  nombre: 'Jetpack',     precio: 400 },
    { id: 'dron',     nombre: 'Dron personal', precio: 500 },
  ],
  capa: [
    { id: 'ninguna',  nombre: 'Sin capa',    precio: 0 },
    { id: 'capaVerde', nombre: 'Capa verde', precio: 100 },
    { id: 'capaCian', nombre: 'Capa cian',  precio: 100 },
    { id: 'capaRoja', nombre: 'Capa roja',  precio: 120 },
  ],
};

// ---------- fábrica de accesorios ----------
function crearAccesorio(slot, id) {
  const g = new THREE.Group();
  const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .6, ...o });
  if (slot === 'sombrero') {
    if (id === 'boina') {
      const b = new THREE.Mesh(new THREE.SphereGeometry(.30, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x2e2e38));
      b.scale.y = .5; b.position.y = .44; g.add(b);
      const punt = new THREE.Mesh(new THREE.SphereGeometry(.05, 6, 5), mat(0x2e2e38));
      punt.position.set(.12, .58, 0); g.add(punt);
    } else if (id === 'copa') {
      const tub = new THREE.Mesh(new THREE.CylinderGeometry(.16, .17, .28, 12), mat(0x181820, { roughness: .35 }));
      tub.position.y = .58; g.add(tub);
      const ala = new THREE.Mesh(new THREE.CylinderGeometry(.30, .30, .04, 14), mat(0x181820, { roughness: .35 }));
      ala.position.y = .44; g.add(ala);
      const banda = new THREE.Mesh(new THREE.CylinderGeometry(.165, .165, .06, 12), mat(0x00F299, { emissive: 0x00F299, emissiveIntensity: .5 }));
      banda.position.y = .48; g.add(banda);
    } else if (id === 'orejas') {
      for (const dx of [-.16, .16]) {
        const tri = new THREE.Mesh(new THREE.ConeGeometry(.10, .26, 4), mat(0xff8fab));
        tri.position.set(dx, .52, 0); tri.rotation.z = -dx * .8; g.add(tri);
        const inner = new THREE.Mesh(new THREE.ConeGeometry(.05, .14, 4), mat(0xffffff));
        inner.position.set(dx, .52, .02); inner.rotation.z = -dx * .8; g.add(inner);
      }
    } else if (id === 'corona') {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(.24, .26, .10, 12), mat(0xffd166, { metalness: .85, roughness: .25 }));
      base.position.y = .48; g.add(base);
      for (let i = 0; i < 5; i++) {
        const pico = new THREE.Mesh(new THREE.ConeGeometry(.05, .16, 4), mat(0xffd166, { metalness: .85, roughness: .25 }));
        const a = (i / 5) * Math.PI * 2;
        pico.position.set(Math.cos(a) * .21, .60, Math.sin(a) * .21); g.add(pico);
      }
      const gema = new THREE.Mesh(new THREE.OctahedronGeometry(.06), mat(0x00d1ff, { emissive: 0x00d1ff, emissiveIntensity: .8 }));
      gema.position.set(0, .52, .24); g.add(gema);
    } else if (id === 'propulsor') {
      const dom = new THREE.Mesh(new THREE.SphereGeometry(.33, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xd8dee4, { metalness: .7, roughness: .3 }));
      dom.position.y = .38; dom.scale.y = .8; g.add(dom);
      const vis = new THREE.Mesh(new THREE.BoxGeometry(.34, .12, .05), mat(0x00d1ff, { emissive: 0x00d1ff, emissiveIntensity: 1.2 }));
      vis.position.set(0, .44, .28); g.add(vis);
      const aleta = new THREE.Mesh(new THREE.ConeGeometry(.06, .22, 4), mat(0xfb2c36));
      aleta.position.set(0, .62, -.18); g.add(aleta);
    }
  } else if (slot === 'gafas') {
    const puente = (matL) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(.10, .03, .03), matL);
      m.position.set(0, .30, .235); g.add(m);
    };
    if (id === 'sol') {
      const matL = mat(0x14161a, { roughness: .2, metalness: .4 });
      for (const dx of [-.11, .11]) {
        const l = new THREE.Mesh(new THREE.BoxGeometry(.16, .10, .03), matL);
        l.position.set(dx, .30, .235); g.add(l);
      }
      puente(matL);
    } else if (id === 'pixel') {
      const matL = mat(0x00F299, { emissive: 0x00F299, emissiveIntensity: .7 });
      for (const cx of [-.11, .11]) for (const cy of [0, .06]) {
        const l = new THREE.Mesh(new THREE.BoxGeometry(.05, .05, .02), matL);
        l.position.set(cx, .28 + cy, .235); g.add(l);
      }
    } else if (id === 'visor') {
      const v = new THREE.Mesh(new THREE.BoxGeometry(.40, .10, .05), mat(0x00d1ff, { emissive: 0x00d1ff, emissiveIntensity: 1.1, transparent: true, opacity: .9 }));
      v.position.set(0, .30, .235); g.add(v);
    } else if (id === 'corazon') {
      const matL = mat(0xfb2c36, { emissive: 0xfb2c36, emissiveIntensity: .5 });
      for (const dx of [-.11, .11]) {
        for (const [ox, oy, s] of [[-.03, .04, 1], [.03, .04, 1], [0, -.02, 1.2]]) {
          const c = new THREE.Mesh(new THREE.SphereGeometry(.028 * s, 6, 5), matL);
          c.position.set(dx + ox, .28 + oy + .02, .235); g.add(c);
        }
      }
    }
  } else if (slot === 'espalda') {
    if (id === 'mochila') {
      const m = new THREE.Mesh(new THREE.BoxGeometry(.30, .34, .14), mat(0x8a5a2e));
      m.position.set(0, .28, -.22); g.add(m);
      const bol = new THREE.Mesh(new THREE.BoxGeometry(.12, .08, .04), mat(0xffd166));
      bol.position.set(0, .36, -.30); g.add(bol);
    } else if (id === 'alas') {
      for (const dx of [-1, 1]) {
        const ala = new THREE.Mesh(new THREE.BoxGeometry(.42, .50, .03), mat(0xf5f5f0, { roughness: .5, transparent: true, opacity: .92 }));
        ala.position.set(dx * .30, .30, -.20); ala.rotation.z = dx * .38; ala.rotation.y = dx * -.18;
        g.add(ala);
      }
    } else if (id === 'jetpack') {
      for (const dx of [-.12, .12]) {
        const cil = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .36, 10), mat(0xb9c4cc, { metalness: .7, roughness: .3 }));
        cil.position.set(dx, .30, -.24); g.add(cil);
        const lla = new THREE.Mesh(new THREE.ConeGeometry(.07, .10, 8), mat(0xfb2c36, { emissive: 0xfb2c36, emissiveIntensity: .6 }));
        lla.rotation.x = Math.PI; lla.position.set(dx, .08, -.24); g.add(lla);
      }
    } else if (id === 'dron') {
      const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(.18, .06, .18), mat(0x22343c));
      cuerpo.position.set(0, .78, -.28); g.add(cuerpo);
      for (const [ox, oz] of [[-.14, -.14], [.14, -.14], [-.14, .14], [.14, .14]]) {
        const heli = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .015, 8), mat(0x00d1ff, { transparent: true, opacity: .7 }));
        heli.position.set(ox, .82, -.28 + oz); g.add(heli);
      }
      g.userData.dron = true; // gira en update
    }
  } else if (slot === 'capa') {
    const colores = { capaVerde: 0x00F299, capaCian: 0x00d1ff, capaRoja: 0xfb2c36 };
    if (colores[id]) {
      const c = new THREE.Mesh(new THREE.PlaneGeometry(.5, .62),
        mat(colores[id], { side: THREE.DoubleSide, roughness: .8 }));
      c.position.set(0, .28, -.17); c.rotation.x = .10; g.add(c);
      g.userData.capa = true; // ondea en update
    }
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export function crearAccesorios(cfg) {
  const acc = cfg.accesorios || {};
  const g = new THREE.Group();
  const partes = {};
  for (const slot of Object.keys(TIENDA)) {
    const id = acc[slot];
    if (!id || id === 'ninguno' || id === 'ninguna') continue;
    const p = crearAccesorio(slot, id);
    partes[slot] = p;
    g.add(p);
  }
  return { grupo: g, partes };
}

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

  // ----- accesorios (tienda) -----
  const acc = cfg.accesorios || {};
  let capaMalla = null, dronHelis = null;
  const accesorios = crearAccesorios(cfg);
  if (accesorios.partes.sombrero) cabeza.add(accesorios.partes.sombrero);
  if (accesorios.partes.gafas) cabeza.add(accesorios.partes.gafas);
  if (accesorios.partes.espalda) torso.add(accesorios.partes.espalda);
  if (accesorios.partes.capa) { torso.add(accesorios.partes.capa); capaMalla = accesorios.partes.capa; }
  if (acc.espalda === 'dron' && accesorios.partes.espalda) {
    dronHelis = accesorios.partes.espalda.children.filter(o => o.geometry?.type === 'CylinderGeometry');
  }

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
      // accesorios animados
      if (capaMalla) {
        capaMalla.rotation.x = .10 + Math.sin(k * 2.4) * .07 + (estado === 'walk' ? Math.sin(k * 9) * .12 : 0);
      }
      if (dronHelis) for (const h of dronHelis) h.rotation.y += .55;
    },
  };
  return api;
}

// aleatorio
const ACCESORIO_AL_AZAR = (slot) => {
  const ops = TIENDA[slot].filter(o => o.precio === 0 || Math.random() < .35);
  return ops[(Math.random() * ops.length) | 0]?.id || 'ninguno';
};
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
    accesorios: base.accesorios ?? {
      sombrero: Math.random() < .55 ? ACCESORIO_AL_AZAR('sombrero') : 'ninguno',
      gafas: Math.random() < .45 ? ACCESORIO_AL_AZAR('gafas') : 'ninguno',
      espalda: Math.random() < .3 ? ACCESORIO_AL_AZAR('espalda') : 'ninguno',
      capa: Math.random() < .2 ? ACCESORIO_AL_AZAR('capa') : 'ninguna',
    },
    ...base,
  };
}
