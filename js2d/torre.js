// ============================================================
// ALICE CITY v9 — ALICE TOWER (Task 266)
// Rascacielos oficial de AliceLabs: 11 pisos con ASCENSOR real,
// botón de CONVOCATORIA (los agentes caminan a la P4, se sientan
// y celebran la reunión con guiones), configuración de WhatsApp/
// Telegram, consola MCP, búsqueda RAG, políticas y términos.
// Pisos: P1 Lobby · P2 Seguridad · P3 Comunicaciones · P4 Reuniones
// P5 Diseño · P6 Desarrollo · P7 Analítica · P8 Data Center/RAG
// P9 MCP/API · P10 Dirección · P11 Sky Deck
// ============================================================
import { G, cam, gridToWorld, addCoins, saveState, sfx, hash2, fadeTo, isoX, isoY, ctx } from './engine.js';
import { player } from './agents.js';
import { NPC } from './agents.js';
import { registerMap, setCurrent, getCurrent, MAPS } from './maps.js';
import { room, suelo, solidBox, P, IT, NPCa, salida, PAL } from './interior.js';
import { pushLog, toast, chatPush, qEstado, aceptarQuest, completarQuest } from './ui.js';

// ---------- CATÁLOGO DE PISOS (del más alto al más bajo) ----------
export const PISOS_TORRE = [
  { id: 'torre_p11', n: 11, nombre: 'SKY DECK', desc: 'Helipuerto y terraza panorámica' },
  { id: 'torre_p10', n: 10, nombre: 'DIRECCIÓN', desc: 'Jefa Vega · bóveda multi-firma ALC' },
  { id: 'torre_p9', n: 9, nombre: 'MCP / API HUB', desc: 'Gateway MCP · REST API · tokens' },
  { id: 'torre_p8', n: 8, nombre: 'DATA CENTER · RAG', desc: 'Racks y base de conocimiento' },
  { id: 'torre_p7', n: 7, nombre: 'ANALÍTICA', desc: 'Dashboards y métricas de la red' },
  { id: 'torre_p6', n: 6, nombre: 'DESARROLLO', desc: 'Equipo de código y deploys' },
  { id: 'torre_p5', n: 5, nombre: 'DISEÑO', desc: 'Estudio creativo y moodboards' },
  { id: 'torre_p4', n: 4, nombre: 'SALA DE REUNIONES', desc: 'Mesa ejecutiva · convocatoria 📣' },
  { id: 'torre_p3', n: 3, nombre: 'COMUNICACIONES', desc: 'WhatsApp · Telegram · webhooks' },
  { id: 'torre_p2', n: 2, nombre: 'SEGURIDAD', desc: 'SOC · cámaras · políticas internas' },
  { id: 'torre_p1', n: 1, nombre: 'LOBBY', desc: 'Recepción · tornos · términos' }
];

const SPAWN_ASC = [17.5, 3.5];   // frente al ascensor (todos los pisos)
const ELEV_X = 17, ELEV_Y = 1.55;

// base común de cada piso: área de ascensor NE + interacción
function pisoBase(id, nombre, spawn) {
  const m = room(id, 20, 14, nombre, spawn || SPAWN_ASC.slice());
  suelo(m, 15, 1, 18, 3, 8);                       // baldosa teal zona ascensor
  P(m, 'elev', ELEV_X, ELEV_Y, true);
  IT(m, 'ascensor', ELEV_X, 3.0, 'ASCENSOR · ELEGIR PISO');
  return m;
}

// ============================================================
// P1 · LOBBY — recepción, tornos de seguridad, términos
// ============================================================
function buildP1() {
  const m = pisoBase('torre_p1', 'ALICE TOWER · LOBBY', [9.5, 12.2]);
  suelo(m, 1, 1, 18, 12, 4);
  suelo(m, 8, 10, 11, 12, 11);                     // alfombra de entrada
  suelo(m, 2, 2, 7, 4, 8);                         // zona de espera
  // recepción + espera
  P(m, 'recep', 6.5, 10.2, true);
  P(m, 'sofa', 3.5, 7.4, true);
  P(m, 'mesita', 3.5, 8.4, true);
  P(m, 'cafe', 2.4, 3.4, true);
  IT(m, 'cafe', 2.4, 4.4, 'CAFÉ DE BIENVENIDA (+energía)');
  // tornos de seguridad flanqueando el acceso
  P(m, 'torno', 8.3, 12.3, true);
  P(m, 'torno', 11.7, 12.3, true);
  // kiosco de términos + directorio
  P(m, 'terminal', 13.6, 11.3, true, { c: '#ffd23f' });
  IT(m, 'terminos', 13.6, 12.2, 'TÉRMINOS DEL SERVICIO');
  P(m, 'pantalla_gde', 9.5, 0.92, false, { k: 'map', c: '#00f0ff' });
  IT(m, 'directorio', 9.5, 1.9, 'DIRECTORIO DE LA TORRE');
  P(m, 'reloj', 6, 0.9, false);
  P(m, 'planta', 1.5, 1.6, true); P(m, 'planta', 18.5, 12.3, true);
  P(m, 'estante', 18.5, 5.5, true); P(m, 'estante', 18.5, 6.5, true);
  salida(m, 9, 10, 13);
  NPCa(m, { name: 'Recepción Uma', gx: 7.7, gy: 10.6, estatico: true, seed: 61, questId: 'P15', pal: PAL('#f0c9a0', '#5a3a1a', '#00b4d8', '#1a1d30'), colorTag: '#00f0ff' });
  NPCa(m, { name: 'Portero Max', gx: 8.5, gy: 11.5, speed: 0.7, seed: 62, pal: PAL('#e8b88a', '#151824', '#232a46', '#1a1d30'), colorTag: '#7a9bff', path: [[7.5, 11.5], [12.5, 11.5]] });
}

// ============================================================
// P2 · SEGURIDAD — SOC, cámaras, políticas internas
// ============================================================
function buildP2() {
  const m = pisoBase('torre_p2', 'ALICE TOWER · SEGURIDAD');
  suelo(m, 1, 1, 18, 12, 6);
  suelo(m, 2, 2, 16, 4, 2);                        // sala de monitoreo
  P(m, 'camara', 5, 0.92, false); P(m, 'camara', 10, 0.92, false); P(m, 'camara', 15, 0.92, false);
  P(m, 'pantalla_gde', 6.5, 0.92, false, { k: 'line', c: '#39ff88' });
  P(m, 'pantalla_gde', 12.5, 0.92, false, { k: 'bars', c: '#ff5566' });
  P(m, 'consola', 4.5, 2.5, true); P(m, 'consola', 14.5, 2.5, true);
  P(m, 'terminal', 9.5, 4.5, true, { c: '#7ae7ff' });
  IT(m, 'politicas', 9.5, 5.4, 'POLÍTICAS DE AGENTES');
  IT(m, 'accion', 4.5, 3.5, 'REGISTRO DE ACCESOS', { msg: 'Hoy: 128 ingresos · 0 alertas · tokens de visitante renovados' });
  P(m, 'estante', 1.5, 7.5, true); P(m, 'estante', 1.5, 8.5, true);
  P(m, 'mesa', 9.5, 9.5, true, { w: 2.4, d: 1 });
  P(m, 'planta', 18.5, 1.6, true); P(m, 'planta', 1.5, 11.3, true);
  salida(m, 9, 10, 13);
  NPCa(m, { name: 'SOC Delta', gx: 4.5, gy: 3.3, sentado: true, estatico: true, seed: 63, pal: PAL('#c98d5e', '#0f0f1a', '#232a46', '#1a1d30'), colorTag: '#7ae7ff' });
  NPCa(m, { name: 'Auditor Lumen', gx: 7.5, gy: 7.5, speed: 0.8, seed: 64, pal: PAL('#e8b88a', '#2c2c3c', '#4a5a8a', '#23263a'), colorTag: '#9fd8ff', path: [[7.5, 7.5], [13.5, 7.5]] });
}

