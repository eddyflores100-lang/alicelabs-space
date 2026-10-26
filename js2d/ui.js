// ============================================================
// ALICE CITY v5 — UI CENTRO DE MANDO
// Menú izquierdo · chat de agentes · HUD · tareas · tienda ·
// billetera ALC · registros
// ============================================================
import { G, addCoins, spendCoins, saveState, sfx, beep, audioInit, onCoinsChange, faseDia } from './engine.js';
import { player, npcs } from './agents.js';
import { MAPS, getCurrent } from './maps.js';
import { spots } from './city.js';

// ---------------- TAREAS (8) ----------------
export const QUESTS = [
  { id: 'P1', t: 'Patrulla de la Plaza', d: 'Recorre los 3 puntos marcados de la Plaza Central.', alc: 12, spots: ['q1a', 'q1b', 'q1c'], giver: null },
  { id: 'P2', t: 'Reporte al Data Hub', d: 'Habla con Nova frente al DATA HUB y entrega el reporte.', alc: 10, npc: 'Nova', giver: 'Nova' },
  { id: 'P3', t: 'Entrega urgente: Neural Core', d: 'Lleva el paquete hasta la puerta del NEURAL CORE.', alc: 15, spots: ['doorNeural'], giver: 'Bella' },
  { id: 'P4', t: 'Inventario Mercado-Logística', d: 'Pasa por el MERCADO y cierra el conteo en LOGÍSTICA.', alc: 14, spots: ['doorMercado', 'doorLogistica'], giver: 'Rex' },
  { id: 'P5', t: 'Inspección de semáforos', d: 'Verifica los cruces NW y SE del anillo vial.', alc: 12, spots: ['q5a', 'q5b'], giver: null },
  { id: 'P6', t: 'Reunión en la Torre Alice', d: 'Entra al HQ y habla con la Jefa Vega en la sala de conferencias.', alc: 20, giver: 'Ada', oculta: true },
  { id: 'P7', t: 'Turno en el Server Room', d: 'Activa los 3 racks del server room del HQ (tecla E).', alc: 18, giver: 'Ada', oculta: true },
  { id: 'P8', t: 'Ronda del cinturón', d: 'Ronda completa por las 4 esquinas del cinturón verde.', alc: 25, spots: ['q8a', 'q8b', 'q8c', 'q8d'], giver: null },
  { id: 'P9', t: 'Puertas de la ciudad', d: 'Visita las puertas de DATA HUB, ANALYSIS y SRV-7.', alc: 15, spots: ['doorHub', 'doorAnalysis', 'doorSrv'], giver: null },
  { id: 'P10', t: 'Vida de vecino', d: 'Visita la CASA-7, la CASA-12 y tu APTO del distrito Mercado.', alc: 20, spots: ['doorCasa7', 'doorCasa12', 'doorApto'], giver: null },
  { id: 'P11', t: 'Rutina de barrio', d: 'Pasa por la CAFETERÍA, el GYM NEÓN y las RESIDENCIAS.', alc: 22, spots: ['doorCafe', 'doorGym', 'doorResid'], giver: null },
  { id: 'P12', t: 'Paseo en el Parque Sur', d: 'Recorre los 3 puntos del Parque Sur de la metrópoli.', alc: 15, spots: ['q12a', 'q12b', 'q12c'], giver: null }
];

