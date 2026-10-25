// ============ ALICE CITY — Economía: minado, contratos, Alicoins ============
import * as THREE from 'three';
import { crearCristal } from './world.js';
import { ROLES } from './characters.js';
import { billetera } from './wallet.js';
import { emitir } from './eventos.js';

const rnd = (a, b) => a + Math.random() * (b - a);

function textoFlotante(escena, pos, texto, color = '#00F299') {
  const c = document.createElement('canvas'); c.width = 256; c.height = 96;
  const g = c.getContext('2d');
  g.font = '900 56px "Segoe UI", sans-serif'; g.textAlign = 'center';
  g.lineWidth = 10; g.strokeStyle = 'rgba(0,0,0,.65)'; g.strokeText(texto, 128, 62);
  g.fillStyle = color; g.fillText(texto, 128, 62);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
  s.scale.set(2, .75, 1); s.position.copy(pos); s.renderOrder = 20;
  escena.add(s);
  const ini = performance.now();
  const anima = () => {
    const k = (performance.now() - ini) / 1400;
    if (k >= 1) { escena.remove(s); s.material.map.dispose(); s.material.dispose(); return; }
    s.position.y = pos.y + k * 2.2;
    s.material.opacity = 1 - k * k;
    requestAnimationFrame(anima);
  };
  anima();
}

// ----- contratos -----
const CONTRATOS_BASE = [
  { id: 'entrega', titulo: '📦 Entrega exprés', desc: 'Lleva el paquete al Parque Sur y entrégalo en el punto marcado.', premio: 40, dest: 'parque' },
  { id: 'entrega2', titulo: '🏠 Materiales para obra', desc: 'Lleva materiales a tu Parcela del Norte.', premio: 35, dest: 'parcela' },
  { id: 'minar', titulo: '⛏️ Turno de mina', desc: 'Extrae 4 cristales en las Minas del Oeste.', premio: 55, dest: 'mina', tipo: 'minar', cantidad: 4 },
  { id: 'entrega3', titulo: '🍕 Reparto al centro', desc: 'Entrega el pedido en la Plaza Central.', premio: 30, dest: 'plaza' },
  { id: 'entrega4', titulo: '🛒 Compra del mercado', desc: 'Recoge el pedido en el Mercado del Este (tablero).', premio: 30, dest: 'tablero' },
];

const DEST_POS = {
  plaza: new THREE.Vector3(0, 0, 10),
  parque: new THREE.Vector3(0, 0, 58),
  parcela: new THREE.Vector3(-9, 0, -52),
  mina: new THREE.Vector3(-60, 0, 4),
  mercado: new THREE.Vector3(60, 0, 6),
  tablero: new THREE.Vector3(65.5, 0, 0),
};