// ============================================================
// P3 · COMUNICACIONES — WhatsApp / Telegram / webhooks
// ============================================================
function buildP3() {
  const m = pisoBase('torre_p3', 'ALICE TOWER · COMUNICACIONES');
  suelo(m, 1, 1, 18, 12, 9);
  suelo(m, 2, 2, 16, 4, 13);                       // sala técnica cerámica
  P(m, 'terminal', 5.5, 3.2, true, { c: '#39ff88' });
  IT(m, 'config_wa', 5.5, 4.1, 'CONFIGURAR WHATSAPP');
  P(m, 'terminal', 8.5, 3.2, true, { c: '#7ae7ff' });
  IT(m, 'config_tg', 8.5, 4.1, 'CONFIGURAR TELEGRAM');
  P(m, 'terminal', 11.5, 3.2, true, { c: '#ff2fb3' });
  IT(m, 'accion', 11.5, 4.1, 'WEBHOOKS ENTRANTES', { msg: 'POST /v1/webhooks/whatsapp · POST /v1/webhooks/telegram · firma verificada' });
  P(m, 'pantalla_gde', 8.5, 0.92, false, { k: 'bars', c: '#39ff88' });
  P(m, 'estante', 1.5, 6.5, true); P(m, 'estante', 18.5, 6.5, true);
  P(m, 'mesa', 9.5, 8.5, true, { w: 2.2, d: 0.9 });
  P(m, 'silla', 8.5, 9.3, true); P(m, 'silla', 10.5, 9.3, true);
  P(m, 'planta', 1.5, 1.6, true); P(m, 'planta', 18.5, 1.6, true);
  salida(m, 9, 10, 13);
  NPCa(m, { name: 'Operadora Mel', gx: 13.5, gy: 6.5, estatico: true, seed: 65, pal: PAL('#f0c9a0', '#b03a2a', '#8a3a5a', '#1e2130'), colorTag: '#ff2fb3' });
  NPCa(m, { name: 'Bots Tico', gx: 5.5, gy: 2.15, sentado: true, estatico: true, seed: 66, pal: PAL('#c98d5e', '#151824', '#2a7a6a', '#1e2130'), colorTag: '#39ff88' });
}

// ============================================================
// P4 · SALA DE REUNIONES — mesa ejecutiva + CONVOCATORIA
// ============================================================
const EQUIPO_REU = ['Pax', 'Zoe', 'Orion', 'Vela', 'Byte', 'Momo', 'Kilo', 'Tango'];
const ASIENTOS = [[8.5, 4.3], [9.5, 4.3], [10.5, 4.3], [11.5, 4.3], [8.5, 6.0], [9.5, 6.0], [10.5, 6.0], [11.5, 6.0]];
const PALS_REU = [
  PAL('#e8b88a', '#101322', '#e63946', '#1e2130'), PAL('#c98d5e', '#5a3a1a', '#2a9d8f', '#20263c'),
  PAL('#d9a06b', '#0f0f1a', '#3a4a9a', '#1a1d2c'), PAL('#f0c9a0', '#b03a2a', '#8a3a5a', '#1e2130'),
  PAL('#e8b88a', '#101322', '#00b4d8', '#1a1d30'), PAL('#f0c9a0', '#b03a2a', '#8a3a5a', '#1e2130'),
  PAL('#c98d5e', '#0f0f1a', '#2a7a6a', '#1e2130'), PAL('#d9a06b', '#5a3a1a', '#b07a2a', '#26202e')
];
const TAGS_REU = ['#ff9a3d', '#39ff88', '#7ae7ff', '#ff2fb3', '#00f0ff', '#ff2fb3', '#39ff88', '#ffd23f'];

function buildP4() {
  const m = pisoBase('torre_p4', 'ALICE TOWER · SALA DE REUNIONES');
  suelo(m, 1, 1, 18, 12, 4);
  suelo(m, 6, 3, 14, 8, 3);                        // alfombra ejecutiva
  P(m, 'mesa', 10, 5, true, { w: 4, d: 1.4 });
  // botón de convocatoria (la "llamada" a reunión)
  P(m, 'podium', 4.5, 5, true);
  IT(m, 'convocar', 4.5, 5.9, 'BOTÓN DE CONVOCATORIA (llamar a los agentes)');
  // pizarras + pantalla de agenda
  P(m, 'pizarra', 7, 0.92, false);
  P(m, 'pizarra', 13, 0.92, false);
  IT(m, 'skill', 13, 1.9, 'PIZARRA DE SKILLS (compartir / aprender)');
  P(m, 'pantalla_gde', 10, 0.92, false, { k: 'line', c: '#ffd23f' });
  // lounge lateral
  P(m, 'sofa', 15.5, 9.5, true);
  P(m, 'cafe', 17.4, 9.6, true);
  IT(m, 'cafe', 17.4, 10.5, 'CAFÉ DE REUNIÓN (+energía)');
  P(m, 'mesita', 15.5, 10.6, true);
  P(m, 'planta', 1.5, 1.6, true); P(m, 'planta', 18.5, 1.6, true);
  salida(m, 9, 10, 13);
  // moderadora permanente (cabecera oeste de la mesa)
  NPCa(m, { name: 'Lead Ruya', gx: 7.2, gy: 5.0, estatico: true, seed: 51, questId: 'P13', pal: PAL('#e8b88a', '#e8e8f0', '#00b4d8', '#1a1d30'), colorTag: '#00f0ff' });
  // equipo convocado: oculto hasta que el botón los llame
  m.reunionNpcs = [];
  for (let i = 0; i < EQUIPO_REU.length; i++) {
    const n = new NPC({ name: EQUIPO_REU[i], seed: 70 + i, pal: PALS_REU[i], colorTag: TAGS_REU[i], grupo: 'fijo' });
    n.reunion = true;
    n.alpha = 0; n.sentado = false; n.faseReu = 'oculto';
    n.silla = ASIENTOS[i];
    n.ruta = i < 4
      ? [[17.5, 3.2], [16.5, 3.6], [n.silla[0], 3.6], [n.silla[0], n.silla[1]]]
      : [[17.5, 3.2], [17.5, 6.8], [n.silla[0], 6.8], [n.silla[0], n.silla[1]]];
    n.piR = 0;
    n.update = function (dt) { updateAgenteReunion(this, dt); };
    m.npcs.push(n);
    m.reunionNpcs.push(n);
  }
}

// movimiento del equipo convocado (camino por pasillos limpios)
function updateAgenteReunion(n, dt) {
  const m = getCurrent();
  const reu = m && m.reunion;
  if (!reu || reu.estado === 'fin') {
    n.alpha = Math.max(0, n.alpha - dt * 1.3);
    if (n.alpha <= 0 && n.faseReu !== 'oculto') { n.faseReu = 'oculto'; n.sentado = false; n.talk = null; n.piR = 0; }
    n.state = 'idle';
    return;
  }
  if (n.faseReu === 'oculto') { n.faseReu = 'yendo'; n.gx = 17.5; n.gy = 3.2; n.piR = 0; n.sentado = false; }
  n.alpha = Math.min(1, n.alpha + dt * 1.6);
  if (!n.sentado) {
    const wp = n.ruta[n.piR];
    if (!wp) { n.sentado = true; n.state = 'idle'; return; }
    const dx = wp[0] - n.gx, dy = wp[1] - n.gy, d = Math.hypot(dx, dy);
    if (d < 0.08) {
      n.piR++;
      if (n.piR >= n.ruta.length) { n.sentado = true; n.state = 'idle'; }
    } else {
      const sp = 1.4 * dt;
      n.gx += dx / d * sp; n.gy += dy / d * sp;
      n.state = 'walk'; n.phase += sp * 3;
      n.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3);
    }
  } else n.state = 'idle';
}

