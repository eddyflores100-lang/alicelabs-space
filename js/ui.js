// ============ ALICE CITY — UI: lobby, HUD, paneles, editor, tienda ============
import * as THREE from 'three';
import { ROLES, PIEL, CAMISETAS, PANTALONES, PELOS, PELO_ESTILOS, TIENDA, crearPersonaje, personajeAleatorio } from './characters.js';
import { ETIQUETAS_ESTADO } from './npc.js';
import { billetera } from './wallet.js';
import { sfx } from './sfx.js';

const $ = (id) => document.getElementById(id);
const fmt = (n) => n.toLocaleString('es');

export function crearUI() {
  const estado = {
    cfg: JSON.parse(localStorage.getItem('alice_agente') || 'null') || personajeAleatorio({ nombre: 'Zolo' }),
    guardarCfg() { localStorage.setItem('alice_agente', JSON.stringify(this.cfg)); },
  };

  // ---------- toasts ----------
  function toast(msg, tipo = 'verde') {
    const t = document.createElement('div');
    t.className = `toast ${tipo === 'verde' ? '' : tipo}`;
    t.textContent = msg;
    $('toasts').appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  // ---------- pantallas ----------
  const mostrar = (id, on = true) => $(id).classList.toggle('hidden', !on);

  function irALobby() {
    mostrar('lobby'); mostrar('hud', false); mostrar('builder-ui', false);
    mostrar('panel-agentes', false); mostrar('panel-contratos', false);
    mostrar('panel-tareas', false); mostrar('panel-billetera', false);
    mostrar('menu', false); mostrar('como', false); mostrar('editor', false);
    $('lobby-monedas').textContent = fmt(estado.monedasJuego || 0);
    if (estado.onRefrescoLobby) estado.onRefrescoLobby();
  }
  function irAJuego() {
    mostrar('lobby', false); mostrar('hud'); sfx.pop();
  }

  // ---------- HUD ----------
  function actualizarHUD(eco) {
    estado.monedasJuego = eco.monedas;
    $('hud-monedas').textContent = fmt(eco.monedas);
    $('hud-animo').textContent = Math.round(eco.animo);
    $('lobby-monedas').textContent = fmt(eco.monedas);
    $('builder-monedas').textContent = fmt(eco.monedas);
    $('wal-saldo').textContent = fmt(billetera.balance);
    const badge = $('hud-badge');
    if (eco.contrato) { badge.textContent = '1'; badge.classList.add('on'); }
    else badge.classList.remove('on');
    if (estado.onRefrescoLobby) estado.onRefrescoLobby();
  }
  function setZona(txt) { $('hud-zona').textContent = '📍 ' + txt; }
  function mostrarPrompt(txt) {
    if (!txt) { mostrar('prompt', false); return; }
    $('prompt-texto').textContent = txt; mostrar('prompt');
  }

  // ---------- panel tareas ----------
  function pintarTareas(tareasApi) {
    const lista = $('lista-tareas');
    lista.innerHTML = '';
    for (const t of tareasApi.TAREAS) {
      const prog = tareasApi.estado.progreso[t.id] || 0;
      const hecha = !!tareasApi.estado.reclamadas[t.id];
      const completa = prog >= t.meta;
      const pct = Math.min(100, Math.round((prog / t.meta) * 100));
      const div = document.createElement('div');
      div.className = 'tarjeta-tarea' + (hecha ? ' hecha' : completa ? ' lista' : '');
      div.innerHTML = `
        <div class="tt-head"><span class="tt-ico">${t.ico}</span><span class="tt-titulo">${t.titulo}</span><span class="tt-premio">+${t.premio} ALC</span></div>
        <div class="tt-desc">${t.desc}</div>
        <div class="tt-barra"><div style="width:${pct}%"></div></div>
        <div class="tt-pie">${hecha ? '✅ RECLAMADA' : completa ? '¡LISTA PARA RECLAMAR!' : `${prog}/${t.meta}`}</div>`;
      if (completa && !hecha) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-mini btn-verde tt-reclamar';
        btn.textContent = '🪙 RECLAMAR';
        btn.onclick = () => { tareasApi.reclamar(t.id); pintarTareas(tareasApi); toast(`🎉 Tarea completada: +${t.premio} ALC`, 'verde'); };
        div.appendChild(btn);
      }
      lista.appendChild(div);
    }
  }

  // ---------- panel billetera ----------
  function pintarBilletera() {
    $('wal-saldo').textContent = fmt(billetera.balance);
    $('wal-addr').textContent = billetera.estado.addr.slice(0, 16) + '…' + billetera.estado.addr.slice(-6);
    const hist = $('wal-historial');
    hist.innerHTML = '';
    if (!billetera.estado.historial.length) {
      hist.innerHTML = '<div class="hist-vacio">Sin movimientos aún. ¡Ve a minar o acepta un contrato!</div>';
    }
    for (const h of billetera.estado.historial.slice(0, 10)) {
      const d = document.createElement('div');
      d.className = 'hist-item';
      const fecha = new Date(h.ts).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
      d.innerHTML = `<span class="hist-mot">${h.motivo}</span><span class="hist-fecha">${fecha}</span><span class="hist-cant ${h.signo === '+' ? 'pos' : 'neg'}">${h.signo}${fmt(h.n)}</span>`;
      hist.appendChild(d);
    }
  }

  // ---------- panel agentes ----------
  let seguirNPC = null;
  function pintarAgentes(npcs) {
    const lista = $('lista-agentes');
    lista.innerHTML = '';
    for (const n of npcs) {
      const div = document.createElement('div');
      div.className = 'tarjeta-agente';
      div.innerHTML = `
        <div class="avatar">${ROLES[n.rol].emoji}</div>
        <div class="info">
          <div class="nom">${n.nombre} <span style="color:#9fb4ad;font-weight:600">de ${n.dueño}</span></div>
          <div class="est">${ROLES[n.rol].nombre} · <b>${n.etiqueta()}</b></div>
        </div>
        <button class="btn btn-mini ${seguirNPC === n.id ? 'btn-verde' : 'btn-cian'}">${seguirNPC === n.id ? '● SIGUIENDO' : 'SEGUIR'}</button>`;
      div.querySelector('button').onclick = () => {
        sfx.click();
        seguirNPC = seguirNPC === n.id ? null : n.id;
        pintarAgentes(npcs);
        toast(seguirNPC !== null ? `🎥 Observando a ${n.nombre} en vivo` : '🎥 Cámara libre', 'cian');
      };
      lista.appendChild(div);
    }
  }

  // ---------- panel contratos ----------
  function pintarContratos(eco, disponibles) {
    const lista = $('lista-contratos');
    lista.innerHTML = '';
    const activo = eco.estado ? eco.estado.contrato : eco.contrato;
    const eEstado = eco.estado || eco;
    if (activo) {
      const c = activo.def;
      const div = document.createElement('div');
      div.className = 'tarjeta-contrato activa';
      div.innerHTML = `
        <div class="ct">${c.titulo} · ACTIVO</div>
        <div class="cd">${c.desc} ${c.tipo === 'minar' ? `(${activo.progreso}/${c.cantidad})` : ''}</div>
        <div class="cf"><span class="premio">+${c.premio} 💰</span><span style="font-size:11px;color:#9fb4ad">ve al punto marcado</span></div>`;
      lista.appendChild(div);
    }
    for (const c of disponibles) {
      const div = document.createElement('div');
      div.className = 'tarjeta-contrato';
      div.innerHTML = `
        <div class="ct">${c.titulo}</div>
        <div class="cd">${c.desc}</div>
        <div class="cf"><span class="premio">+${c.premio} 💰</span><button class="btn btn-mini btn-verde">ACEPTAR</button></div>`;
      div.querySelector('button').onclick = () => {
        eco.aceptarContrato(c.id);
        mostrar('panel-contratos', false);
      };
      lista.appendChild(div);
    }
    if (!activo && disponibles.length === 0) {
      lista.innerHTML = '<div style="color:#9fb4ad;font-size:13px;padding:20px;text-align:center">No hay contratos disponibles ahora mismo. Vuelve más tarde.</div>';
    }
  }

  // ---------- editor de personaje ----------
  let edRenderer = null, edEscena = null, edCamara = null, edPJ = null, edGirando = false, edUX = 0;
  function iniciarEditor() {
    const canvas = $('editor-canvas');
    if (!edRenderer) {
      edRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      edRenderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      edRenderer.shadowMap.enabled = true;
      edEscena = new THREE.Scene();
      edCamara = new THREE.PerspectiveCamera(40, 1, .1, 50);
      edCamara.position.set(0, 1.15, 3.1); edCamara.lookAt(0, .8, 0);
      edEscena.add(new THREE.HemisphereLight(0xcfeaff, 0x7cc952, 1.2));
      const sol = new THREE.DirectionalLight(0xfff2d8, 2.4);
      sol.position.set(2, 4, 3); sol.castShadow = true; edEscena.add(sol);
      // podio
      const podio = new THREE.Mesh(new THREE.CylinderGeometry(.9, 1.05, .18, 28),
        new THREE.MeshStandardMaterial({ color: 0x00d1ff, roughness: .4 }));
      podio.position.y = .09; podio.receiveShadow = true; edEscena.add(podio);
      const anillo = new THREE.Mesh(new THREE.TorusGeometry(1.25, .04, 8, 40),
        new THREE.MeshStandardMaterial({ color: 0x00F299, emissive: 0x00F299, emissiveIntensity: .8 }));
      anillo.rotation.x = Math.PI / 2; anillo.position.y = .05; edEscena.add(anillo);
      canvas.addEventListener('pointerdown', (e) => { edGirando = true; edUX = e.clientX; });
      window.addEventListener('pointerup', () => { edGirando = false; });
      window.addEventListener('pointermove', (e) => {
        if (edGirando && edPJ) { edPJ.grupo.rotation.y += (e.clientX - edUX) * .01; edUX = e.clientX; }
      });
    }
    refrescarEditor();
    const loopEd = (t) => {
      if ($('editor').classList.contains('hidden')) return;
      requestAnimationFrame(loopEd);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (canvas.width !== w || canvas.height !== h) edRenderer.setSize(w, h, false);
      if (edPJ) edPJ.update(t / 1000, false);
      edRenderer.render(edEscena, edCamara);
    };
    requestAnimationFrame(loopEd);
  }

  function refrescarEditor() {
    const cfg = estado.cfg;
    if (!cfg.accesorios) cfg.accesorios = { sombrero: 'ninguno', gafas: 'ninguno', espalda: 'ninguno', capa: 'ninguna' };
    if (!cfg.posee) cfg.posee = ['ninguno', 'ninguna'];
    if (edPJ) edEscena.remove(edPJ.grupo);
    edPJ = crearPersonaje(cfg);
    edPJ.grupo.position.y = .18;
    edEscena.add(edPJ.grupo);
    $('editor-rol-nombre').textContent = ROLES[cfg.rol].emoji + ' ' + ROLES[cfg.rol].nombre;
    $('ed-nombre').value = cfg.nombre || '';
    $('editor-stats').innerHTML = `
      <div>Rol: <b>${ROLES[cfg.rol].nombre}</b></div>
      <div>Bono: <b>${ROLES[cfg.rol].desc}</b></div>`;
    // sel visual
    document.querySelectorAll('#ed-roles .pill').forEach(p => p.classList.toggle('sel', p.dataset.v === cfg.rol));
    selDe('ed-piel', cfg.piel); selDe('ed-camiseta', cfg.camiseta);
    selDe('ed-pantalon', cfg.pantalon); selDe('ed-pelo-color', cfg.peloColor);
    document.querySelectorAll('#ed-pelo .pill').forEach(p => p.classList.toggle('sel', p.dataset.v === cfg.peloEstilo));
    for (const slot of Object.keys(TIENDA)) {
      document.querySelectorAll(`#ed-${slot} .acc-pill`).forEach(p => {
        p.classList.toggle('sel', p.dataset.v === cfg.accesorios[slot]);
      });
    }
  }
  const selDe = (id, val) => document.querySelectorAll(`#${id} .swatch`).forEach(s => s.classList.toggle('sel', s.dataset.v === val));

  function construirOpciones() {
    $('ed-roles').innerHTML = Object.entries(ROLES).map(([k, r]) =>
      `<div class="pill" data-v="${k}">${r.emoji} ${r.nombre}</div>`).join('');
    $('ed-piel').innerHTML = PIEL.map(c => `<div class="swatch" data-v="${c}" style="background:${c}"></div>`).join('');
    $('ed-camiseta').innerHTML = CAMISETAS.map(c => `<div class="swatch" data-v="${c}" style="background:${c}"></div>`).join('');
    $('ed-pantalon').innerHTML = PANTALONES.map(c => `<div class="swatch" data-v="${c}" style="background:${c}"></div>`).join('');
    $('ed-pelo').innerHTML = PELO_ESTILOS.map(e => `<div class="pill" data-v="${e}">${e}</div>`).join('');
    $('ed-pelo-color').innerHTML = PELOS.map(c => `<div class="swatch" data-v="${c}" style="background:${c}"></div>`).join('');

    // tienda de accesorios (4 slots)
    const NOMBRES_SLOT = { sombrero: '🧢 SOMBRERO', gafas: '🕶️ GAFAS', espalda: '🎒 ESPALDA', capa: '🦸 CAPA' };
    for (const slot of Object.keys(TIENDA)) {
      const cont = $(`ed-${slot}`);
      cont.innerHTML = TIENDA[slot].map(it => {
        const posee = it.precio === 0 || (estado.cfg.posee || []).includes(it.id);
        return `<div class="acc-pill" data-v="${it.id}" data-slot="${slot}">
          <span>${it.nombre}</span>
          ${posee ? '<b class="acc-ok">✓</b>' : `<b class="acc-precio">${it.precio} ALC</b>`}
        </div>`;
      }).join('');
      cont.onclick = (e) => {
        const pill = e.target.closest('.acc-pill');
        if (!pill) return;
        const id = pill.dataset.v, slot2 = pill.dataset.slot;
        const item = TIENDA[slot2].find(o => o.id === id);
        if (!item) return;
        const posee = item.precio === 0 || (estado.cfg.posee || []).includes(item.id);
        if (!posee) {
          if (!billetera.gastar(item.precio, 'tienda')) {
            toast(`🪙 Te faltan Alicoins: ${item.nombre} cuesta ${item.precio}. ¡Completa tareas!`, 'rojo-suave');
            sfx.romper();
            return;
          }
          estado.cfg.posee = [...(estado.cfg.posee || []), item.id];
          toast(`🛍️ ¡${item.nombre} comprado! −${item.precio} ALC`, 'verde');
          sfx.victoria();
        }
        estado.cfg.accesorios[slot2] = id;
        estado.guardarCfg();
        refrescarEditor();
        sfx.click();
      };
    }

    const on = (id, ev, fn) => $(id).addEventListener(ev, fn);
    const set = (k, v) => { estado.cfg[k] = v; refrescarEditor(); sfx.click(); };
    $('ed-roles').onclick = (e) => { if (e.target.dataset.v) set('rol', e.target.dataset.v); };
    $('ed-piel').onclick = (e) => { if (e.target.dataset.v) set('piel', e.target.dataset.v); };
    $('ed-camiseta').onclick = (e) => { if (e.target.dataset.v) set('camiseta', e.target.dataset.v); };
    $('ed-pantalon').onclick = (e) => { if (e.target.dataset.v) set('pantalon', e.target.dataset.v); };
    $('ed-pelo').onclick = (e) => { if (e.target.dataset.v) set('peloEstilo', e.target.dataset.v); };
    $('ed-pelo-color').onclick = (e) => { if (e.target.dataset.v) set('peloColor', e.target.dataset.v); };
    $('ed-nombre').addEventListener('input', (e) => { estado.cfg.nombre = e.target.value; });
    on('ed-aleatorio', 'click', () => { estado.cfg = personajeAleatorio({ nombre: estado.cfg.nombre }); refrescarEditor(); sfx.pop(); });
    on('ed-guardar', 'click', () => {
      estado.cfg.nombre = $('ed-nombre').value.trim() || 'Zolo';
      estado.guardarCfg();
      if (estado.onGuardarPersonaje) estado.onGuardarPersonaje({ ...estado.cfg });
      mostrar('editor', false);
      toast(`💾 Agente ${estado.cfg.nombre} guardado`, 'verde');
      sfx.victoria();
    });
  }

  // ---------- catálogo del constructor ----------
  function pintarCatalogo(items, precioDe, onSel) {
    const cat = $('builder-catalogo');
    cat.innerHTML = '';
    items.forEach((it, i) => {
      const d = document.createElement('div');
      d.className = 'item-cat' + (i === 1 ? ' sel' : '');
      d.innerHTML = `<div class="ico">${it.ico}</div><div class="nom">${it.nombre}</div><div class="prejo"></div>`;
      const pre = d.querySelector('.prejo');
      pre.className = 'pre'; pre.textContent = precioDe(it) + ' 💰';
      d.onclick = () => {
        document.querySelectorAll('.item-cat').forEach(x => x.classList.remove('sel'));
        d.classList.add('sel'); onSel(it); sfx.click();
      };
      cat.appendChild(d);
    });
  }

  function construir() {
    construirOpciones();
    // botones lobby
    $('btn-jugar').onclick = () => { sfx.click(); if (estado.onJugar) estado.onJugar(); };
    $('btn-editor').onclick = () => { sfx.click(); mostrar('editor'); iniciarEditor(); };
    $('btn-agentes-lobby').onclick = () => { sfx.click(); if (estado.onAgentes) estado.onAgentes(); };
    $('btn-como').onclick = () => { sfx.click(); mostrar('como'); };
    // botones hud
    $('hud-agentes').onclick = () => { sfx.click(); if (estado.onAgentes) estado.onAgentes(); };
    $('hud-contratos').onclick = () => { sfx.click(); if (estado.onContratos) estado.onContratos(); };
    $('hud-tareas').onclick = () => { sfx.click(); if (estado.onTareas) estado.onTareas(); };
    $('hud-billetera').onclick = () => { sfx.click(); if (estado.onBilletera) estado.onBilletera(); };
    $('hud-menu').onclick = () => { sfx.click(); mostrar('menu'); };
    // cierres
    $('cerrar-agentes').onclick = () => mostrar('panel-agentes', false);
    $('cerrar-contratos').onclick = () => mostrar('panel-contratos', false);
    $('cerrar-tareas').onclick = () => mostrar('panel-tareas', false);
    $('cerrar-billetera').onclick = () => mostrar('panel-billetera', false);
    $('cerrar-editor').onclick = () => mostrar('editor', false);
    $('cerrar-como').onclick = () => mostrar('como', false);
    $('cerrar-menu').onclick = () => mostrar('menu', false);
    // menú
    $('menu-editor').onclick = () => { mostrar('menu', false); mostrar('editor'); iniciarEditor(); };
    $('menu-agentes').onclick = () => { mostrar('menu', false); if (estado.onAgentes) estado.onAgentes(); };
    $('menu-tareas').onclick = () => { mostrar('menu', false); if (estado.onTareas) estado.onTareas(); };
    $('menu-billetera').onclick = () => { mostrar('menu', false); if (estado.onBilletera) estado.onBilletera(); };
    $('menu-como').onclick = () => { mostrar('menu', false); mostrar('como'); };
    $('menu-lobby').onclick = () => { mostrar('menu', false); if (estado.onLobby) estado.onLobby(); };
    $('builder-terminar').onclick = () => { if (estado.onTerminarObra) estado.onTerminarObra(); };
  }

  return {
    estado, toast, construir, irALobby, irAJuego, actualizarHUD, setZona, mostrarPrompt,
    pintarAgentes, pintarContratos, pintarTareas, pintarBilletera, iniciarEditor, pintarCatalogo, mostrar,
    sonido: (n) => sfx[n]?.(),
    get seguirNPC() { return seguirNPC; }, set seguirNPC(v) { seguirNPC = v; },
  };
}
