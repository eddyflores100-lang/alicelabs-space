// ============================================================
// ALICE CITY v8 — MAIN (loop, reloj de juego, ambiente, puertas)
// Ciudad viva: horarios de agentes, ciclo día/noche, nubes,
// pájaros y luciérnagas. Resolución alta con gradientes.
// ============================================================
import { G, ctx, cam, VW, VH, gridToWorld, toScreen, keys, consume, clamp, lerp, dist2, fadeTo, addCoins, saveState, audioInit, sfx, onCoinsChange, tickReloj, faseDia } from './engine.js';
import { buildCity, spots, buildings, props, crosswalks, distritos, tile as cityTileArr, puertas, MAPC, MAPR } from './city.js';
import { drawGround, drawBuilding, drawProp, drawLights, drawCarBody, buildGroundCache, drawNubes, drawSombrasNubes, drawLuciernagas, drawAmbiente, drawCielo } from './draw.js';
import { player, updatePlayer, npcs, spawnNPCs, drawAgent, drawSeated, setCarBlock } from './agents.js';
import { cars, spawnCars, updateCars, drawCars, carBlock, setPedList } from './cars.js';
import { buildAllInteriors, drawInteriorGround, drawWallTile, drawIProp } from './interior.js';
import { MAPS, setCurrent, getCurrent } from './maps.js';
import { initUI, updateHUD, pushLog, toast, chatPush, startBots, qEstado, aceptarQuest, completarQuest, QUESTS, applyEquipped, drawMini, renderTareas, showPanel } from './ui.js';
import { initTouch } from './touch.js';

// ---------- arranque ----------
buildCity();
buildGroundCache();   // suelo pre-renderizado con gradientes y textura (v8)
buildAllInteriors();
spawnNPCs();
spawnCars();
setCarBlock(carBlock);
applyEquipped();
initTouch();

// primera visita: bono de bienvenida
if (!localStorage.getItem('alice_v5_hola')) {
  localStorage.setItem('alice_v5_hola', '1');
  addCoins(25, 'Bono de bienvenida ALICE CITY');
}

// hooks globales para ui.js (minimapa)
window.__aliceTileAt = (x, y) => G.modo === 'city' ? (crosswalks.has(y * MAPC + x) ? 4 : cityTileArr[y * MAPC + x]) : 1;
window.__aliceCars = cars;
window.__alicePuertas = puertas;
window.__aliceSpots = spots;
// handle de depuración / integración
window.__alice = {
  G, player, npcs, cars, MAPS,
  teleport: (gx, gy) => { player.gx = gx; player.gy = gy; },
  go: (mapId) => {
    if (mapId === 'city') { G.modo = 'city'; G.mapId = null; setCurrent(null); return 'city'; }
    const m = setCurrent(mapId);
    if (!m) return 'no existe';
    G.modo = 'interior'; G.mapId = mapId;
    player.gx = m.spawn[0]; player.gy = m.spawn[1];
    return m.name;
  }
};

// ---------- splash ----------
const splash = document.getElementById('splash');
document.getElementById('btn-entrar').addEventListener('click', () => {
  audioInit();
  splash.classList.add('hidden');
  G.iniciado = true;
  initUI();
  startBots();
  sfx.tarea();
  pushLog('Operador conectado a la red de agentes', 'verde');
  chatPush('Ada', '¡ALICE CITY v8 CIUDAD VIVA! Ciclo día/noche con horarios: los agentes van al trabajo, pasean y descansan. ¡Mira el reloj!', '#ffd23f');
  setTimeout(() => toast(window.__esTouch ? 'Joystick para moverte · E para entrar' : 'Usa WASD · E entrar/hablar · M mapa'), 800);
});

// ---------- cámara ----------
cam.x = gridToWorld(player.gx, player.gy).x;
cam.y = gridToWorld(player.gx, player.gy).y;
let zoomObjetivo = 1.6;   // v8: vista cercana y definida (los objetos se ven GRANDES)