// guiones de la reunión (MCP/RAG/API, canales, skills, economía)
function iniciarConversacion(m) {
  m.reunion.estado = 'activa';
  const por = nombre => m.reunionNpcs.find(n => n.name === nombre);
  const ruya = m.npcs.find(n => n.name === 'Lead Ruya');
  if (ruya) { ruya.talk = 'Reunión iniciada: roadmap, canales y skills. ¡Manos a la obra!'; ruya.burbujaT = 4; }
  m.chats = [
    { a: por('Pax'), b: por('Zoe'), t: 1.0, i: 0, lineas: [
      [0, 'El gateway MCP ya expone 7 tools a los agentes externos'],
      [1, '¿La de búsqueda RAG consulta la base de conocimiento?'],
      [0, 'Sí: alice_search_knowledge devuelve fuentes y score'],
      [1, 'Perfecto, la documento en la pizarra']
    ] },
    { a: por('Orion'), b: por('Vela'), t: 2.4, i: 0, lineas: [
      [0, 'WhatsApp y Telegram ya se configuran desde la P3'],
      [1, 'Y los webhooks entran por /v1/webhooks con firma'],
      [0, 'Con token Bearer y rate limit de 120 por minuto'],
      [1, 'Seguridad de la P2 aplicada de punta a punta']
    ] },
    { a: por('Byte'), b: por('Momo'), t: 3.9, i: 0, lineas: [
      [0, 'Comparto mi skill de orquestación en la pizarra'],
      [1, 'Yo sumo la plantilla de análisis, sube 12% la precisión'],
      [0, 'El RAG indexa las skills nuevas al instante'],
      [1, 'Así todos los agentes aprenden de todos']
    ] },
    { a: por('Kilo'), b: por('Tango'), t: 5.2, i: 0, lineas: [
      [0, 'La reunión quedó registrada en el acta de la red'],
      [1, 'Y el pool de ALC reparte esta noche'],
      [0, 'Roadmap: multijugador y retiro Solana real'],
      [1, 'La torre está viva. Buen día para ALICE CITY']
    ] }
  ];
  addCoins(8, 'Asistencia a la reunión de agentes');
  saveState();
  sfx.tarea();
  toast('+8 ALC · asistencia a la reunión');
  chatPush('Lead Ruya', 'Reunión en curso en la Torre P4: MCP, canales, skills y roadmap. Acta enviada al canal.', '#00f0ff');
}

function finalizarReunion(m) {
  m.reunion.estado = 'fin';
  m.chats = [];
  G.reunionListo = G.relojMin + 30;
  const ruya = m.npcs.find(n => n.name === 'Lead Ruya');
  if (ruya) { ruya.talk = 'Buen trabajo, equipo. Acta archivada en la P9.'; ruya.burbujaT = 3.4; }
  toast('Reunión concluida · acta enviada al hub');
  pushLog('Reunión de agentes finalizada · acta en MCP/API Hub', 'cian');
}

// latido de la reunión (llamado desde main solo en pisos de la torre)
export function updateTorre(m, dt) {
  if (!m.reunion) return;
  m.reunion.t -= dt;
  if (m.reunion.estado === 'llegando') {
    let all = true;
    for (const n of m.reunionNpcs) if (!n.sentado) all = false;
    if (all) iniciarConversacion(m);
  }
  if (m.reunion.t <= 0 && m.reunion.estado !== 'fin') finalizarReunion(m);
}

// CONVOCATORIA GLOBAL: tecla R o botón 📣
export function convocarReunion() {
  const m = MAPS['torre_p4'];
  if (G.modo !== 'interior' || !G.mapId || !G.mapId.startsWith('torre_')) {
    toast('La sala de reuniones está en la ALICE TOWER · sube a la P4');
    sfx.error();
    return;
  }
  if (m.reunion && m.reunion.estado !== 'fin') { toast('La reunión ya está en curso (P4)'); return; }
  const cd = (G.reunionListo || 0) - G.relojMin;
  if (cd > 0) { toast('Agenda ocupada: próxima convocatoria en ' + Math.ceil(cd) + ' min'); sfx.error(); return; }
  m.reunion = { estado: 'llegando', t: 95 };
  for (const n of m.reunionNpcs) { n.faseReu = 'oculto'; n.alpha = 0; n.sentado = false; n.piR = 0; n.talk = null; }
  m.chats = [];
  sfx.tarea();
  toast('CONVOCATORIA ENVIADA · 8 agentes en camino a la P4');
  pushLog('Convocatoria general: reunión de agentes en la Torre P4', 'amar');
  chatPush('Lead Ruya', 'Convocatoria: reunión general en la Torre Alice · P4. Traigan skills y métricas.', '#00f0ff');
  if (qEstado('P16') === 'disponible') aceptarQuest('P16');
  if (qEstado('P16') === 'activa') completarQuest('P16');
}

// ============================================================
// P5 · DISEÑO
// ============================================================
function buildP5() {
  const m = pisoBase('torre_p5', 'ALICE TOWER · DISEÑO');
  suelo(m, 1, 1, 18, 12, 13);
  suelo(m, 2, 2, 12, 7, 11);                       // alfombra creativa
  for (const d of [[4, 3], [6, 3], [4, 5], [6, 5]]) P(m, 'mesa_lab', d[0], d[1], true);
  P(m, 'cuadro', 4, 0.92, false); P(m, 'cuadro', 7, 0.92, false); P(m, 'cuadro', 10, 0.92, false);
  P(m, 'pizarra', 14, 0.92, false);
  IT(m, 'accion', 5, 4.2, 'BRIEF DE DISEÑO', { msg: 'Paleta neón aprobada · mockups de la Torre listos para Desarrollo' });
  P(m, 'estante', 18.5, 4.5, true); P(m, 'estante', 18.5, 5.5, true);
  P(m, 'sofa', 15, 9.5, true);
  P(m, 'planta', 1.5, 11.3, true); P(m, 'planta', 18.5, 11.3, true);
  salida(m, 9, 10, 13);
  NPCa(m, { name: 'Directora Pixy', gx: 4, gy: 2.15, sentado: true, estatico: true, seed: 67, pal: PAL('#f0c9a0', '#ff2fb3', '#c17aff', '#20263c'), colorTag: '#c17aff' });
  NPCa(m, { name: 'Diseñador Glitch', gx: 9.5, gy: 9.5, speed: 0.7, seed: 68, pal: PAL('#d9a06b', '#0f0f1a', '#39ff88', '#1a1d30'), colorTag: '#39ff88', path: [[9.5, 9.5], [13.5, 9.5]] });
}