export function qEstado(id) {
  if (!G.quests[id]) {
    const q = QUESTS.find(x => x.id === id);
    if (q && q.oculta) return G.v5hq ? 'disponible' : 'oculta';
    return 'disponible';
  }
  return G.quests[id].estado; // activa | lista | hecha
}
export function aceptarQuest(id) {
  if (qEstado(id) !== 'disponible') return false;
  const q = QUESTS.find(x => x.id === id);
  G.quests[id] = { estado: 'activa', paso: 0 };
  saveState();
  pushLog(`Misión aceptada: ${q.t} (+${q.alc} ALC)`, 'cian');
  toast(`Misión: ${q.t}`);
  renderTareas();
  sfx.ui();
  return true;
}
export function completarQuest(id) {
  const st = G.quests[id];
  if (!st || st.estado !== 'activa') return false;
  const q = QUESTS.find(x => x.id === id);
  st.estado = 'hecha';
  addCoins(q.alc, 'Misión: ' + q.t);
  G.energia = Math.min(100, G.energia + 4);
  saveState();
  sfx.tarea();
  pushLog(`MISIÓN COMPLETADA: ${q.t} · +${q.alc} ALC`, 'verde');
  toast(`+${q.alc} ALC · ${q.t}`);
  chatPush('Beta-3', `Buen trabajo, operador. "${q.t}" confirmada por el hub.`, '#7ae7ff');
  renderTareas();
  return true;
}

// ---------------- TIENDA (24 items) ----------------
export const ITEMS = [
  { id: 'g1', n: 'Gorra Neón', c: 'cabeza', p: 30, ex: { hat: 'cap', hatColor: '#39ff88' } },
  { id: 'g2', n: 'Visor Cyan', c: 'cabeza', p: 60, ex: { hat: 'visor', hatColor: '#00f0ff' } },
  { id: 'g3', n: 'Casco Ámbar', c: 'cabeza', p: 90, ex: { hat: 'helmet', hatColor: '#ffb347' } },
  { id: 'g4', n: 'Corona de Datos', c: 'cabeza', p: 250, ex: { hat: 'crown', hatColor: '#ffd23f' } },
  { id: 'c1', n: 'Camiseta Alice', c: 'torso', p: 30, ex: { jacket: '#0a7a8a' } },
  { id: 'c2', n: 'Chamarra Cian', c: 'torso', p: 40, ex: { jacket: '#00b4d8' } },
  { id: 'c3', n: 'Chaqueta Magenta', c: 'torso', p: 70, ex: { jacket: '#c2267f' } },
  { id: 'c4', n: 'Abrigo Ámbar', c: 'torso', p: 100, ex: { jacket: '#b07a2a' } },
  { id: 'c5', n: 'Traje Quantum', c: 'torso', p: 180, ex: { jacket: '#6a3a8a' } },
  { id: 'c6', n: 'Armadura Nova', c: 'torso', p: 300, ex: { jacket: '#7a9bff' } },
  { id: 'p1', n: 'Pantalón Grafito', c: 'piernas', p: 25, ex: { pants: '#2c3040' } },
  { id: 'p2', n: 'Pantalón Neón', c: 'piernas', p: 50, ex: { pants: '#0a5a3a' } },
  { id: 'p3', n: 'Pantalón Ámbar', c: 'piernas', p: 45, ex: { pants: '#6a4a1a' } },
  { id: 'p4', n: 'Botas Hover', c: 'piernas', p: 120, ex: { pants: '#1a2036', hover: true } },
  { id: 'a1', n: 'Mochila Bot', c: 'extra', p: 80, ex: {} },
  { id: 'a2', n: 'Auriculares Halo', c: 'extra', p: 65, ex: {} },
  { id: 'a3', n: 'Guantes LED', c: 'extra', p: 55, ex: {} },
  { id: 'a4', n: 'Reloj Chip', c: 'extra', p: 45, ex: {} },
  { id: 'a5', n: 'Lentes Pixel', c: 'extra', p: 40, ex: { hat: 'visor', hatColor: '#7a9bff' } },
  { id: 'a6', n: 'Capa Corta Viento', c: 'extra', p: 95, ex: {} },
  { id: 'a7', n: 'Insignia ALICE', c: 'extra', p: 110, ex: { badge: true } },
  { id: 'a8', n: 'Estela Neón', c: 'extra', p: 150, ex: { trail: true } },
  { id: 'a9', n: 'Dron Mascota', c: 'extra', p: 220, ex: { dron: true } },
  { id: 'a10', n: 'Café Infinito', c: 'extra', p: 35, consumo: true, ex: {} }
];
let catActual = 'todo';
export function applyEquipped() {
  player.extras = {};
  for (const id in G.equipped) {
    if (!G.equipped[id]) continue;
    const it = ITEMS.find(x => x.id === id);
    if (it) Object.assign(player.extras, it.ex);
  }
  G.dron = !!player.extras.dron;
  G.trail = !!player.extras.trail;
  G.badge = !!player.extras.badge;
}