addEventListener('wheel', e => {
  if (!G.iniciado) return;
  zoomObjetivo = clamp(zoomObjetivo * (e.deltaY > 0 ? 0.9 : 1.1), 0.55, 2.8);
  G.overview = false;
});

// ---------- interacciones ----------
let cerca = null;   // {tipo, ref, label}

function buscarInteraccion() {
  cerca = null;
  if (G.modo === 'city') {
    // puertas a interiores
    for (const p of puertas) {
      const s = spots[p.spot];
      if (s && dist2(player.gx, player.gy, s.gx, s.gy) < 0.6) {
        cerca = { tipo: 'puerta', ref: p, label: 'ENTRAR: ' + p.label };
        return;
      }
    }
    // NPCs
    for (const n of npcs) {
      if (dist2(player.gx, player.gy, n.gx, n.gy) < 0.6) {
        cerca = { tipo: 'npc', ref: n, label: 'HABLAR CON ' + n.name };
        return;
      }
    }
  } else {
    const m = getCurrent();
    if (!m) return;
    for (const n of m.npcs) {
      if (dist2(player.gx, player.gy, n.gx, n.gy) < 0.65) {
        cerca = { tipo: 'npc', ref: n, label: n.gato ? 'ACARICIAR A ' + n.name : 'HABLAR CON ' + n.name };
        return;
      }
    }
    for (const it of m.inter) {
      if (it.tipo === 'rack' && it.done) continue;
      if (dist2(player.gx, player.gy, it.gx, it.gy) < 0.62) {
        cerca = { tipo: it.tipo, ref: it, label: it.label };
        return;
      }
    }
    // salida por el tapete
    if (player.gy > m.exit.y - 0.42 && player.gx > m.exit.x0 - 0.4 && player.gx < m.exit.x1 + 1.4) {
      cerca = { tipo: 'salida', label: 'SALIR A LA CIUDAD' };
    }
  }
}

function entrarInterior(p) {
  G.lastDoor = p;
  fadeTo(() => {
    const m = setCurrent(p.mapa);
    G.modo = 'interior'; G.mapId = p.mapa;
    player.gx = m.spawn[0]; player.gy = m.spawn[1];
    cam.x = gridToWorld(player.gx, player.gy).x;
    cam.y = gridToWorld(player.gx, player.gy).y;
    zoomObjetivo = 1.9;
    if (p.mapa === 'hq' && !G.v5hq) {
      G.v5hq = true; saveState(); renderTareas();
    }
    pushLog('Entras en ' + m.name, 'cian');
    sfx.puerta();
  });
}

function salirACiudad() {
  fadeTo(() => {
    G.modo = 'city'; G.mapId = null;
    setCurrent(null);
    const p = G.lastDoor;
    const s = p ? spots[p.spot] : null;
    player.gx = s ? s.gx : 8.5;
    player.gy = s ? s.gy + 0.6 : 6.5;
    cam.x = gridToWorld(player.gx, player.gy).x;
    cam.y = gridToWorld(player.gx, player.gy).y;
    zoomObjetivo = 1.6;
    pushLog('Vuelves a la ciudad', 'cian');
    sfx.puerta();
  });
}