// ============================================================
// P6 · DESARROLLO
// ============================================================
function buildP6() {
  const m = pisoBase('torre_p6', 'ALICE TOWER · DESARROLLO');
  suelo(m, 1, 1, 18, 12, 1);
  suelo(m, 2, 2, 12, 7, 8);
  for (const d of [[3, 3], [5, 3], [7, 3], [3, 6], [5, 6], [7, 6]]) P(m, 'desk', d[0], d[1], true);
  P(m, 'pizarra', 10, 0.92, false);
  P(m, 'pantalla_gde', 13, 0.92, false, { k: 'line', c: '#39ff88' });
  P(m, 'rack', 16.5, 2.5, true); P(m, 'rack', 16.5, 3.5, true);
  IT(m, 'rack', 16.5, 4.4, 'ACTIVAR RACK');
  IT(m, 'accion', 6, 4.6, 'DEPLOY A STAGING', { msg: 'Build v9.0.0-rc1 en verde · CI OK · rollback listo' });
  P(m, 'estante', 1.5, 9.5, true); P(m, 'estante', 1.5, 10.5, true);
  P(m, 'planta', 18.5, 11.3, true);
  salida(m, 9, 10, 13);
  NPCa(m, { name: 'Dev Lead Rust', gx: 3, gy: 2.15, sentado: true, estatico: true, seed: 69, pal: PAL('#e8b88a', '#b03a2a', '#b07a2a', '#26202e'), colorTag: '#ffd23f' });
  NPCa(m, { name: 'Coder Juno', gx: 5, gy: 2.15, sentado: true, estatico: true, seed: 70, pal: PAL('#c98d5e', '#151824', '#7a9bff', '#232630'), colorTag: '#7a9bff' });
  NPCa(m, { name: 'Tester Wisp', gx: 9.5, gy: 10.5, speed: 0.8, seed: 71, pal: PAL('#f0c9a0', '#5a3a1a', '#2a9d8f', '#20263c'), colorTag: '#39ff88', path: [[9.5, 10.5], [14.5, 10.5]] });
}

// ============================================================
// P7 · ANALÍTICA
// ============================================================
function buildP7() {
  const m = pisoBase('torre_p7', 'ALICE TOWER · ANALÍTICA');
  suelo(m, 1, 1, 18, 12, 0);
  suelo(m, 2, 2, 16, 4, 1);
  P(m, 'pantalla_gde', 5, 0.92, false, { k: 'bars', c: '#ffd23f' });
  P(m, 'pantalla_gde', 10, 0.92, false, { k: 'line', c: '#00f0ff' });
  P(m, 'pantalla_gde', 15, 0.92, false, { k: 'map', c: '#39ff88' });
  P(m, 'desk', 5, 3, true); P(m, 'desk', 10, 3, true);
  IT(m, 'accion', 7.5, 4.3, 'INFORME DEL DÍA', { msg: 'Misiones pagadas: 214 · ALC en circulación: 12,480 · latencia x402: 380 ms' });
  P(m, 'estante', 1.5, 7.5, true); P(m, 'estante', 1.5, 8.5, true);
  P(m, 'estante', 18.5, 7.5, true); P(m, 'estante', 18.5, 8.5, true);
  P(m, 'mesa', 9.5, 10.5, true, { w: 2.4, d: 0.9 });
  P(m, 'planta', 18.5, 1.6, true);
  salida(m, 9, 10, 13);
  NPCa(m, { name: 'Data Minerva', gx: 5, gy: 2.15, sentado: true, estatico: true, seed: 72, pal: PAL('#e8b88a', '#2c2c3c', '#4a5a8a', '#23263a'), colorTag: '#00f0ff' });
  NPCa(m, { name: 'Analista Curva', gx: 10, gy: 2.15, sentado: true, estatico: true, seed: 73, pal: PAL('#c98d5e', '#0f0f1a', '#8a3a5a', '#1e2130'), colorTag: '#ff2fb3' });
}

// ============================================================
// P8 · DATA CENTER · RAG
// ============================================================
function buildP8() {
  const m = pisoBase('torre_p8', 'ALICE TOWER · DATA CENTER RAG');
  suelo(m, 1, 1, 18, 12, 2);
  const racks = [[2.5, 2.5], [3.5, 2.5], [2.5, 4.5], [3.5, 4.5], [13.5, 2.5], [14.5, 2.5], [13.5, 4.5], [14.5, 4.5]];
  for (const r of racks) { P(m, 'rack', r[0], r[1], true); IT(m, 'rack', r[0], r[1] + 0.85, 'ACTIVAR RACK'); }
  P(m, 'pantalla_gde', 8, 0.92, false, { k: 'line', c: '#39ff88' });
  P(m, 'terminal', 8, 3.2, true, { c: '#39ff88' });
  IT(m, 'rag', 8, 4.1, 'BUSCAR EN CONOCIMIENTO (RAG)');
  IT(m, 'accion', 8, 6.5, 'ESTADO DEL CLÚSTER', { msg: 'RAG indexado: 7 documentos · 8/8 racks en verde · refrigeración OK' });
  P(m, 'consola', 5.5, 6.5, true); P(m, 'consola', 10.5, 6.5, true);
  salida(m, 9, 10, 13);
  NPCa(m, { name: 'SRE Nube', gx: 5.5, gy: 9.5, speed: 0.75, seed: 74, pal: PAL('#e8b88a', '#151824', '#9aa3c0', '#1a1d30'), colorTag: '#9fd8ff', path: [[5.5, 9.5], [12.5, 9.5]] });
  NPCa(m, { name: 'Keeper Dato', gx: 15.6, gy: 6.5, estatico: true, seed: 75, pal: PAL('#c98d5e', '#0f0f1a', '#2c3554', '#1a1d2c'), colorTag: '#39ff88' });
}

// ============================================================
// P9 · MCP / API HUB
// ============================================================
function buildP9() {
  const m = pisoBase('torre_p9', 'ALICE TOWER · MCP / API HUB');
  suelo(m, 1, 1, 18, 12, 8);
  suelo(m, 2, 2, 16, 4, 10);
  P(m, 'terminal', 5.5, 3.2, true, { c: '#00f0ff' });
  IT(m, 'mcp', 5.5, 4.1, 'CONSOLA MCP (tools de la red)');
  P(m, 'terminal', 8.5, 3.2, true, { c: '#ff2fb3' });
  IT(m, 'accion', 8.5, 4.1, 'REST API DE LA RED', { msg: 'GET /v1/city · POST /v1/agents · POST /v1/meetings/call · Auth: Bearer token' });
  P(m, 'terminal', 11.5, 3.2, true, { c: '#ffd23f' });
  IT(m, 'accion', 11.5, 4.1, 'TOKENS DE ACCESO', { msg: 'Rol agent: leer/escribir lo propio · rol admin: convocar · rate limit 120/min' });
  P(m, 'pantalla_gde', 8.5, 0.92, false, { k: 'map', c: '#ff2fb3' });
  P(m, 'rack', 16.5, 8.5, true); P(m, 'rack', 16.5, 9.5, true);
  IT(m, 'rack', 16.5, 10.4, 'ACTIVAR RACK');
  P(m, 'estante', 1.5, 8.5, true);
  P(m, 'planta', 1.5, 1.6, true);
  salida(m, 9, 10, 13);
  NPCa(m, { name: 'Arq. Mesh', gx: 5.5, gy: 2.15, sentado: true, estatico: true, seed: 76, pal: PAL('#d9a06b', '#0f0f1a', '#3a4a9a', '#1a1d2c'), colorTag: '#7ae7ff' });
  NPCa(m, { name: 'API Vera', gx: 7.5, gy: 7.5, speed: 0.8, seed: 77, pal: PAL('#f0c9a0', '#5a3a1a', '#ff2fb3', '#1e2130'), colorTag: '#ff2fb3', path: [[7.5, 7.5], [13.5, 7.5]] });
}

