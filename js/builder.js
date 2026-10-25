// ============ ALICE CITY — Constructor de casa en tu parcela ============
import * as THREE from 'three';
import { crearArbol, crearFarola } from './world.js';

const PIE = Math.PI;

// ----- fábrica de piezas -----
function piezaSuelo() {
  const m = new THREE.Mesh(new THREE.BoxGeometry(1, .12, 1),
    new THREE.MeshStandardMaterial({ color: 0xc98d4e, roughness: .85 }));
  m.position.y = .06; return m;
}
function piezaPared() {
  const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1.1, .16),
    new THREE.MeshStandardMaterial({ color: 0xf1e9d8, roughness: .9 }));
  m.position.y = .61; return m;
}
function piezaPuerta() {
  const g = new THREE.Group();
  const matMadera = new THREE.MeshStandardMaterial({ color: 0x8a5a2e, roughness: .85 });
  const izq = new THREE.Mesh(new THREE.BoxGeometry(.25, 1.1, .16), new THREE.MeshStandardMaterial({ color: 0xf1e9d8 }));
  izq.position.x = -.38; izq.position.y = .61;
  const der = izq.clone(); der.position.x = .38;
  const alto = new THREE.Mesh(new THREE.BoxGeometry(.5, .3, .16), new THREE.MeshStandardMaterial({ color: 0xf1e9d8 }));
  alto.position.y = .96;
  const puerta = new THREE.Mesh(new THREE.BoxGeometry(.5, .82, .1), matMadera);
  puerta.position.y = .44;
  const pomo = new THREE.Mesh(new THREE.SphereGeometry(.035, 6, 5),
    new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: .6 }));
  pomo.position.set(.17, .42, .08);
  g.add(izq, der, alto, puerta, pomo);
  return g;
}
function piezaVentana() {
  const g = new THREE.Group();
  const matMuro = new THREE.MeshStandardMaterial({ color: 0xf1e9d8 });
  const izq = new THREE.Mesh(new THREE.BoxGeometry(.28, 1.1, .16), matMuro);
  izq.position.x = -.36; izq.position.y = .61;
  const der = izq.clone(); der.position.x = .36;
  const abajo = new THREE.Mesh(new THREE.BoxGeometry(.44, .5, .16), matMuro);
  abajo.position.y = .28;
  const arriba = new THREE.Mesh(new THREE.BoxGeometry(.44, .34, .16), matMuro);
  arriba.position.y = .94;
  const cristal = new THREE.Mesh(new THREE.BoxGeometry(.44, .5, .06),
    new THREE.MeshStandardMaterial({ color: 0x9fe8ff, transparent: true, opacity: .6, roughness: .1 }));
  cristal.position.y = .61;
  g.add(izq, der, abajo, arriba, cristal);
  return g;
}
function piezaTecho() {
  const g = new THREE.Group();
  const teja = new THREE.MeshStandardMaterial({ color: 0xe05252, roughness: .8, flatShading: true });
  const pir = new THREE.Mesh(new THREE.ConeGeometry(.78, .55, 4), teja);
  pir.rotation.y = PIE / 4; pir.position.y = 2.45; pir.castShadow = true; g.add(pir);
  const borde = new THREE.Mesh(new THREE.BoxGeometry(1.04, .12, 1.04),
    new THREE.MeshStandardMaterial({ color: 0xc94444 }));
  borde.position.y = 2.22; g.add(borde);
  return g;
}
function piezaChimenea() {
  const g = new THREE.Group();
  const ladr = new THREE.MeshStandardMaterial({ color: 0xb0563f, roughness: .9 });
  const c = new THREE.Mesh(new THREE.BoxGeometry(.34, 1.5, .34), ladr);
  c.position.y = 2.7; c.castShadow = true; g.add(c);
  const boca = new THREE.Mesh(new THREE.BoxGeometry(.42, .12, .42),
    new THREE.MeshStandardMaterial({ color: 0x8a3b2e }));
  boca.position.y = 3.5; g.add(boca);
  return g;
}
function piezaArbusto() {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(.42, 0),
    new THREE.MeshStandardMaterial({ color: 0x58c96b, roughness: .95, flatShading: true }));
  m.position.y = .34; m.castShadow = true; return m;
}