function interactuar() {
  if (!cerca) return;
  if (cerca.tipo !== 'npc') sfx.ui(); else sfx.talk();
  switch (cerca.tipo) {
    case 'puerta': entrarInterior(cerca.ref); break;
    case 'salida': salirACiudad(); break;
    case 'npc': hablarCon(cerca.ref); break;
    case 'rack': {
      cerca.ref.done = true;
      const m = getCurrent();
      const hechos = m.inter.filter(i => i.tipo === 'rack' && i.done).length;
      const total = m.inter.filter(i => i.tipo === 'rack').length;
      sfx.moneda();
      pushLog(`Rack activado (${hechos}/${total})`, 'verde');
      toast(`Rack activado ${hechos}/${total}`);
      const hq = MAPS['hq'];
      const racksHq = hq.inter.filter(i => i.tipo === 'rack');
      if (racksHq.every(r => r.done) && qEstado('P7') === 'activa') completarQuest('P7');
      break;
    }
    case 'armario':
      showPanel('tienda');
      toast('Armario abierto: equipa tu outfit');
      break;
    case 'cama':
      fadeTo(() => {
        G.energia = 100;
        saveState(); updateHUD();
        toast('Has dormido: energía 100/100');
        pushLog('Siesta reparadora · energía al 100', 'verde');
      });
      break;
    case 'pc':
      showPanel('tareas');
      toast('Contratos pagados en ALC');
      break;
    case 'cafe':
      G.energia = Math.min(100, G.energia + 8);
      updateHUD(); saveState();
      toast('Café: +' + 8 + ' energía');
      sfx.moneda();
      break;
    case 'accion': {
      const it = cerca.ref;
      toast(it.data && it.data.msg ? it.data.msg : 'Hecho');
      pushLog(it.label + ' · ' + (it.data && it.data.msg || 'OK'), 'cian');
      it.done = true;
      break;
    }
    // ---- vida diaria v7 ----
    case 'ducha':
      fadeTo(() => {
        G.energia = Math.min(100, G.energia + 18);
        saveState(); updateHUD();
        toast('Ducha caliente: +18 energía');
        pushLog('Te duchaste · +18 energía', 'verde');
      });
      break;
    case 'cocina':
      G.energia = Math.min(100, G.energia + 10);
      saveState(); updateHUD(); sfx.moneda();
      toast('Cocinaste: +10 energía');
      break;
    case 'cafetera':
      G.energia = Math.min(100, G.energia + 12);
      saveState(); updateHUD(); sfx.moneda();
      toast('Café de Tara: +12 energía');
      break;
    case 'gym':
      G.energia = Math.max(0, G.energia - 6);
      saveState(); updateHUD();
      toast('Entrenaste fuerte: −6 energía · +salud');
      pushLog('Sesión de gym completada', 'amar');
      break;
    case 'camilla':
      fadeTo(() => {
        G.energia = 100;
        saveState(); updateHUD();
        toast('Dra. Luna: estás perfecto · energía 100/100');
        pushLog('Revisión médica · energía al 100', 'verde');
      });
      break;
  }
}