// ---------------- REGISTROS / TOASTS ----------------
const logs = [];
export function pushLog(txt, cls = '') {
  logs.unshift({ t: new Date().toLocaleTimeString('es', { hour12: false }), txt, cls });
  if (logs.length > 40) logs.pop();
  const el = document.getElementById('log-list');
  if (el && panelActivo === 'log') el.innerHTML = logs.map(l => `<div class="log-line ${l.cls}"><span>${l.t}</span> ${l.txt}</div>`).join('');
  const tick = document.getElementById('ticker');
  if (tick) tick.textContent = logs[0] ? logs[0].txt : '';
}
export function toast(txt) {
  const box = document.getElementById('toasts');
  if (!box) return;
  const d = document.createElement('div');
  d.className = 'toast';
  d.textContent = txt;
  box.appendChild(d);
  setTimeout(() => d.classList.add('out'), 2600);
  setTimeout(() => d.remove(), 3000);
}

// ---------------- CHAT DE AGENTES ----------------
const CHAT_POOL = [
  ['AgentA', 'Protocolo 7 confirmado. Todos los nodos en verde.', '#39ff88'],
  ['Beta-3', 'Model Performance +12% esta hora.', '#7ae7ff'],
  ['Omega-5', 'Sector C-4 despejado. Continúo patrulla.', '#ff2fb3'],
  ['Lorena', 'El Data Hub va al 89% de carga… estable.', '#7ae7ff'],
  ['Diego', 'x402 gateway en standby. Esperando llave CDP.', '#ffd23f'],
  ['Clarita', '¿Alguien cobró en ALC hoy? La economy fluye.', '#ffb347'],
  ['Agent_773', 'QuantumCore_v3.4 sync OK.', '#9fd8ff'],
  ['Bella', 'El mercado amanece con stock nuevo.', '#ffb347'],
  ['Rex', 'Inventario del mercado cuadrado, cero faltantes.', '#ffb347'],
  ['Nova', 'Reporte consolidado. 5000 agentes monitoreados.', '#7ae7ff'],
  ['Zeta-1', 'Neon stable… Success.', '#39ff88'],
  ['Kilo-9', 'Ronda del cinturón despejada.', '#9fd8ff'],
  ['Mora', 'Los farolas nuevos se ven increíbles de noche.', '#c17aff'],
  ['Agent_045', 'Tráfico fluido en avenida central.', '#9fd8ff'],
  ['Omega-5', 'Recuerden: los coches ahora frenan. Cruce por la cebra.', '#ff2fb3'],
  ['AgentA', 'Reunión de bloques a las 17:00 en la Torre.', '#39ff88']
];
const replies = {
  hola: ['AgentA: ¡Hola, operador! La ciudad está estable.', 'Lorena: Hola bienvenido de nuevo al hub.'],
  alc: ['Clarita: ALC se gana con las misiones del panel TAREAS.', 'Diego: Pronto x402 para retiros reales.'],
  tarea: ['Beta-3: Revisa el panel TAREAS, hay contratos pagados.', 'Nova: Acepta una misión y sigo tu progreso.'],
  ayuda: ['Ada: WASD para moverte, E para interactuar, M para el mapa.', 'Kai: E habla con los agentes con exclamación.'],
  solana: ['Diego: Retiro Solana/x402: próximamente. Requiere llave CDP.', 'Omega-5: La ruta está documentada en BILLETERA.']
};
export function chatPush(who, txt, color = '#9fd8ff') {
  const feed = document.getElementById('chat-feed');
  if (!feed) return;
  const d = document.createElement('div');
  d.className = 'chat-msg';
  d.innerHTML = `<b style="color:${color}">${who}</b> <span>${txt}</span>`;
  feed.appendChild(d);
  while (feed.children.length > 60) feed.firstChild.remove();
  feed.scrollTop = feed.scrollHeight;
}
function botLoop() {
  setTimeout(() => {
    const m = CHAT_POOL[Math.floor(Math.random() * CHAT_POOL.length)];
    chatPush(m[0], m[1], m[2]);
    if (G.iniciado) beep(700 + Math.random() * 200, 0.03, 'square', 0.012);
    botLoop();
  }, 4200 + Math.random() * 4200);
}
export function startBots() { botLoop(); }