export function crearConstructor(escena, parcela, eco) {
  const items = [
    { id: 'suelo', nombre: 'SUELO', ico: '🟫', precio: 10, crear: piezaSuelo, nivel: 0 },
    { id: 'pared', nombre: 'PARED', ico: '🧱', precio: 25, crear: piezaPared, nivel: 0 },
    { id: 'puerta', nombre: 'PUERTA', ico: '🚪', precio: 40, crear: piezaPuerta, nivel: 0 },
    { id: 'ventana', nombre: 'VENTANA', ico: '🪟', precio: 20, crear: piezaVentana, nivel: 0 },
    { id: 'techo', nombre: 'TECHO', ico: '🏠', precio: 50, crear: piezaTecho, nivel: 2 },
    { id: 'chimenea', nombre: 'CHIMENEA', ico: '🔥', precio: 35, crear: piezaChimenea, nivel: 2 },
    { id: 'arbol', nombre: 'ÁRBOL', ico: '🌳', precio: 15, crear: () => { const a = crearArbol(.7); return a; }, nivel: 0 },
    { id: 'farola', nombre: 'FAROLA', ico: '💡', precio: 20, crear: crearFarola, nivel: 0 },
    { id: 'arbusto', nombre: 'ARBUSTO', ico: '🌿', precio: 8, crear: piezaArbusto, nivel: 0 },
  ];

  const origen = new THREE.Vector3(parcela.x, 0, parcela.z);
  const GX = 12, GZ = 8;
  const estado = {
    activo: false, item: items[1], rot: 0, nivel: 0,
    piezas: [],        // {id, gx, gz, rot, mesh}
    casaCompleta: false,
  };

  // plano fantasma
  const ghost = new THREE.Group();
  const ghostRey = new THREE.MeshStandardMaterial({ color: 0x00F299, transparent: true, opacity: .55 });
  const ghostMal = new THREE.MeshStandardMaterial({ color: 0xfb2c36, transparent: true, opacity: .55 });
  escena.add(ghost); ghost.visible = false;

  // rejilla visible
  const gridHelper = new THREE.Group();
  const matLinea = new THREE.LineBasicMaterial({ color: 0x00F299, transparent: true, opacity: .35 });
  for (let i = 0; i <= GX; i++) {
    const pts = [new THREE.Vector3(i - GX / 2, .05, -GZ / 2), new THREE.Vector3(i - GX / 2, .05, GZ / 2)];
    gridHelper.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), matLinea));
  }
  for (let j = 0; j <= GZ; j++) {
    const pts = [new THREE.Vector3(-GX / 2, .05, j - GZ / 2), new THREE.Vector3(GX / 2, .05, j - GZ / 2)];
    gridHelper.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), matLinea));
  }
  gridHelper.visible = false; escena.add(gridHelper);

  const raycaster = new THREE.Raycaster();
  const plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const celdaOcupada = (gx, gz, nivel) => estado.piezas.find(p => p.gx === gx && p.gz === gz && p.nivel === nivel);
  const precioDe = (it) => eco && eco.estado ? Math.round(it.precio * (eco.bonusObra ? .7 : 1)) : it.precio;

  function colocarEn(gx, gz, raton = null) {
    const it = estado.item;
    const nivel = it.nivel;
    const precio = precioDe(it);
    if (celdaOcupada(gx, gz, nivel)) return false;
    if (!eco.gastar(precio)) { eco.ui.toast('❌ No tienes monedas suficientes', 'rojo'); return false; }
    const mesh = it.crear();
    mesh.position.set(origen.x + gx, nivel === 2 ? 0 : 0, origen.z + gz);
    mesh.rotation.y = estado.rot * PIE / 2;
    escena.add(mesh);
    estado.piezas.push({ id: it.id, gx, gz, rot: estado.rot, nivel, mesh });
    eco.ui.sonido('colocar');
    comprobarCasa();
    return true;
  }

  function demolerEn(gx, gz) {
    // busca la pieza más alta en esa celda
    let idx = -1, mejorN = -1;
    estado.piezas.forEach((p, i) => {
      if (p.gx === gx && p.gz === gz && p.nivel > mejorN) { idx = i; mejorN = p.nivel; }
    });
    if (idx < 0) return false;
    const p = estado.piezas[idx];
    escena.remove(p.mesh);
    estado.piezas.splice(idx, 1);
    const it = items.find(i2 => i2.id === p.id);
    eco.reembolsar(Math.round(it.precio * .7));
    eco.ui.sonido('romper');
    return true;
  }

  function comprobarCasa() {
    if (estado.casaCompleta) return;
    const tiene = (id, n) => estado.piezas.filter(p => p.id === id).length >= n;
    if (tiene('pared', 4) && tiene('puerta', 1) && tiene('techo', 1)) {
      estado.casaCompleta = true;
      eco.ganar(100, origen, 'premio');
      eco.ui.toast('🎉 ¡CASA COMPLETADA! +100 monedas de premio', 'verde');
      eco.ui.sonido('victoria');
    }
  }

  // ----- guardar / cargar -----
  function guardar() {
    const data = estado.piezas.map(p => ({ id: p.id, gx: p.gx, gz: p.gz, rot: p.rot, nivel: p.nivel }));
    localStorage.setItem('alice_casa', JSON.stringify(data));
  }
  function cargar() {
    try {
      const data = JSON.parse(localStorage.getItem('alice_casa') || '[]');
      for (const d of data) {
        const it = items.find(i2 => i2.id === d.id);
        if (!it || celdaOcupada(d.gx, d.gz, d.nivel)) continue;
        const mesh = it.crear();
        mesh.position.set(origen.x + d.gx, 0, origen.z + d.gz);
        mesh.rotation.y = d.rot * PIE / 2;
        escena.add(mesh);
        estado.piezas.push({ ...d, mesh });
      }
    } catch { /* sin guardado */ }
  }
  cargar();

  // ----- activar / desactivar -----
  function activar() {
    estado.activo = true;
    gridHelper.visible = true;
  }
  function desactivar() {
    estado.activo = false;
    gridHelper.visible = false; ghost.visible = false;
    guardar();
  }

  // ----- update: ghost con el ratón -----
  const ndc = new THREE.Vector2();
  let mouse = { x: 0, y: 0, dentro: false };
  function update(camara, dom, eventos) {
    if (!estado.activo) return;
    ndc.set(mouse.x, mouse.y);
    raycaster.setFromCamera(ndc, camara);
    const punto = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(plano, punto)) {
      const gx = Math.max(-GX / 2, Math.min(GX / 2 - 1, Math.round(punto.x - origen.x)));
      const gz = Math.max(-GZ / 2, Math.min(GZ / 2 - 1, Math.round(punto.z - origen.z)));
      // reconstruir ghost
      ghost.clear();
      const ok = !celdaOcupada(gx, gz, estado.item.nivel) && eco.estado.monedas >= precioDe(estado.item);
      const mat = ok ? ghostRey : ghostMal;
      const plantilla = estado.item.crear();
      plantilla.traverse(o => { if (o.isMesh) { o.material = mat; o.castShadow = false; } });
      ghost.add(plantilla);
      ghost.position.set(origen.x + gx, 0, origen.z + gz);
      ghost.rotation.y = estado.rot * PIE / 2;
      ghost.visible = true;
      estado.ghostCelda = { gx, gz, ok };
    }
  }

  function onPointerMove(e) {
    const r = e.target.getBoundingClientRect?.() || { left: 0, top: 0 };
    mouse.x = ((e.clientX - r.left) / window.innerWidth) * 2 - 1;
    mouse.y = -((e.clientY - r.top) / window.innerHeight) * 2 + 1;
    mouse.dentro = true;
  }
  function onClick(e) {
    if (!estado.activo || !estado.ghostCelda) return;
    const { gx, gz } = estado.ghostCelda;
    if (e.button === 2) demolerEn(gx, gz);
    else colocarEn(gx, gz);
  }
  function onKey(e) {
    if (!estado.activo) return;
    if (e.code === 'KeyR') estado.rot = (estado.rot + 1) % 4;
    if (e.code === 'KeyX' && estado.ghostCelda) demolerEn(estado.ghostCelda.gx, estado.ghostCelda.gz);
  }

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('mousedown', onClick);
  window.addEventListener('keydown', onKey);
  window.addEventListener('contextmenu', (e) => { if (estado.activo) e.preventDefault(); });

  return { estado, items, activar, desactivar, update, guardar, precioDe, origen, GX, GZ };
}