const DIALOGOS = {
  Nova: ['El Data Hub procesa 5000 señales por minuto. Todo estable.', 'Cuando quieras traer el reporte, el hub lo registra al instante.'],
  Bella: ['¡Operador! Tengo un paquete que debe llegar al NEURAL CORE.', 'Cuidado al cruzar: ahora los coches frenan, pero no juegues.'],
  Rex: ['El mercado abre con fila. El inventario no se cuenta solo.', 'Entre el mercado y la logística se pierden cajas… tú me entiendes.'],
  'Jefa Vega': ['Operador, el consejo de bloques espera tu informe.', 'Esta torre coordina a los 3450 agentes de la red.'],
  Ada: ['Recepción del HQ. ¿Vienes a la reunión o al server room?', 'La Jefa Vega está en conferencia; Leo cuida los racks.'],
  Kai: ['Siendo honesto, el café del lounge mantiene la red viva.', 'Mi dashboard jamás estuvo tan verde.'],
  Mia: ['Estoy depurando el módulo de pagos… en ALC, claro.', 'Los recibos ahora se firman solos.'],
  Dot: ['Servidor 7 reportó un pico, ya está calmado.', 'Amo esta oficina. Las luces de neón ayudan a concentrar.'],
  Leo: ['Estos racks no se apagan ni por navidad.', 'Si se prenden en verde, todo fluye.'],
  Ciro: ['Cada pantalla es una región de la ciudad. Ninguna en rojo.', 'El hub nunca duerme. Yo casi tampoco.'],
  Luz: ['Estoy cruzando los flujos de ALC con las misiones.', 'Los pagos salen al segundo. Eso me gusta.'],
  'Dr. Syn': ['El núcleo neural aprende de cada misión que completas.', 'No toques el reactor sin guantes. O sí, es pixel-art.'],
  Iris: ['Sincronizo agentes nuevos cada hora.', 'La ciudad crece: ahora tiene casas. Pásate.'],
  Chart: ['Las gráficas suben. Sobre todo la de ALC pagados.', 'Si ves una curva rara, avisa: la investigo.'],
  Mila: ['Comparo semestres. Este va ganando de paliza.', 'El founder estará contento con estos números.'],
  Tito: ['¡Pase, pase! Fresco del día, pago en ALC.', 'Las guirnaldas las puse yo. ¿A que dan vibes?'],
  Any: ['La caja cuadra al centavo.', 'El registro dice: todo vendido. Buen día.'],
  'Gato Bot': ['MIAU-0101 · sys.purr(OK)', 'Traducción: acaríceme, humano del hub.'],
  Cargos: ['214 paquetes hoy. Cero perdidos. Récord.', 'La cinta no se detiene ni a las 3 AM.'],
  Vex: ['Repongo estantes en bucle. Zen total.', 'Si buscas cajas, siguen la numeración morada.'],
  'Prof. Quark': ['NEON-9: nuestro compuesto más brillante.', 'La ciencia aquí se paga en ALC. Literal.'],
  Nix: ['Mis matraces burbujean felices.', 'Cuidado con el verde: tiñe la piel. Broma… casi.'],
  Teco: ['SRV-7 al 100%. Ese servidor es mi bebé.', 'Los LEDs verdes = dormir tranquilo.'],
  'Doña Lu': ['¡Vecino! El barrio quedó de lujo: baño propio y todo.', 'La clave del sofá: frente al televisor, siempre.'],
  Otto: ['Horneo cada mañana a las 7. Sin fallar.', 'Los vecinos de ALICE CITY son buena gente.'],
  Tara: ['¡Pase! El café de la casa paga la máquina sola.', 'Nave viene cada mañana antes de su turno en el Hub.'],
  Nave: ['Con este café arranco el turno de datos.', 'La vitrina de Tara… mira las facturas de Neón.'],
  Rocco: ['¡Vamos! Una vuelta más y la energía se renueva.', 'El gym es gratis para agentes de la red.'],
  'Agente Fit': ['Cinco kilómetros antes del desayuno. Siempre.', 'Rocco no acepta excusas.'],
  'Dra. Luna': ['Revisiones al día: cero agentes baja de 90 de energía.', 'Si te sientes mal, la camilla es gratis.'],
  'Nurse Pip': ['Turno de vacunación a las 4. No llegues tarde.', 'La clínica nunca duerme, como el Hub.'],
  Vek: ['Trabajo desde casa: el Hub me manda tickets aquí.', 'Mi gato Bit audita mis commits. MIAU incluido.'],
  Sole: ['CASA-3 es pequeña pero con baño propio, jeje.', 'Lo mejor del cinturón norte: silencio total.'],
  Iker: ['Vivo en el cinturón este. El commute vale la pena.', 'Cuando hay neón, hay vida.'],
  Bit: ['MIAU-0002 · sys.audit(OK)', 'Traducción: Vek trabaja demasiado. Dale cariño.']
};
function hablarCon(n) {
  n.talk = DIALOGOS[n.name] ? DIALOGOS[n.name][Math.floor(Math.random() * (DIALOGOS[n.name].length))] : 'Red estable, operador.';
  setTimeout(() => { n.talk = null; }, 3200);
  chatPush(n.name, n.talk, n.colorTag || '#9fd8ff');
  // oferta de misión
  if (n.questId) {
    const st = qEstado(n.questId);
    if (st === 'disponible') {
      const q = QUESTS.find(x => x.id === n.questId);
      n.talk = q.d;
      setTimeout(() => aceptarQuest(n.questId), 600);
    } else if (st === 'activa') {
      const q = QUESTS.find(x => x.id === n.questId);
      if (!q.spots) completarQuest(n.questId);
      else n.talk = 'Sigue con la misión: ' + q.d;
    }
  }
}