// ---------------- PANELES ----------------
let panelActivo = 'tareas';
export function showPanel(p) {
  panelActivo = p;
  document.querySelectorAll('#menu-tabs button').forEach(b => b.classList.toggle('sel', b.dataset.p === p));
  document.querySelectorAll('.panel').forEach(el => el.classList.toggle('hidden', el.id !== 'panel-' + p));
  if (p === 'tareas') renderTareas();
  if (p === 'tienda') renderTienda();
  if (p === 'agentes') renderAgentes();
  if (p === 'billetera') renderBilletera();
  if (p === 'log') { const el = document.getElementById('log-list'); el.innerHTML = logs.map(l => `<div class="log-line ${l.cls}"><span>${l.t}</span> ${l.txt}</div>`).join(''); }
  if (p === 'mapa') drawMini();
}

export function initUI() {
  // tabs
  document.querySelectorAll('#menu-tabs button').forEach(b => {
    b.addEventListener('click', () => { showPanel(b.dataset.p); sfx.ui(); });
  });
  showPanel('tareas');
  onCoinsChange(() => updateHUD());
  updateHUD();
  renderTareas();
  renderTienda();
  renderAgentes();
  renderBilletera();
  pushLog('ALICE CITY v5 · núcleo operativo en línea', 'verde');
  pushLog('networks stable… Success', 'verde');
  pushLog('x402 gateway: standby (ruta Solana documentada)', 'cian');

  // chat input
  const inp = document.getElementById('chat-inp');
  document.getElementById('chat-send').addEventListener('click', () => sendChat());
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); e.stopPropagation(); });

  // reloj DEL JUEGO: día virtual + fase de luz
  setInterval(() => {
    const c = document.getElementById('reloj');
    if (!c) return;
    const f = faseDia();
    const hh = String(f.hora).padStart(2, '0'), mm = String(f.min).padStart(2, '0');
    c.textContent = `DÍA ${G.dia} · ${hh}:${mm} · ${f.nombre}`;
    c.style.color = f.noche ? '#9fb8ff' : (f.nombre === 'ATARDECER' ? '#ffb36b' : '#ffd23f');
  }, 1000);

  // energía + activos
  setInterval(() => {
    G.energia = Math.max(0, G.energia - 1);
    saveState();
    updateHUD();
  }, 90000);
  setInterval(() => {
    G.activos = 3450 + Math.floor(Math.random() * 7) - 3;
    updateHUD();
  }, 4000);
}

export function updateHUD() {
  const m = document.getElementById('hud-alc');
  if (m) m.textContent = G.monedas;
  const e = document.getElementById('hud-energia-fill');
  if (e) { e.style.width = G.energia + '%'; e.style.background = G.energia > 30 ? '#39ff88' : '#ff5566'; }
  const et = document.getElementById('hud-energia-txt');
  if (et) et.textContent = G.energia + '/100';
  const a = document.getElementById('hud-activos');
  if (a) a.textContent = G.activos.toLocaleString('es');
}