// ============================================================
// P10 · DIRECCIÓN
// ============================================================
function buildP10() {
  const m = pisoBase('torre_p10', 'ALICE TOWER · DIRECCIÓN');
  suelo(m, 1, 1, 18, 12, 0);
  suelo(m, 5, 3, 14, 8, 11);                       // alfombra ejecutiva
  P(m, 'mesa_dir', 9.5, 4.8, true);
  P(m, 'silla', 9.5, 3.8, true);
  P(m, 'silla', 8.4, 5.8, true); P(m, 'silla', 10.6, 5.8, true);
  P(m, 'vault', 3.5, 3.2, true);
  IT(m, 'accion', 3.5, 4.1, 'BÓVEDA ALC', { msg: 'Reserva de la red: 1,000,000 ALC · multi-firma 3/5 · auditoría mensual' });
  P(m, 'pantalla_gde', 14, 0.92, false, { k: 'bars', c: '#ffd23f' });
  P(m, 'cuadro', 6, 0.92, false);
  P(m, 'sofa', 15.5, 9.5, true);
  P(m, 'mesita', 15.5, 10.6, true);
  P(m, 'planta', 1.5, 1.6, true); P(m, 'planta', 18.5, 11.3, true);
  P(m, 'reloj', 11, 0.9, false);
  salida(m, 9, 10, 13);
  NPCa(m, { name: 'Jefa Vega', gx: 11, gy: 5.5, estatico: true, seed: 6, questId: 'P6', pal: PAL('#e8b88a', '#2c2c3c', '#4a5a8a', '#23263a'), colorTag: '#00f0ff' });
  NPCa(m, { name: 'Asistente Robin', gx: 8, gy: 6.5, estatico: true, seed: 78, pal: PAL('#c98d5e', '#151824', '#6a7398', '#1e2130'), colorTag: '#9fd8ff' });
}

// ============================================================
// P11 · SKY DECK
// ============================================================
function buildP11() {
  const m = pisoBase('torre_p11', 'ALICE TOWER · SKY DECK');
  suelo(m, 1, 1, 18, 12, 3);
  P(m, 'helipad', 10, 6.5, false);
  P(m, 'banco', 5.5, 9.5, true, { dir: 0 });
  P(m, 'banco', 14.5, 9.5, true, { dir: 0 });
  P(m, 'banco', 10, 3.2, true, { dir: 0 });
  P(m, 'planta', 1.5, 1.6, true); P(m, 'planta', 18.5, 1.6, true);
  P(m, 'planta', 1.5, 11.3, true); P(m, 'planta', 18.5, 11.3, true);
  P(m, 'pantalla', 4, 0.92, false, { c: 0 }); P(m, 'pantalla', 16, 0.92, false, { c: 1 });
  IT(m, 'accion', 10, 7.8, 'VISTA PANORÁMICA', { msg: 'Toda ALICE CITY a tus pies · 18 interiores y el cinturón verde' });
  salida(m, 9, 10, 13);
  NPCa(m, { name: 'Piloto Zeph', gx: 12.5, gy: 6.5, estatico: true, seed: 79, pal: PAL('#e8b88a', '#101322', '#ff9a3d', '#26202e'), colorTag: '#ff9a3d' });
}

// ---------- construir la torre completa ----------
export function buildTorre() {
  buildP1(); buildP2(); buildP3(); buildP4(); buildP5();
  buildP6(); buildP7(); buildP8(); buildP9(); buildP10(); buildP11();
}

// ir a un piso con fundido (ascensor / bajar al lobby)
export function irPiso(id) {
  if (G.modo !== 'interior' || !MAPS[id]) return;
  fadeIr(id);
}
function fadeIr(id) {
  fadeTo(() => {
    const m = setCurrent(id);
    if (!m) return;
    G.modo = 'interior'; G.mapId = id;
    player.gx = SPAWN_ASC[0]; player.gy = SPAWN_ASC[1];
    cam.x = gridToWorld(player.gx, player.gy).x;
    cam.y = gridToWorld(player.gx, player.gy).y - 10;
    dispatchEvent(new Event('alice-resize'));     // main re-aplica el zoom adaptativo
    pushLog('Ascensor → ' + m.name, 'cian');
    sfx.puerta();
  });
}

// ============================================================
// PANEL MODAL DE LA TORRE (ascensor, términos, políticas,
// WhatsApp, Telegram, RAG, MCP, directorio)
// ============================================================
const MCP_TOOLS = [
  ['alice_list_agents', 'Lista los agentes registrados en la red'],
  ['alice_get_city_state', 'Estado de ALICE CITY y de la Torre'],
  ['alice_call_meeting', 'Convoca una reunión de agentes (P4)'],
  ['alice_share_skill', 'Publica una skill en la pizarra de la red'],
  ['alice_send_message', 'Mensaje agente→agente vía el hub'],
  ['alice_search_knowledge', 'Búsqueda RAG sobre la base de conocimiento'],
  ['alice_get_policies', 'Devuelve las políticas oficiales de agentes']
];

const RAG_DOCS = [
  { src: 'city-guide.md', t: 'Guía de ALICE CITY', txt: 'ALICE CITY es una metrópoli 40x40 con 18 interiores y la ALICE TOWER de 11 pisos. El hub central es la Plaza Central; la Torre Alice alberga el HQ. Los agentes usan WASD o joystick, E para interactuar y M para la vista aérea. Las puertas llevan a interiores con NPCs, misiones y economía.' },
  { src: 'economy-alc.md', t: 'Economía ALC', txt: 'El ALC (Alicoin) es la moneda de la red. Se gana completando misiones del panel TAREAS, trabajando turnos en el AGENTS HUB y asistiendo a reuniones. La reserva de la red es de 1,000,000 ALC bajo multi-firma 3/5 en la bóveda de la P10. La ruta de retiro ALC a USDC en Solana queda documentada para cuando el founder active la llave CDP.' },
  { src: 'skills-catalog.md', t: 'Catálogo de skills', txt: 'La pizarra de skills de la P4 permite compartir y aprender: Prompt Engineering, Análisis de datos, Negociación x402, Diseño de agentes, Auditoría de contratos, Minería eficiente, Patrulla exprés, Cocina de agentes y Orquestación de NPCs. Compartir una skill da inspiración y queda indexada en el RAG.' },
  { src: 'comms-whatsapp.md', t: 'Configuración de WhatsApp', txt: 'En la P3 Comunicaciones se configura el canal de WhatsApp: número del canal, nombre visible y mensaje de bienvenida. La plataforma formal expone POST /v1/webhooks/whatsapp para recibir mensajes entrantes con verificación hub.challenge y firma. El token de verificación se define en la variable WHATSAPP_VERIFY.' },
  { src: 'comms-telegram.md', t: 'Configuración de Telegram', txt: 'Telegram se configura en la P3: token del bot (de @BotFather) y chat ID del canal. La API formal recibe actualizaciones en POST /v1/webhooks/telegram y las archiva en el bus de mensajes /v1/messages para que todos los agentes conectados las lean.' },
  { src: 'mcp-tools.md', t: 'Herramientas MCP', txt: 'El servidor MCP de AliceLabs expone 7 tools: alice_list_agents, alice_get_city_state, alice_call_meeting, alice_share_skill, alice_send_message, alice_search_knowledge y alice_get_policies. Corre sobre stdio (JSON-RPC 2.0) y se conecta desde cualquier cliente MCP compatible. Protocolo 2024-11-05.' },
  { src: 'api-endpoints.md', t: 'API REST de la red', txt: 'La API REST corre en el puerto 8787. Endpoints: GET /health, GET /v1/city, GET y POST /v1/agents, GET y POST /v1/meetings, POST /v1/meetings/call, GET y POST /v1/skills, GET y POST /v1/messages, GET /v1/knowledge/search?q=, GET /v1/policies, GET /v1/terms y webhooks de WhatsApp y Telegram. Autenticación Bearer token con roles agent y admin, rate limit 120 peticiones por minuto.' },
  { src: 'policies.md', t: 'Políticas de agentes', txt: 'Todo agente debe registrarse antes de operar, usar su token personal, respetar el rate limit, no suplantar identidades, reportar incidentes en menos de 30 minutos y compartir skills en la pizarra. El incumplimiento suspende el token tras 3 avisos. Las decisiones de economía son del consejo de bloques.' },
  { src: 'terms.md', t: 'Términos del servicio', txt: 'Al conectarse a la red AliceLabs el agente acepta: uso responsable de canales, trazabilidad completa de acciones, tratamiento de datos según SECURITY.md, prohibición de spam y abuso, y la jurisdicción del consejo de bloques de ALICE CITY. Los términos se aceptan en el kiosco del lobby P1.' },
  { src: 'security.md', t: 'Seguridad', txt: 'Modelo de seguridad: tokens Bearer por agente con roles agent/admin, rate limit por token, webhooks con verificación de firma, secretos fuera del repo (tokens.json en gitignore) y rotación recomendada cada 90 días. El SOC de la P2 monitorea accesos y alertas.' },
  { src: 'tower-floors.md', t: 'Pisos de la Torre', txt: 'La ALICE TOWER tiene 11 pisos: P1 Lobby con tornos y términos, P2 Seguridad con SOC, P3 Comunicaciones WhatsApp y Telegram, P4 Sala de Reuniones con botón de convocatoria, P5 Diseño, P6 Desarrollo, P7 Analítica, P8 Data Center con RAG, P9 MCP y API Hub, P10 Dirección con bóveda y P11 Sky Deck con helipuerto.' },
  { src: 'agents-roster.md', t: 'Nómina de agentes', txt: 'La red coordina 3450 agentes activos. El equipo de la Torre incluye Lead Ruya (moderadora), el equipo de coworking del AGENTS HUB, SOC Delta en seguridad, Operadora Mel en comunicaciones, Dev Lead Rust en desarrollo, Data Minerva en analítica, SRE Nube en el data center, Arq. Mesh en MCP y la Jefa Vega en la Dirección.' }
];