// ---------- progreso de misiones por zonas ----------
function checkQuestSpots() {
  if (G.modo !== 'city') return;
  for (const q of QUESTS) {
    const st = qEstado(q.id);
    if (st !== 'activa' || !q.spots) continue;
    const s = G.quests[q.id];
    const target = spots[q.spots[Math.min(s.paso || 0, q.spots.length - 1)]];
    if (!target) continue;
    if (dist2(player.gx, player.gy, target.gx, target.gy) < 0.45) {
      s.paso = (s.paso || 0) + 1;
      sfx.moneda();
      if (s.paso >= q.spots.length) {
        completarQuest(q.id);
      } else {
        toast(`Punto alcanzado (${s.paso}/${q.spots.length})`);
        saveState();
        pushLog(`Misión ${q.id}: punto ${s.paso}/${q.spots.length}`, 'amar');
      }
    }
  }
}

// ---------- marcadores ----------
function drawMarkers(t) {
  const m = getCurrent();
  const pool = G.modo === 'city' ? npcs : (m ? m.npcs : []);
  for (const q of QUESTS) {
    const st = qEstado(q.id);
    if (st !== 'activa') continue;
    const s = G.quests[q.id];
    if (q.spots) {
      if (G.modo !== 'city') continue;   // los puntos de misión son de la ciudad
      const target = spots[q.spots[Math.min(s.paso || 0, q.spots.length - 1)]];
      if (target) marker(target.gx, target.gy, '#ffd23f', t);
    } else if (q.npc) {
      const n = pool.find(x => x.name === q.npc);
      if (n) marker(n.gx, n.gy - 0.2, '#ff2fb3', t);
    }
  }
  // exclamación sobre NPCs con misión disponible (solo del mapa actual)
  for (const n of pool) {
    if (n.questId && qEstado(n.questId) === 'disponible') {
      const w = gridToWorld(n.gx, n.gy);
      const bob = Math.sin(t * 4) * 2;
      ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd23f';
      ctx.shadowColor = '#ffd23f'; ctx.shadowBlur = 6;
      ctx.fillText('!', w.x, w.y - 34 + bob);
      ctx.shadowBlur = 0; ctx.textAlign = 'left';
    }
  }
}
function marker(gx, gy, color, t) {
  const w = gridToWorld(gx, gy);
  const bob = Math.sin(t * 3.5) * 2.5;
  ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(w.x, w.y - 16 + bob); ctx.lineTo(w.x + 5, w.y - 10 + bob);
  ctx.lineTo(w.x, w.y - 4 + bob); ctx.lineTo(w.x - 5, w.y - 10 + bob);
  ctx.closePath(); ctx.stroke();
  ctx.globalAlpha = 0.22;
  ctx.beginPath(); ctx.moveTo(w.x, w.y - 40); ctx.lineTo(w.x, w.y);
  ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.stroke();
  ctx.globalAlpha = 1; ctx.lineWidth = 1;
}