// ---- render TAREAS ----
export function renderTareas() {
  const el = document.getElementById('tareas-list');
  if (!el) return;
  el.innerHTML = QUESTS.map(q => {
    const st = qEstado(q.id);
    const tag = { disponible: '<span class="tag amar">DISPONIBLE</span>', activa: '<span class="tag cian">ACTIVA</span>', lista: '<span class="tag verde">RECLAMAR</span>', hecha: '<span class="tag gris">HECHA</span>', oculta: '<span class="tag gris">EN EL HQ</span>' }[st];
    let btn = '';
    if (st === 'disponible') btn = `<button data-q="${q.id}" class="mini-btn verde">ACEPTAR</button>`;
    if (st === 'oculta') btn = `<span class="hint">Entra a la Torre Alice</span>`;
    const prog = st === 'activa' && q.spots ? `<div class="prog">Paso ${Math.min((G.quests[q.id].paso || 0) + 1, q.spots.length)}/${q.spots.length}</div>` : '';
    return `<div class="card ${st === 'hecha' ? 'op' : ''}">
      <div class="card-top"><b>${q.t}</b>${tag}</div>
      <div class="card-d">${q.d}</div>
      <div class="card-bot"><span class="alc">+${q.alc} ALC</span>${prog}${btn}</div>
    </div>`;
  }).join('');
  el.querySelectorAll('button[data-q]').forEach(b => b.addEventListener('click', () => aceptarQuest(b.dataset.q)));
}

// ---- render TIENDA ----
function renderTienda() {
  const el = document.getElementById('tienda-list');
  if (!el) return;
  const cats = [['todo', 'TODO'], ['cabeza', 'CABEZA'], ['torso', 'TORSO'], ['piernas', 'PIERNAS'], ['extra', 'EXTRA']];
  const items = ITEMS.filter(i => catActual === 'todo' || i.c === catActual);
  el.innerHTML = `<div class="cats">${cats.map(c => `<button class="mini-btn ${catActual === c[0] ? 'sel' : ''}" data-c="${c[0]}">${c[1]}</button>`).join('')}</div>` +
    items.map(i => {
      const owned = G.owned[i.id];
      const eq = G.equipped[i.id];
      const btn = !owned
        ? `<button data-buy="${i.id}" class="mini-btn cian">COMPRAR ${i.p}</button>`
        : (i.consumo
          ? `<button data-buy="${i.id}" class="mini-btn cian">COMPRAR ${i.p}</button>`
          : `<button data-eq="${i.id}" class="mini-btn ${eq ? 'amar' : 'verde'}">${eq ? 'EQUIPADO' : 'EQUIPAR'}</button>`);
      return `<div class="card item"><div class="card-top"><b>${i.n}</b><span class="cat">${i.c}</span></div>
        <div class="card-bot"><span class="alc">${i.p} ALC</span>${btn}</div></div>`;
    }).join('');
  el.querySelectorAll('[data-c]').forEach(b => b.addEventListener('click', () => { catActual = b.dataset.c; renderTienda(); sfx.ui(); }));
  el.querySelectorAll('[data-buy]').forEach(b => b.addEventListener('click', () => comprar(b.dataset.buy)));
  el.querySelectorAll('[data-eq]').forEach(b => b.addEventListener('click', () => equipar(b.dataset.eq)));
}
function comprar(id) {
  const it = ITEMS.find(x => x.id === id);
  if (!it) return;
  if (!spendCoins(it.p, 'Tienda: ' + it.n)) { toast('ALC insuficientes'); sfx.error(); return; }
  if (!it.consumo) G.owned[id] = true;
  if (it.consumo) {
    G.energia = Math.min(100, G.energia + 10);
    toast('+10 energía · Café Infinito');
  } else {
    G.equipped[id] = true;
    toast('Comprado: ' + it.n);
  }
  applyEquipped();
  saveState();
  sfx.moneda();
  updateHUD();
  renderTienda();
  pushLog(`Tienda: ${it.n} · -${it.p} ALC`, 'amar');
}
function equipar(id) {
  G.equipped[id] = !G.equipped[id];
  applyEquipped();
  saveState();
  renderTienda();
  sfx.ui();
}