function ragBuscar(q) {
  const qs = q.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  if (!qs.length) return [];
  const res = [];
  for (const d of RAG_DOCS) {
    const hay = (d.t + ' ' + d.txt).toLowerCase();
    let score = 0;
    for (const w of qs) {
      const hits = hay.split(w).length - 1;
      if (hits) score += 1 + Math.log(1 + hits) * 0.5;
    }
    if (score > 0) {
      const idx = hay.indexOf(qs[0]);
      const from = Math.max(0, (idx < 0 ? 0 : idx) - 40);
      res.push({ ...d, score, frag: (from ? '…' : '') + d.txt.slice(from, from + 150) + '…' });
    }
  }
  return res.sort((a, b) => b.score - a.score).slice(0, 4);
}

const commsWA = () => { try { return JSON.parse(localStorage.getItem('alice_comms_wa') || 'null'); } catch (e) { return null; } };
const commsTG = () => { try { return JSON.parse(localStorage.getItem('alice_comms_tg') || 'null'); } catch (e) { return null; } };

function checkP17() {
  if (commsWA() && commsTG()) {
    if (qEstado('P17') === 'disponible') aceptarQuest('P17');
    if (qEstado('P17') === 'activa') completarQuest('P17');
  }
}

export function abrirPanelTorre(modo) {
  const box = document.getElementById('panel-torre');
  const tit = document.getElementById('pt-titulo');
  const body = document.getElementById('pt-body');
  if (!box || !body) return;
  box.classList.remove('hidden');
  sfx.ui();
  const pisoActual = G.mapId;

  if (modo === 'ascensor') {
    tit.textContent = 'ASCENSOR · ALICE TOWER';
    body.innerHTML = PISOS_TORRE.map(p => `
      <button class="pt-fila ${p.id === pisoActual ? 'act' : ''}" data-piso="${p.id}" ${p.id === pisoActual ? 'disabled' : ''}>
        <span class="pt-n">P${p.n}</span>
        <span><b>${p.nombre}</b><div class="pt-d">${p.desc}</div></span>
      </button>`).join('');
    body.querySelectorAll('[data-piso]').forEach(b => b.addEventListener('click', () => {
      cerrarPanelTorre();
      fadeIr(b.dataset.piso);
    }));
    return;
  }

  if (modo === 'terminos') {
    const ok = localStorage.getItem('alice_tower_terminos');
    tit.textContent = 'TÉRMINOS DEL SERVICIO · ALICELABS NETWORK';
    body.innerHTML = `
      <p><b>1.</b> Todo agente opera con identidad propia y token personal: la suplantación suspende el acceso.</p>
      <p><b>2.</b> Las acciones en la red quedan trazadas en el registro de accesos (P2) por auditoría.</p>
      <p><b>3.</b> El ALC es la unidad de cuenta interna; su emisión y reparto los decide el consejo de bloques.</p>
      <p><b>4.</b> Canales (WhatsApp/Telegram) de uso laboral: cero spam, cero datos sensibles de terceros.</p>
      <p><b>5.</b> Las skills compartidas en la pizarra pasan a beneficio común de la red.</p>
      <p><b>6.</b> Incidentes de seguridad se reportan al SOC de la P2 en menos de 30 minutos.</p>
      <div style="margin-top:10px">${ok
        ? '<span class="pt-tag pt-ok">TÉRMINOS ACEPTADOS</span>'
        : '<button class="pt-btn" id="pt-aceptar">ACEPTAR TÉRMINOS</button>'}</div>`;
    const b = document.getElementById('pt-aceptar');
    if (b) b.addEventListener('click', () => {
      localStorage.setItem('alice_tower_terminos', '1');
      toast('Términos aceptados · acceso de visitante concedido');
      pushLog('Términos del servicio aceptados en el lobby', 'verde');
      abrirPanelTorre('terminos');
    });
    return;
  }

  if (modo === 'politicas') {
    tit.textContent = 'POLÍTICAS DE AGENTES · v1.0';
    body.innerHTML = `
      <p><b>Registro.</b> Todo agente se registra vía API (POST /v1/agents) o MCP y recibe un token con rol <i>agent</i>; los operadores con rol <i>admin</i> convocan reuniones y administran tokens.</p>
      <p><b>Uso de canales.</b> WhatsApp y Telegram son canales oficiales de la red: mensajes firmados, sin spam, con rate limit de 120 peticiones/min por token.</p>
      <p><b>Conocimiento.</b> El RAG de la P8 indexa políticas, términos, skills y guías: cualquier agente puede consultar con alice_search_knowledge.</p>
      <p><b>Economía.</b> Los pagos en ALC se registran en el historial de la billetera; la bóveda P10 exige multi-firma 3/5.</p>
      <p><b>Conducta.</b> Colaborar, compartir skills y reportar incidentes es parte del trabajo; el incumplimiento reiterado (3 avisos) suspende el token.</p>`;
    return;
  }

  if (modo === 'wa' || modo === 'tg') {
    const esWA = modo === 'wa';
    const d = esWA ? commsWA() : commsTG();
    tit.textContent = esWA ? 'CONFIGURAR CANAL WHATSAPP' : 'CONFIGURAR CANAL TELEGRAM';
    body.innerHTML = esWA ? `
      <span class="pt-tag ${d ? 'pt-ok' : 'pt-no'}">${d ? 'CONECTADO' : 'PENDIENTE'}</span>
      <p class="pt-h3">NÚMERO DEL CANAL</p>
      <input class="pt-inp" id="wa-num" placeholder="+593 999 000 000" value="${d ? d.num || '' : ''}">
      <p class="pt-h3">NOMBRE VISIBLE DEL CANAL</p>
      <input class="pt-inp" id="wa-nom" placeholder="ALICE OPS" value="${d ? d.nom || '' : ''}">
      <p class="pt-h3">MENSAJE DE BIENVENIDA</p>
      <input class="pt-inp" id="wa-msj" placeholder="Bienvenido a la red AliceLabs" value="${d ? d.msj || '' : ''}">
      <p class="pt-d" style="color:#8fb0d8">El canal recibe mensajes por POST /v1/webhooks/whatsapp (verificación hub.challenge + firma).</p>
      <button class="pt-btn" id="wa-save">GUARDAR Y CONECTAR</button>` : `
      <span class="pt-tag ${d ? 'pt-ok' : 'pt-no'}">${d ? 'CONECTADO' : 'PENDIENTE'}</span>
      <p class="pt-h3">TOKEN DEL BOT (@BotFather)</p>
      <input class="pt-inp" id="tg-tok" type="password" placeholder="123456:ABC-DEF..." value="${d ? d.tok || '' : ''}">
      <p class="pt-h3">CHAT ID DEL CANAL</p>
      <input class="pt-inp" id="tg-chat" placeholder="-1001234567890" value="${d ? d.chat || '' : ''}">
      <p class="pt-d" style="color:#8fb0d8">Las actualizaciones llegan por POST /v1/webhooks/telegram y se archivan en /v1/messages.</p>
      <button class="pt-btn" id="tg-save">GUARDAR Y CONECTAR</button>`;
    const save = document.getElementById(esWA ? 'wa-save' : 'tg-save');
    save.addEventListener('click', () => {
      if (esWA) {
        const num = document.getElementById('wa-num').value.trim();
        const nom = document.getElementById('wa-nom').value.trim();
        const msj = document.getElementById('wa-msj').value.trim();
        if (!num || !nom) { toast('Faltan datos del canal'); sfx.error(); return; }
        localStorage.setItem('alice_comms_wa', JSON.stringify({ num, nom, msj }));
        pushLog('Canal WhatsApp conectado: ' + nom, 'verde');
      } else {
        const tok = document.getElementById('tg-tok').value.trim();
        const cid = document.getElementById('tg-chat').value.trim();
        if (!tok || !cid) { toast('Faltan datos del bot'); sfx.error(); return; }
        localStorage.setItem('alice_comms_tg', JSON.stringify({ tok: tok.slice(0, 8) + '***', cid }));
        pushLog('Canal Telegram conectado · chat ' + cid, 'verde');
      }
      sfx.moneda();
      toast('Canal conectado · la red ya puede escribirte');
      checkP17();
      abrirPanelTorre(modo);
    });
    return;
  }

  if (modo === 'rag') {
    tit.textContent = 'BASE DE CONOCIMIENTO · RAG';
    body.innerHTML = `
      <p class="pt-d" style="color:#8fb0d8">Consulta la knowledge base indexada (${RAG_DOCS.length} documentos): políticas, términos, guías, MCP, API y economía.</p>
      <input class="pt-inp" id="rag-q" placeholder="ej: mcp, whatsapp, alc, políticas..." value="">
      <button class="pt-btn" id="rag-go">BUSCAR</button>
      <div id="rag-out" style="margin-top:10px"></div>`;
    const run = () => {
      const q = document.getElementById('rag-q').value.trim();
      const out = document.getElementById('rag-out');
      if (!q) { out.innerHTML = '<p class="pt-d">Escribe una consulta.</p>'; return; }
      const res = ragBuscar(q);
      out.innerHTML = res.length
        ? res.map(r => `<div class="pt-res"><b>${r.t}</b> <span class="pt-tag pt-ok">${r.src}</span> · score ${r.score.toFixed(2)}<br>${r.frag}</div>`).join('')
        : '<p class="pt-d">Sin resultados: prueba con «mcp», «alc» o «telegram».</p>';
      sfx.talk();
      pushLog('RAG: «' + q + '» · ' + res.length + ' resultados', 'cian');
    };
    document.getElementById('rag-go').addEventListener('click', run);
    document.getElementById('rag-q').addEventListener('keydown', e => { if (e.key === 'Enter') run(); e.stopPropagation(); });
    setTimeout(() => document.getElementById('rag-q').focus(), 60);
    return;
  }

  if (modo === 'mcp') {
    tit.textContent = 'CONSOLA MCP · ALICE CITY GATEWAY';
    body.innerHTML = `
      <p class="pt-d" style="color:#8fb0d8">Servidor MCP formal (stdio · JSON-RPC 2.0 · protocolo 2024-11-05) en <b>platform/mcp-server/server.mjs</b> del workspace AliceLabs. Los agentes externos se conectan con un cliente MCP estándar.</p>
      ${MCP_TOOLS.map(t => `<div class="pt-fila" style="cursor:default"><span class="pt-n" style="width:auto;color:#39ff88">TOOL</span><span><b>${t[0]}</b><div class="pt-d">${t[1]}</div></span></div>`).join('')}
      <p class="pt-h3">API REST COMPLEMENTARIA</p>
      <p class="pt-d">http://localhost:8787 · Auth: Bearer token · GET /v1/city · POST /v1/meetings/call · GET /v1/knowledge/search?q=</p>`;
    return;
  }

  if (modo === 'directorio') {
    tit.textContent = 'DIRECTORIO · ALICE TOWER';
    body.innerHTML = `
      <p class="pt-d" style="color:#8fb0d8">11 pisos operativos · fundada por AliceLabs · el edificio más alto de ALICE CITY.</p>
      ${PISOS_TORRE.map(p => `<div class="pt-fila" data-piso="${p.id}"><span class="pt-n">P${p.n}</span><span><b>${p.nombre}</b><div class="pt-d">${p.desc}</div></span></div>`).join('')}`;
    body.querySelectorAll('[data-piso]').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.piso === G.mapId) return;
      cerrarPanelTorre();
      fadeIr(b.dataset.piso);
    }));
    return;
  }
}