// etiquetas sobre las puertas de la ciudad (se ve dónde se puede entrar)
function drawPuertas(t) {
  if (cam.zoom < 0.72) return;
  ctx.font = 'bold 7px monospace'; ctx.textAlign = 'center';
  for (const p of puertas) {
    const s = spots[p.spot];
    if (!s) continue;
    const w = gridToWorld(s.gx, s.gy);
    const sc = toScreen(w.x, w.y);
    if (sc.sx < -30 || sc.sx > VW + 30 || sc.sy < -30 || sc.sy > VH + 30) continue;
    const pulse = 0.55 + 0.35 * Math.sin(t * 2.8 + s.gx);
    // brillo en el suelo de la puerta
    ctx.strokeStyle = `rgba(0,240,255,${pulse})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w.x, w.y - 7); ctx.lineTo(w.x + 12, w.y);
    ctx.lineTo(w.x, w.y + 7); ctx.lineTo(w.x - 12, w.y);
    ctx.closePath(); ctx.stroke();
    ctx.lineWidth = 1;
    // etiqueta
    const tw = ctx.measureText(p.label).width + 8;
    ctx.fillStyle = 'rgba(4,6,14,0.8)';
    ctx.fillRect(w.x - tw / 2, w.y - 26, tw, 11);
    ctx.strokeStyle = `rgba(0,240,255,${0.35 + pulse * 0.3})`;
    ctx.strokeRect(w.x - tw / 2 + 0.5, w.y - 25.5, tw - 1, 10);
    ctx.fillStyle = '#bfefff';
    ctx.fillText(p.label, w.x, w.y - 18);
  }
  ctx.textAlign = 'left';
}

// ---------- dibujo de la ciudad ----------
function drawCity(t) {
  drawGround(t);
  drawSombrasNubes(t);   // nubes a ras de suelo (no lavan los objetos)
  // objetos ordenados por profundidad
  const objs = [];
  for (const b of buildings) objs.push({ d: b.gx + b.w + b.gy + b.d + 0.4, f: () => drawBuilding(b, t) });
  for (const p of props) objs.push({ d: p.gx + p.gy + 0.1, f: () => drawProp(p, t) });
  for (const n of npcs) objs.push({ d: n.gx + n.gy, f: () => { const w = gridToWorld(n.gx, n.gy); drawAgent(w.x, w.y, n, t, cam.zoom); } });
  for (const c of cars) objs.push({ d: c.gx + c.gy, f: () => drawCarBody(c.gx, c.gy, c.dir, c.color, t, false) });
  objs.push({ d: player.gx + player.gy, f: () => { const w = gridToWorld(player.gx, player.gy); drawAgent(w.x, w.y, player, t, cam.zoom); } });
  objs.sort((a, b) => a.d - b.d);
  drawLights(t);
  for (const o of objs) o.f();
  // vida del ambiente: nubes al viento + luciérnagas nocturnas
  drawNubes(t);
  drawLuciernagas(t);
  // estela neón
  for (const tr of player.trail) {
    const w = gridToWorld(tr.x, tr.y);
    ctx.fillStyle = `rgba(0,240,255,${tr.a * 0.5})`;
    ctx.fillRect(w.x - 1.5, w.y - 2, 3, 3);
  }
  // dron mascota
  if (G.dron) {
    const w = gridToWorld(player.gx, player.gy);
    const dx = w.x + Math.sin(t * 2) * 14, dy = w.y - 26 + Math.cos(t * 3) * 4;
    ctx.fillStyle = '#7a9bff';
    ctx.fillRect(dx - 3, dy - 2, 6, 3);
    ctx.fillStyle = '#c0c8ff';
    ctx.fillRect(dx - 1, dy - 3, 2, 1);
    ctx.strokeStyle = 'rgba(122,155,255,0.4)';
    ctx.beginPath(); ctx.moveTo(dx - 5, dy - 3); ctx.lineTo(dx + 5, dy - 3); ctx.stroke();
  }
  drawPuertas(t);
  drawMarkers(t);
  // etiquetas de distrito en vista estratégica
  if (G.overview) {
    ctx.textAlign = 'center';
    for (const d of distritos) {
      const w = gridToWorld(d.gx, d.gy);
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = d.color;
      ctx.shadowColor = d.color; ctx.shadowBlur = 8;
      ctx.fillText(d.nombre, w.x, w.y);
      ctx.shadowBlur = 0;
    }
    ctx.textAlign = 'left';
  }
}

// ---------- dibujo del interior actual ----------
function drawInterior(t) {
  const m = getCurrent();
  if (!m) return;
  drawInteriorGround(t);
  const objs = [];
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    if (m.tiles[y * m.w + x] === 5) objs.push({ d: x + y + 0.05, f: () => drawWallTile(x, y) });
  }
  for (const p of m.props) objs.push({ d: p.gx + p.gy + 0.05, f: () => drawIProp(p, t) });
  for (const n of m.npcs) objs.push({
    d: n.gx + n.gy, f: () => {
      const w = gridToWorld(n.gx, n.gy);
      if (n.sentado) drawSeated(w.x, w.y, n, t); else drawAgent(w.x, w.y, n, t, cam.zoom);
    }
  });
  objs.push({ d: player.gx + player.gy, f: () => { const w = gridToWorld(player.gx, player.gy); drawAgent(w.x, w.y, player, t, cam.zoom); } });
  objs.sort((a, b) => a.d - b.d);
  for (const o of objs) o.f();
  drawMarkers(t);
}

// ---------- loop principal ----------
let last = performance.now();
let miniT = 0;

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  G.tiempo += dt;
  tickReloj(dt);   // reloj del juego: 1 s real = 1 min virtual

  // fundido
  if (G.fadeDir === 1) {
    G.fade = Math.min(1, G.fade + dt * 3);
    if (G.fade >= 1) { G.fadeDir = -1; if (G.fadeCb) { const cb = G.fadeCb; G.fadeCb = null; cb(); } }
  } else if (G.fadeDir === -1) {
    G.fade = Math.max(0, G.fade - dt * 3);
    if (G.fade <= 0) G.fadeDir = 0;
  }

  if (!G.iniciado) {
    drawCielo();
    return;
  }

  // --- update ---
  if (G.modo === 'city') {
    updatePlayer(dt);
    updateCars(dt);
    setPedList([...npcs, player]);
    for (const n of npcs) n.update(dt, npcs);
    checkQuestSpots();
  } else {
    updatePlayer(dt);
    const m = getCurrent();
    if (m) for (const n of m.npcs) n.update(dt, m.npcs);
  }
  buscarInteraccion();
  updateHUD();

  // zoom suave + overview
  if (consume('m')) {
    G.overview = !G.overview;
    zoomObjetivo = G.overview ? 0.88 : (G.modo === 'city' ? 1.6 : 1.9);
    sfx.ui();
  }
  if (consume('+') || consume('=')) zoomObjetivo = clamp(zoomObjetivo * 1.2, 0.55, 2.8);
  if (consume('-')) zoomObjetivo = clamp(zoomObjetivo / 1.2, 0.55, 2.8);
  if (consume('e')) interactuar();
  cam.zoom = lerp(cam.zoom, zoomObjetivo, dt * 6);

  // cámara sigue al jugador
  const pw = gridToWorld(player.gx, player.gy);
  cam.x = lerp(cam.x, pw.x, Math.min(1, dt * 5));
  cam.y = lerp(cam.y, pw.y - 10, Math.min(1, dt * 5));

  // --- draw ---
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawCielo();
  ctx.setTransform(cam.zoom, 0, 0, cam.zoom, VW / 2 - cam.x * cam.zoom, VH / 2 - cam.y * cam.zoom);
  ctx.imageSmoothingEnabled = true;

  if (G.modo === 'city') drawCity(G.tiempo); else drawInterior(G.tiempo);

  // luz ambiente de la hora (tinte de pantalla, nunca negro total)
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawAmbiente(G.modo !== 'city');   // en interiores la noche es más suave (luces encendidas)
  ctx.setTransform(cam.zoom, 0, 0, cam.zoom, VW / 2 - cam.x * cam.zoom, VH / 2 - cam.y * cam.zoom);

  // indicador de interacción
  if (cerca) {
    const w = gridToWorld(player.gx, player.gy);
    ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(4,6,14,0.85)';
    const tw2 = ctx.measureText('[E] ' + cerca.label).width + 10;
    ctx.fillRect(w.x - tw2 / 2, w.y - 54, tw2, 12);
    ctx.fillStyle = '#39ff88';
    ctx.fillText('[E] ' + cerca.label, w.x, w.y - 45);
    ctx.textAlign = 'left';
  }

  // flecha hacia objetivo de misión fuera de pantalla
  drawOffscreenArrow();

  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // rótulo del interior actual (espacio de pantalla)
  if (G.modo !== 'city') {
    const mm = getCurrent();
    if (mm) {
      ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
      const tw = ctx.measureText(mm.name).width + 14;
      ctx.fillStyle = 'rgba(4,6,14,0.78)';
      ctx.fillRect(VW / 2 - tw / 2, 6, tw, 16);
      ctx.strokeStyle = 'rgba(0,240,255,0.4)';
      ctx.strokeRect(VW / 2 - tw / 2 + 0.5, 6.5, tw - 1, 15);
      ctx.fillStyle = '#00f0ff';
      ctx.fillText(mm.name, VW / 2, 17);
      ctx.textAlign = 'left';
    }
  }

  // fundido
  if (G.fade > 0) {
    ctx.fillStyle = `rgba(3,4,10,${G.fade})`;
    ctx.fillRect(0, 0, VW, VH);
  }

  // minimapa refresco
  miniT += dt;
  if (miniT > 1) { miniT = 0; drawMini(); }
}

function drawOffscreenArrow() {
  for (const q of QUESTS) {
    if (qEstado(q.id) !== 'activa') continue;
    const s = G.quests[q.id];
    let tx, ty;
    if (q.spots) { const target = spots[q.spots[Math.min(s.paso || 0, q.spots.length - 1)]]; if (!target || G.modo !== 'city') continue; tx = target.gx; ty = target.gy; }
    else { const m = getCurrent(); const pool = G.modo === 'city' ? npcs : (m ? m.npcs : []); const n = pool.find(x => x.name === q.npc); if (!n) continue; tx = n.gx; ty = n.gy; }
    const w = gridToWorld(tx, ty);
    const s2 = toScreen(w.x, w.y);
    if (s2.sx > 10 && s2.sx < VW - 10 && s2.sy > 10 && s2.sy < VH - 10) continue;
    const ang = Math.atan2(s2.sy - VH / 2, s2.sx - VW / 2);
    const ax = VW / 2 + Math.cos(ang) * (VW / 2 - 26), ay = VH / 2 + Math.sin(ang) * (VH / 2 - 26);
    ctx.save();
    ctx.translate(ax, ay); ctx.rotate(ang);
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-5, -5); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

requestAnimationFrame(loop);

// parámetros de depuración: ?tp=gx,gy & ?auto=1 & ?q=PID & ?map=apto
try {
  const qs = new URLSearchParams(location.search);
  // restaurar última posición del jugador (vida diaria: vuelves a donde estabas)
  if (!qs.get('tp') && !qs.get('map')) {
    const pos = JSON.parse(localStorage.getItem('alice_v7_pos') || 'null');
    if (pos) {
      if (pos.map && MAPS[pos.map]) {
        const mm = setCurrent(pos.map);
        G.modo = 'interior'; G.mapId = pos.map;
        player.gx = mm.spawn[0]; player.gy = mm.spawn[1];
      } else if (typeof pos.gx === 'number') {
        player.gx = pos.gx; player.gy = pos.gy;
      }
    }
  }
  if (qs.get('tp')) {
    const p = qs.get('tp').split(',').map(Number);
    player.gx = p[0]; player.gy = p[1];
  }
  if (qs.get('map')) {
    const id = qs.get('map');
    const m = setCurrent(id);
    if (m) { G.modo = 'interior'; G.mapId = id; player.gx = m.spawn[0]; player.gy = m.spawn[1]; }
  }
  if (qs.get('hora')) {
    // depuración de horarios: ?hora=21 → 21:00
    const hm = qs.get('hora').split(',');
    G.relojMin = parseInt(hm[0], 10) * 60 + (hm[1] ? parseInt(hm[1], 10) : 0);
  }
  if (qs.get('auto')) {
    setTimeout(() => document.getElementById('btn-entrar').click(), 300);
    if (qs.get('q')) setTimeout(() => aceptarQuest(qs.get('q')), 1200);
  }
} catch (e) { }

// guardar posición al salir (throttle 2s)
let posT = 0;
setInterval(() => {
  if (!G.iniciado) return;
  posT++;
  if (posT % 4 !== 0) return;
  try { localStorage.setItem('alice_v7_pos', JSON.stringify({ map: G.modo === 'city' ? null : G.mapId, gx: player.gx, gy: player.gy })); } catch (e) { }
}, 500);

addEventListener('beforeunload', saveState);