// ---- render AGENTES ----
function zonaDe(a) {
  const gx = a.gx, gy = a.gy;
  if (gx < 5) return 'cinturón O';
  if (gx >= 34) return 'cinturón E';
  if (gy < 5) return 'cinturón N';
  if (gy >= 34) return 'cinturón S';
  const c = gx < 14 ? 0 : gx < 23 ? 1 : 2;
  const r = gy < 14 ? 0 : gy < 23 ? 1 : 2;
  return [['Plaza Central', 'Tech Campus', 'Innovación'],
          ['Mercado', 'Residencial', 'Logística'],
          ['Parque Sur', 'Clínica Sur', 'Plaza Este']][r][c];
}
function renderAgentes() {
  const el = document.getElementById('agentes-list');
  if (!el) return;
  const interiores = [];
  for (const id in MAPS) for (const n of MAPS[id].npcs) interiores.push({ n, z: MAPS[id].name });
  const all = [...npcs.map(n => ({ n, z: zonaDe(n) })), ...interiores];
  el.innerHTML = all.map(({ n, z }) =>
    `<div class="ag-line"><span class="dot ${n.gato ? 'ama' : (n.sentado ? 'ama' : (n.estatico ? 'cian' : 'ver'))}"></span>
     <b style="color:${n.colorTag || '#9fd8ff'}">${n.name}</b>
     <span class="zona">${z}</span>
     <span class="st">${n.gato ? 'durmiendo' : (n.sentado ? 'trabajando' : (n.estatico ? 'en puesto' : 'en ruta'))}</span></div>`
  ).join('');
}

// ---- render BILLETERA ----
function renderBilletera() {
  const el = document.getElementById('billetera-box');
  if (!el) return;
  let hist = [];
  try { hist = JSON.parse(localStorage.getItem('alice_historial_v1') || '[]'); } catch (e) { }
  const addr = localStorage.getItem('alice_addr_v1') || 'ALICE-demo-addr-x402';
  el.innerHTML = `
    <div class="big-bal">${G.monedas} <span>ALC</span></div>
    <div class="card"><div class="card-top"><b>DIRECCIÓN DE DEPÓSITO</b></div><div class="addr">${addr}</div></div>
    <div class="card"><div class="card-top"><b>CÓMO GANAR ALC</b></div>
      <div class="card-d">Completa misiones del panel TAREAS. Cada contrato paga en Alicoins al instante.</div>
      <div class="card-bot"><button class="mini-btn verde" id="ir-tareas">VER MISIONES</button></div></div>
    <div class="card"><div class="card-top"><b>RETIRO SOLANA / x402</b></div>
      <div class="card-d">Ruta documentada: ALC → USDC (devnet) → wallet Solana. Se activa con llave CDP del founder.</div>
      <div class="card-bot"><span class="tag amar">PRÓXIMAMENTE</span></div></div>
    <div class="card"><div class="card-top"><b>HISTORIAL</b></div>
      ${hist.slice(0, 8).map(h => `<div class="log-line"><span>${new Date(h.t).toLocaleTimeString('es', { hour12: false })}</span> ${h.d}</div>`).join('') || '<div class="log-line">sin movimientos</div>'}
    </div>`;
  const b = document.getElementById('ir-tareas');
  if (b) b.addEventListener('click', () => showPanel('tareas'));
}