export function crearEconomia(escena, mundo, jugador, ui, npcs = null) {
  const estado = {
    animo: 100,
    contrato: null,        // {def, progreso, destino}
    contratosHechos: 0,
    minadosTotal: 0,
    cerca: null,           // {tipo, ref, pos}
    get monedas() { return billetera.balance; },
  };

  // ----- cristales minables -----
  const cristales = [];
  const spawnCristal = () => {
    const c = crearCristal(Math.random() < .55 ? 0x00d1ff : 0x00F299);
    const a = rnd(0, 6.28), r = rnd(2, 12);
    c.position.set(-60 + Math.cos(a) * r, 0, Math.sin(a) * r);
    escena.add(c);
    const obj = { mesh: c, vivo: true, respawn: 0, valor: 5 + (Math.random() * 9 | 0) };
    cristales.push(obj);
    return obj;
  };
  for (let i = 0; i < 9; i++) spawnCristal();

  // ----- marcador de contrato -----
  const marcador = new THREE.Group();
  const anillo = new THREE.Mesh(new THREE.RingGeometry(.7, 1, 32),
    new THREE.MeshBasicMaterial({ color: 0x00F299, transparent: true, opacity: .85, side: THREE.DoubleSide }));
  anillo.rotation.x = -Math.PI / 2; anillo.position.y = .06; marcador.add(anillo);
  const flecha = new THREE.Mesh(new THREE.ConeGeometry(.4, .8, 4),
    new THREE.MeshStandardMaterial({ color: 0x00F299, emissive: 0x00F299, emissiveIntensity: .6 }));
  flecha.position.y = 2.4; flecha.rotation.x = Math.PI; marcador.add(flecha);
  marcador.visible = false; escena.add(marcador);

  // ----- helpers -----
  const bonusRol = () => ROLES[jugador.personaje.rol]?.bono || '';

  function ganar(n, pos, motivo = '') {
    let total = n;
    if (bonusRol() === 'mina' && motivo === 'mina') total = Math.round(n * 1.5);
    if (bonusRol() === 'contratos' && motivo === 'contrato') total = Math.round(n * 1.4);
    if (estado.animo >= 85 && motivo === 'mina') total = Math.round(total * 1.25);
    billetera.ganar(total, motivo === 'contrato' ? 'Contrato' : motivo === 'mina' ? 'Minado' : motivo);
    if (pos) textoFlotante(escena, pos.clone().add(new THREE.Vector3(0, 1.8, 0)), `+${total} ALC`);
    ui.actualizarHUD(estado);
    return total;
  }

  function contratosDisponibles() {
    return CONTRATOS_BASE.filter(c => !estado.contrato || estado.contrato.def.id !== c.id);
  }

  function aceptarContrato(id) {
    const def = CONTRATOS_BASE.find(c => c.id === id);
    if (!def || estado.contrato) return;
    estado.contrato = { def, progreso: 0 };
    marcador.visible = true;
    ui.toast(`📋 Contrato aceptado: ${def.titulo}`, 'cian');
    ui.pintarContratos(api, contratosDisponibles());
    ui.actualizarHUD(estado);
  }

  function completarContrato() {
    const { def } = estado.contrato;
    estado.contrato = null; marcador.visible = false;
    estado.contratosHechos++;
    ganar(def.premio, jugador.personaje.grupo.position, 'contrato');
    emitir('contrato', def.id);
    ui.toast(`✅ ¡Contrato completado! +${def.premio} ALC`, 'verde');
    ui.pintarContratos(api, contratosDisponibles());
    ui.actualizarHUD(estado);
  }

  // ----- interacción E -----
  function interactuar() {
    if (!estado.cerca) return;
    const { tipo, ref } = estado.cerca;
    if (tipo === 'cristal' && ref.vivo) {
      ref.vivo = false; ref.respawn = rnd(16, 26);
      ref.mesh.scale.setScalar(.01);
      estado.minadosTotal++;
      emitir('minar', 1);
      if (estado.contrato && estado.contrato.def.tipo === 'minar') {
        estado.contrato.progreso++;
        if (estado.contrato.progreso >= estado.contrato.def.cantidad) completarContrato();
        else ui.toast(`⛏️ Cristal extraído (${estado.contrato.progreso}/${estado.contrato.def.cantidad})`, 'cian');
      }
      estado.animo = Math.max(30, estado.animo - 3);
      ganar(ref.valor, ref.mesh.position, 'mina');
      ui.actualizarHUD(estado);
    }
    if (tipo === 'banco') {
      // sentarse a relajar: coloca al jugador en el banco
      const b = estado.cerca.pos;
      jugador.personaje.grupo.position.set(b.x, 0, b.z + .12);
      jugador.personaje.grupo.rotation.y = Math.atan2(-b.x, -b.z);
      jugador.personaje.setEstado('sit');
      estado.relajando = true;
      emitir('relax', 1);
      ui.toast('😎 Relajando… el ánimo sube. Muévete para levantarte', 'cian');
    }
    if (tipo === 'contrato' && estado.contrato) {
      const d = estado.contrato.def;
      if (d.tipo === 'minar') { ui.toast(`⛏️ Te faltan ${d.cantidad - estado.contrato.progreso} cristales`, 'cian'); return; }
      completarContrato();
    }
    if (tipo === 'npc' && ref?.hablar) {
      ref.hablar();
      emitir('dialogo', ref.nombre);
    }
  }

  // ----- detección de cercanía -----
  function detectarCercania() {
    const p = jugador.personaje.grupo.position;
    let mejor = null, mejorD = 3.2;
    for (const c of cristales) {
      if (!c.vivo) continue;
      const d = c.mesh.position.distanceTo(p);
      if (d < mejorD) { mejorD = d; mejor = { tipo: 'cristal', ref: c, pos: c.mesh.position }; }
    }
    if (!mejor) {
      for (const [x, z] of mundo.bancosPos) {
        const d = Math.hypot(x - p.x, z - p.z);
        if (d < 2.2 && !estado.relajando) { mejor = { tipo: 'banco', pos: new THREE.Vector3(x, 0, z) }; break; }
      }
    }
    if (!mejor && estado.contrato) {
      const pos = DEST_POS[estado.contrato.def.dest];
      if (pos && Math.hypot(pos.x - p.x, pos.z - p.z) < 3) mejor = { tipo: 'contrato', pos };
    }
    if (!mejor && npcs) {
      for (const n of npcs.npcs) {
        const d = n.pj.grupo.position.distanceTo(p);
        if (d < 2.6) { mejor = { tipo: 'npc', ref: n, pos: n.pj.grupo.position }; break; }
      }
    }
    estado.cerca = mejor;
    ui.mostrarPrompt(mejor ? {
      cristal: 'Minar cristal', banco: 'Sentarse a relajar', contrato: 'Completar contrato',
      npc: `Hablar con ${mejor.ref?.nombre || 'el agente'}`,
    }[mejor.tipo] : null);
  }

  // ----- update -----
  function update(dt, t) {
    // respawns
    for (const c of cristales) {
      if (!c.vivo) {
        c.respawn -= dt;
        if (c.respawn <= 0) {
          c.vivo = true;
          const a = rnd(0, 6.28), r = rnd(2, 12);
          c.mesh.position.set(-60 + Math.cos(a) * r, 0, Math.sin(a) * r);
          c.mesh.scale.setScalar(1);
          c.valor = 5 + (Math.random() * 9 | 0);
        }
      } else {
        c.mesh.rotation.y += dt * .8;
        c.mesh.position.y = Math.sin(t * 2 + c.mesh.position.x) * .06;
      }
    }
    // marcador de contrato
    if (estado.contrato) {
      const pos = DEST_POS[estado.contrato.def.dest];
      marcador.position.set(pos.x, 0, pos.z);
      anillo.scale.setScalar(1 + Math.sin(t * 4) * .12);
      flecha.position.y = 2.2 + Math.sin(t * 4) * .25;
    }
    // relajación en banco
    if (estado.relajando) {
      const d = jugador.personaje.grupo.position;
      // si el jugador se mueve, se levanta
      if (jugador.estado.moviendose) {
        estado.relajando = false;
        jugador.personaje.setEstado('idle');
      } else {
        estado.animo = Math.min(100, estado.animo + dt * (bonusRol() === 'animo' ? 8 : 4));
        ui.actualizarHUD(estado);
      }
    } else {
      estado.animo = Math.max(20, estado.animo - dt * .35);
    }
    detectarCercania();
  }

  function gastar(n, motivo = 'tienda') {
    const ok = billetera.gastar(n, motivo);
    ui.actualizarHUD(estado);
    return ok;
  }
  function reembolsar(n) {
    billetera.ganar(n, 'Reembolso de obra');
    ui.actualizarHUD(estado);
  }
  const bonusObra = () => bonusRol() === 'obra';

  const api = {
    estado, update, interactuar, ganar, aceptarContrato, contratosDisponibles, completarContrato,
    DEST_POS, textoFlotante, gastar, reembolsar, bonusObra, ui, cristales,
  };
  return api;
}
