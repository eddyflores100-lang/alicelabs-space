// ============ ALICE CITY — Núcleo del juego ============
import * as THREE from 'three';
import { crearMundo } from './world.js';
import { crearNPCs } from './npc.js';
import { crearPersonaje } from './characters.js';
import { crearJugador } from './player.js';
import { crearEconomia } from './economy.js';
import { crearConstructor } from './builder.js';
import { crearUI } from './ui.js';
import { sfx } from './sfx.js';

const $ = (id) => document.getElementById(id);

// ---------- renderer ----------
const canvas = $('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const escena = new THREE.Scene();
const camara = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, .1, 600);

addEventListener('resize', () => {
  camara.aspect = innerWidth / innerHeight;
  camara.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ---------- UI ----------
const ui = crearUI();

// ---------- carga por pasos ----------
const pasos = [
  ['Levantando el cielo y el sol…', () => {}],
  ['Construyendo la Plaza Central…', () => { mundo = crearMundo(escena); }],
  ['Despertando a los 24 agentes…', () => { npcs = crearNPCs(escena, mundo); }],
  ['Colocando cristales y contratos…', () => { economia = crearEconomia(escena, mundo, jugador, ui); }],
  ['Abriendo tu parcela del norte…', () => { builder = crearConstructor(escena, mundo.parcelas.jugador, economia); }],
  ['¡Listo! Bienvenido a ALICE CITY', () => { conectarUI(); }],
];
let pasoIdx = 0, mundo = null, npcs = null, economia = null, builder = null, jugador = null;

// jugador se crea antes de la economía (necesaria por ella)
function crearJugadorAhora() {
  const cfg = ui.estado.cfg;
  const pj = crearPersonaje(cfg);
  jugador = crearJugador(escena, camara, canvas, pj, new THREE.Vector3(0, 0, 14));
  ui.estado.onGuardarPersonaje = (nuevo) => {
    // reemplazar personaje conservando posición
    const pos = jugador.personaje.grupo.position.clone();
    const rot = jugador.personaje.grupo.rotation.y;
    escena.remove(jugador.personaje.grupo);
    const npj = crearPersonaje(nuevo);
    npj.grupo.position.copy(pos); npj.grupo.rotation.y = rot;
    jugador.personaje = npj;
    escena.add(npj.grupo);
  };
}

const progreso = () => {
  const p = pasoIdx / pasos.length;
  $('load-fill').style.width = `${Math.round(p * 100)}%`;
  $('load-tip').textContent = pasos[Math.min(pasoIdx, pasos.length - 1)][0];
};
progreso();

function siguientePaso() {
  if (pasoIdx === 1) crearJugadorAhora(); // jugador antes del mundo
  const [, fn] = pasos[pasoIdx];
  try { fn(); } catch (err) {
    console.error('Error cargando paso', pasoIdx, err);
    $('load-tip').textContent = 'Error: ' + err.message;
    return;
  }
  pasoIdx++;
  progreso();
  if (pasoIdx < pasos.length) setTimeout(siguientePaso, 220);
  else setTimeout(() => {
    $('loading').classList.add('hidden');
    ui.mostrar('lobby');
  }, 420);
}
setTimeout(siguientePaso, 350);

// ---------- conexión UI <-> juego ----------
let modo = 'lobby'; // lobby | juego | construir
function conectarUI() {
  window.__alice = { get camara() { return camara; }, get npcs() { return npcs; }, get jugador() { return jugador; }, get economia() { return economia; }, get builder() { return builder; }, get modo() { return modo; }, ui };
  // monedas persistidas
  economia.estado.monedas = parseInt(localStorage.getItem('alice_monedas') || '0', 10) || 0;
  const guardarMonedas = () => localStorage.setItem('alice_monedas', String(economia.estado.monedas));
  setInterval(guardarMonedas, 4000);

  ui.estado.onJugar = () => { modo = 'juego'; ui.irAJuego(); };
  ui.estado.onLobby = () => { modo = 'lobby'; ui.irALobby(); };
  ui.estado.onAgentes = () => {
    ui.mostrar('panel-agentes');
    ui.pintarAgentes(npcs.npcs);
    refrescoAgentes();
  };
  ui.estado.onContratos = () => {
    ui.mostrar('panel-contratos');
    ui.pintarContratos(economia, economia.contratosDisponibles());
  };
  ui.estado.onTerminarObra = () => salirConstructor();
  ui.construir();
  ui.pintarCatalogo(builder.items, builder.precioDe, (it) => { builder.estado.item = it; });

  // teclas globales
  addEventListener('keydown', (e) => {
    if (modo === 'lobby') return;
    if (e.code === 'KeyE') {
      economia.interactuar();
      if (economia.estado.cerca?.tipo === 'cristal') sfx.minar();
    }
    if (e.code === 'KeyB') {
      const p = jugador.personaje.grupo.position;
      const cerca = Math.hypot(p.x - builder.origen.x, p.z - builder.origen.z) < 11;
      if (cerca && modo === 'juego') entrarConstructor();
      else if (modo === 'construir') salirConstructor();
      else if (!cerca) ui.toast('🏠 Ve a TU PARCELA (norte) para construir', 'cian');
    }
    if (e.code === 'Escape') { ui.mostrar('menu'); }
  });
  ui.actualizarHUD(economia.estado);
  ui.toast('🎯 Completa contratos y construye tu casa en la parcela norte', 'verde');
}

function entrarConstructor() {
  modo = 'construir';
  ui.mostrar('builder-ui');
  builder.activar();
  ui.toast('🏗️ Modo construir: elige piezas abajo', 'verde');
  sfx.pop();
}
function salirConstructor() {
  modo = 'juego';
  ui.mostrar('builder-ui', false);
  builder.desactivar();
  ui.actualizarHUD(economia.estado);
}

let timerAgentes = null;
function refrescoAgentes() {
  clearInterval(timerAgentes);
  timerAgentes = setInterval(() => {
    if ($('panel-agentes').classList.contains('hidden')) { clearInterval(timerAgentes); return; }
    ui.pintarAgentes(npcs.npcs);
  }, 900);
}

// ---------- zonas ----------
const ZONAS_LABEL = [
  ['Plaza Central', 0, 0, 20], ['Minas del Oeste', -60, 0, 18], ['Mercado del Este', 60, 0, 18],
  ['Parque Sur', 0, 60, 16], ['Parcela del Norte', 0, -60, 20],
];
function zonaActual(p) {
  for (const [n, x, z, r] of ZONAS_LABEL) {
    if (Math.hypot(p.x - x, p.z - z) < r) return n;
  }
  return 'Las calles de Alice City';
}

// ---------- bucle ----------
const reloj = new THREE.Clock();
let tLobby = 0;

function animate() {
  requestAnimationFrame(animate);
  try {
  const dt = Math.min(reloj.getDelta(), .05);
  const t = reloj.elapsedTime;

  if (mundo) for (const f of mundo.animables) f(t);
  if (npcs) npcs.update(dt, t);

  if (modo === 'lobby' || !jugador) {
    // cámara cinematográfica orbitando la ciudad
    tLobby += dt * .12;
    const r = 34;
    camara.position.set(Math.cos(tLobby) * r, 13 + Math.sin(tLobby * .6) * 3, Math.sin(tLobby) * r);
    camara.lookAt(0, 2, 0);
    if (jugador) jugador.personaje.update(t, false);
  } else if (modo === 'juego' || modo === 'construir') {
    jugador.estado.activo = !ui.seguirNPC;
    if (ui.seguirNPC !== null) {
      const npc = npcs.npcs.find(n => n.id === ui.seguirNPC);
      if (npc) jugador.seguir(npc.pj.grupo.position);
    } else {
      jugador.update(dt, t, { minX: -110, maxX: 110, minZ: -110, maxZ: 110 });
      if (economia) economia.update(dt, t);
      if (modo === 'construir' && builder) builder.update(camara, canvas);
      ui.setZona(zonaActual(jugador.personaje.grupo.position));
    }
  }

  renderer.render(escena, camara);
  } catch (err) {
    window.__err = (window.__err || 0) + 1;
    window.__errMsg = err.message + ' @ ' + (err.stack || '').split('\n')[1];
  }
}
animate();