export function cerrarPanelTorre() {
  const box = document.getElementById('panel-torre');
  if (box) box.classList.add('hidden');
}

// Esc cierra el panel
addEventListener('keydown', e => { if (e.key === 'Escape') cerrarPanelTorre(); });

// botón ✕ del panel + botón de convocatoria de escritorio
document.getElementById('pt-close').addEventListener('click', cerrarPanelTorre);
document.getElementById('btn-convocar').addEventListener('click', convocarReunion);

// ============================================================
// PROPS VISUALES EXCLUSIVOS DE LA TORRE
// ============================================================
const P2 = (gx, gy) => ({ x: isoX(gx, gy), y: isoY(gx, gy) });

export function drawPropTorre(p, t) {
  const g = P2(p.gx, p.gy);
  const x = g.x, y = g.y;
  switch (p.tipo) {
    case 'elev': {
      // puertas del ascensor: marco metálico + flecha pulsante
      ctx.fillStyle = '#3a4258';
      ctx.fillRect(x - 14, y - 30, 28, 30);
      ctx.fillStyle = '#232838';
      ctx.fillRect(x - 11, y - 27, 9, 27); ctx.fillRect(x + 2, y - 27, 9, 27);
      ctx.strokeStyle = '#6a7698'; ctx.lineWidth = 1;
      ctx.strokeRect(x - 14.5, y - 30.5, 29, 31);
      ctx.strokeRect(x - 11, y - 27, 9, 27); ctx.strokeRect(x + 2, y - 27, 9, 27);
      ctx.lineWidth = 1;
      const gl = 0.5 + 0.5 * Math.sin(t * 2.4);
      ctx.fillStyle = `rgba(0,240,255,${0.55 + gl * 0.45})`;
      ctx.beginPath();
      ctx.moveTo(x, y - 36); ctx.lineTo(x + 4, y - 31); ctx.lineTo(x - 4, y - 31);
      ctx.closePath(); ctx.fill();
      return true;
    }
    case 'torno': {
      ctx.fillStyle = '#232838';
      ctx.fillRect(x - 3, y - 14, 6, 14);
      ctx.fillStyle = '#3a4258';
      ctx.fillRect(x - 4, y - 16, 8, 3);
      ctx.strokeStyle = '#8a94b8';
      ctx.beginPath(); ctx.moveTo(x - 8, y - 12); ctx.lineTo(x + 8, y - 9); ctx.stroke();
      const gl = Math.sin(t * 3 + p.gx) > 0 ? '#39ff88' : '#ff5566';
      ctx.fillStyle = gl;
      ctx.fillRect(x - 1.5, y - 20, 3, 3);
      return true;
    }
    case 'terminal': {
      const c = (p.data && p.data.c) || '#00f0ff';
      ctx.fillStyle = '#1a2036';
      ctx.fillRect(x - 7, y - 12, 14, 12);
      ctx.fillStyle = '#232a46';
      ctx.fillRect(x - 9, y - 26, 18, 15);
      ctx.fillStyle = '#0a0d1a';
      ctx.fillRect(x - 7.5, y - 24.5, 15, 12);
      ctx.fillStyle = c;
      ctx.globalAlpha = 0.75 + 0.25 * Math.sin(t * 3 + p.gx);
      ctx.fillRect(x - 6, y - 23, 13, 9);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#0a0d1a';
      for (let i = 0; i < 3; i++) ctx.fillRect(x - 6, y - 21 + i * 3, 4 + (i % 2) * 4, 1);
      ctx.shadowColor = c; ctx.shadowBlur = 6;
      ctx.strokeStyle = c;
      ctx.strokeRect(x - 9.5, y - 26.5, 19, 16);
      ctx.shadowBlur = 0;
      return true;
    }
    case 'pantalla_gde': {
      const c = (p.data && p.data.c) || '#00f0ff';
      const k = (p.data && p.data.k) || 'line';
      ctx.fillStyle = '#0a0d1a';
      ctx.fillRect(x - 26, y - 46, 52, 26);
      ctx.strokeStyle = c; ctx.globalAlpha = 0.8;
      ctx.strokeRect(x - 26.5, y - 46.5, 53, 27);
      ctx.globalAlpha = 1;
      if (k === 'bars') {
        for (let i = 0; i < 6; i++) {
          const h = 4 + hash2(i, Math.floor(t * 1.5)) * 16;
          ctx.fillStyle = `rgba(${c === '#ff5566' ? '255,85,102' : c === '#ffd23f' ? '255,210,63' : c === '#39ff88' ? '57,255,136' : '0,240,255'},0.8)`;
          ctx.fillRect(x - 21 + i * 7.4, y - 24 - h, 5, h);
        }
      } else if (k === 'line') {
        ctx.strokeStyle = c; ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i <= 12; i++) {
          const px = x - 22 + i * 3.7;
          const py = y - 34 - Math.sin(i * 0.9 + t * 1.8) * 7 - hash2(i, 7) * 4;
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.stroke(); ctx.lineWidth = 1;
      } else {
        for (let i = 0; i < 24; i++) {
          const hx = hash2(i * 13, Math.floor(t / 2));
          ctx.fillStyle = hx > 0.7 ? '#39ff88' : (hx > 0.35 ? c : 'rgba(120,140,180,0.4)');
          ctx.fillRect(x - 21 + (i % 8) * 5.4, y - 42 + Math.floor(i / 8) * 7, 3, 3);
        }
      }
      return true;
    }
    case 'podium': {
      ctx.fillStyle = '#1a2036';
      ctx.fillRect(x - 8, y - 14, 16, 14);
      ctx.fillStyle = '#232a46';
      ctx.fillRect(x - 10, y - 16, 20, 3);
      const gl = 0.5 + 0.5 * Math.sin(t * 3.2);
      ctx.fillStyle = `rgba(255,${90 + gl * 80},60,1)`;
      ctx.beginPath(); ctx.ellipse(x, y - 19, 5.5, 3, 0, 0, 7); ctx.fill();
      ctx.shadowColor = '#ff9a3d'; ctx.shadowBlur = 8 + gl * 8;
      ctx.beginPath(); ctx.ellipse(x, y - 19, 5.5, 3, 0, 0, 7); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(255,154,61,${0.3 + gl * 0.4})`;
      ctx.beginPath(); ctx.ellipse(x, y + 1, 14, 6, 0, 0, 7); ctx.stroke();
      return true;
    }
    case 'mesa_dir': {
      ctx.fillStyle = '#3a2a18';
      ctx.fillRect(x - 26, y - 12, 52, 16);
      ctx.fillStyle = '#5c4128';
      ctx.fillRect(x - 26, y - 18, 52, 8);
      ctx.fillStyle = '#10131f';
      ctx.fillRect(x - 8, y - 26, 16, 10);
      ctx.fillStyle = `rgba(0,240,255,${0.55 + 0.2 * Math.sin(t * 2)})`;
      ctx.fillRect(x - 6, y - 24.5, 12, 7);
      ctx.fillStyle = '#e8e8f0';
      ctx.fillRect(x + 12, y - 14, 6, 4);
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(x - 18, y - 13, 5, 3);
      return true;
    }
    case 'vault': {
      ctx.fillStyle = '#2c3050';
      ctx.beginPath(); ctx.arc(x, y - 14, 13, 0, 7); ctx.fill();
      ctx.fillStyle = '#1a1d30';
      ctx.beginPath(); ctx.arc(x, y - 14, 9, 0, 7); ctx.fill();
      ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 4 + t * 0.4;
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(a) * 8, y - 14 - Math.sin(a) * 8);
        ctx.lineTo(x + Math.cos(a) * 8, y - 14 + Math.sin(a) * 8);
        ctx.stroke();
      }
      ctx.lineWidth = 1;
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath(); ctx.arc(x, y - 14, 2.5, 0, 7); ctx.fill();
      return true;
    }
    case 'helipad': {
      ctx.fillStyle = 'rgba(120,130,160,0.35)';
      ctx.beginPath(); ctx.ellipse(x, y, 30, 14, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#e8e8f0'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x, y, 24, 10.5, 0, 0, 7); ctx.stroke();
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 6, y - 5); ctx.lineTo(x - 6, y + 5);
      ctx.moveTo(x + 6, y - 5); ctx.lineTo(x + 6, y + 5);
      ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y);
      ctx.stroke();
      ctx.lineWidth = 1;
      return true;
    }
    case 'camara': {
      ctx.fillStyle = '#3a4258';
      ctx.fillRect(x - 4, y - 34, 8, 5);
      ctx.fillStyle = '#232838';
      ctx.fillRect(x + 2, y - 33, 7, 3.5);
      ctx.fillStyle = Math.sin(t * 4 + p.gx) > 0.4 ? '#ff5566' : '#5a1a22';
      ctx.fillRect(x + 8, y - 32, 2, 2);
      ctx.strokeStyle = 'rgba(122,231,255,0.14)';
      ctx.beginPath();
      ctx.moveTo(x + 9, y - 31); ctx.lineTo(x + 22, y - 20); ctx.lineTo(x + 20, y - 10);
      ctx.closePath(); ctx.stroke();
      return true;
    }
  }
  return false;
}