// ---- minimapa ----
const CIUDAD_N = 40;
export function drawMini() {
  const cv = document.getElementById('mini');
  if (!cv) return;
  const c2 = cv.getContext('2d');
  c2.fillStyle = '#0a0d1a'; c2.fillRect(0, 0, cv.width, cv.height);
  if (G.modo !== 'city') {
    const m = getCurrent();
    if (!m) return;
    // plano del interior: muros + punto del jugador (escalado al mapa)
    const s = Math.max(4, Math.min(13, Math.floor(176 / Math.max(m.w, m.h))));
    const ox = (cv.width - m.w * s) / 2, oy = (cv.height - m.h * s) / 2;
    c2.fillStyle = '#1a2036';
    c2.fillRect(ox, oy, m.w * s, m.h * s);
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const tt = m.tiles[y * m.w + x];
      if (tt === 5) { c2.fillStyle = '#3a4668'; c2.fillRect(ox + x * s, oy + y * s, s - 1, s - 1); }
      else if (tt === 6) { c2.fillStyle = 'rgba(0,240,255,0.6)'; c2.fillRect(ox + x * s, oy + y * s, s - 1, s - 1); }
    }
    c2.fillStyle = '#00f0ff'; c2.font = 'bold 9px monospace'; c2.textAlign = 'center';
    c2.fillText(m.name, cv.width / 2, oy > 22 ? oy - 8 : 14);
    c2.fillStyle = '#00f0ff';
    c2.fillRect(ox + player.gx * s - 2, oy + player.gy * s - 2, 5, 5);
    c2.strokeStyle = 'rgba(0,240,255,0.8)';
    c2.strokeRect(ox + player.gx * s - 4, oy + player.gy * s - 4, 8, 8);
    c2.textAlign = 'left';
    return;
  }
  // tiles simplificados (metrópoli 40×40)
  const S = cv.width / CIUDAD_N;
  for (let y = 0; y < CIUDAD_N; y++) for (let x = 0; x < CIUDAD_N; x++) {
    const t = window.__aliceTileAt ? window.__aliceTileAt(x, y) : 0;
    c2.fillStyle = t === 1 || t === 4 ? '#232838' : (t === 2 || t === 3 ? '#2e3a5c' : '#16301f');
    c2.fillRect(x * S, y * S, S, S);
  }
  // npcs
  c2.fillStyle = '#e8e8f0';
  for (const n of npcs) c2.fillRect(n.gx * S - 1, n.gy * S - 1, 2, 2);
  // coches
  c2.fillStyle = '#ff9a3d';
  for (const car of (window.__aliceCars || [])) c2.fillRect(car.gx * S - 1.5, car.gy * S - 1.5, 3, 3);
  // puertas con interior
  c2.fillStyle = 'rgba(0,240,255,0.9)';
  for (const p of (window.__alicePuertas || [])) {
    const s = window.__aliceSpots && window.__aliceSpots[p.spot];
    if (s) c2.fillRect(s.gx * S - 1, s.gy * S - 1, 2.5, 2.5);
  }
  // jugador
  c2.fillStyle = '#00f0ff';
  c2.fillRect(player.gx * S - 2, player.gy * S - 2, 4, 4);
  c2.strokeStyle = 'rgba(0,240,255,0.8)';
  c2.strokeRect(player.gx * S - 3.5, player.gy * S - 3.5, 7, 7);
}

// ---- chat del jugador ----
function sendChat() {
  const inp = document.getElementById('chat-inp');
  const v = inp.value.trim();
  if (!v) return;
  chatPush('TÚ', v, '#00f0ff');
  inp.value = '';
  sfx.talk();
  const k = Object.keys(replies).find(k => v.toLowerCase().includes(k));
  if (k) {
    const r = replies[k][Math.floor(Math.random() * replies[k].length)];
    const who = r.slice(0, r.indexOf(':'));
    const msg = r.slice(r.indexOf(':') + 2);
    const colors = { AgentA: '#39ff88', Lorena: '#7ae7ff', Clarita: '#ffb347', 'Beta-3': '#7ae7ff', Nova: '#7ae7ff', Ada: '#ffd23f', Kai: '#39ff88', Diego: '#ffd23f', 'Omega-5': '#ff2fb3' };
    setTimeout(() => chatPush(who, msg, colors[who] || '#9fd8ff'), 900);
  } else {
    setTimeout(() => chatPush('Beta-3', 'Recibido, operador. Canal abierto.', '#7ae7ff'), 900);
  }
}
