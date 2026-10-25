// ============================================================
// ALICE CITY v5 — MAIN (loop, interacciones, transiciones)
// ============================================================
import { G, ctx, cam, VW, VH, gridToWorld, worldToGrid, toScreen, keys, consume, clearPressed, clamp, lerp, dist2, fadeTo, addCoins, saveState, audioInit, sfx, onCoinsChange } from './engine.js';
import { buildCity, spots, buildings, props, crosswalks, distritos, isSolid, tile as cityTileArr } from './city.js';
import { drawGround, drawBuilding, drawProp, drawLights, drawCarBody } from './draw.js';
import { player, updatePlayer, npcs, spawnNPCs, drawAgent, drawSeated, setCarBlock } from './agents.js';
import { cars, spawnCars, updateCars, drawCars, carBlock, setPedList } from './cars.js';
import { buildInterior, itile, isolid, iprops, inpcs, racks, isolidAt, drawInteriorGround, drawWallTile, drawIProp, drawINpcs, IC, IR } from './interior.js';
import { initUI, updateHUD, pushLog, toast, chatPush, startBots, qEstado, aceptarQuest, completarQuest, QUESTS, applyEquipped, drawMini, renderTareas } from './ui.js';

// ---------- arranque ----------
buildCity();
buildInterior();
spawnNPCs();
spawnCars();
setCarBlock(carBlock);
applyEquipped();

// primera visita: bono de bienvenida
if (!localStorage.getItem('alice_v5_hola')) {
  localStorage.setItem('alice_v5_hola', '1');
  addCoins(25, 'Bono de bienvenida ALICE CITY v5');
}

// hooks globales para ui.js (minimapa)
window.__aliceTileAt = (x, y) => G.modo === 'city' ? (crosswalks.has(y * 24 + x) ? 4 : cityTileArr[y * 24 + x]) : 1;
window.__aliceCars = cars;
// handle de depuración / integración
window.__alice = { G, player, npcs, cars, teleport: (gx, gy) => { player.gx = gx; player.gy = gy; } };

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
  chatPush('Ada', 'Bienvenido a ALICE CITY v5, operador. La ciudad está bajo control.', '#ffd23f');
  setTimeout(() => toast('Usa WASD · E interactuar · M mapa'), 800);
});

// ---------- cámara ----------
cam.x = gridToWorld(player.gx, player.gy).x;
cam.y = gridToWorld(player.gx, player.gy).y;
let zoomObjetivo = 1;

addEventListener('wheel', e => {
  if (!G.iniciado) return;
  zoomObjetivo = clamp(zoomObjetivo * (e.deltaY > 0 ? 0.9 : 1.1), 0.62, 1.7);
  G.overview = false;
});

// ---------- interacciones ----------
let cerca = null;   // {tipo, ref, label}
function buscarInteraccion() {
  cerca = null;
  if (G.modo === 'city') {
    // puerta HQ
    if (dist2(player.gx, player.gy, spots.doorAlice.gx, spots.doorAlice.gy) < 0.55) {
      cerca = { tipo: 'puerta', label: 'ENTRAR AL HQ' };
      return;
    }
    // NPCs
    for (const n of npcs) {
      if (dist2(player.gx, player.gy, n.gx, n.gy) < 0.6) {
        cerca = { tipo: 'npc', ref: n, label: 'HABLAR CON ' + n.name };
        return;
      }
    }
  } else {
    for (const n of inpcs) {
      if (dist2(player.gx, player.gy, n.gx, n.gy) < 0.65) {
        cerca = { tipo: 'npc', ref: n, label: 'HABLAR CON ' + n.name };
        return;
      }
    }
    for (const r of racks) {
      if (!r.done && dist2(player.gx, player.gy, r.gx, r.gy) < 0.6) {
        cerca = { tipo: 'rack', ref: r, label: 'ACTIVAR RACK' };
        return;
      }
    }
    if (player.gy > 10.6) {
      cerca = { tipo: 'salida', label: 'SALIR A LA CIUDAD' };
    }
  }
}

function interactuar() {
  if (!cerca) return;
  sfx.talk();
  if (cerca.tipo === 'puerta') {
    fadeTo(() => {
      G.modo = 'hq';
      G.v5hq = true;
      saveState();
      player.gx = 8.5; player.gy = 10.4;
      cam.x = gridToWorld(8.5, 10.4).x; cam.y = gridToWorld(8.5, 10.4).y;
      zoomObjetivo = 1.15;
      pushLog('Acceso al HQ Torre Alice', 'cian');
      chatPush('Ada', 'Recepción del HQ. La Jefa Vega te espera en conferencia.', '#ffd23f');
      renderTareas();
    });
  } else if (cerca.tipo === 'salida') {
    fadeTo(() => {
      G.modo = 'city';
      player.gx = spots.doorAlice.gx; player.gy = spots.doorAlice.gy + 0.4;
      cam.x = gridToWorld(player.gx, player.gy).x; cam.y = gridToWorld(player.gx, player.gy).y;
      zoomObjetivo = 1;
      pushLog('Salida al distrito central', 'cian');
    });
  } else if (cerca.tipo === 'npc') {
    hablarCon(cerca.ref);
  } else if (cerca.tipo === 'rack') {
    cerca.ref.done = true;
    sfx.moneda();
    pushLog(`Rack activado (${racks.filter(r => r.done).length}/3)`, 'verde');
    toast(`Rack activado ${racks.filter(r => r.done).length}/3`);
    if (racks.every(r => r.done) && qEstado('P7') === 'activa') completarQuest('P7');
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
  Leo: ['Estos racks no se apagan ni por navidad.', 'Si se prenden en verde, todo fluye.']
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
      // completar misiones de tipo npc al hablar
      const q = QUESTS.find(x => x.id === n.questId);
      if (!q.spots) completarQuest(n.questId);
      else n.talk = 'Sigue con la misión: ' + q.d;
    }
  }
}

// ---------- progreso de misiones por zonas ----------
function checkQuestSpots() {
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
  const pool = G.modo === 'city' ? npcs : inpcs;
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
  // exclamación sobre NPCs con misión disponible (solo del modo actual)
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
  // haz vertical
  ctx.globalAlpha = 0.22;
  ctx.beginPath(); ctx.moveTo(w.x, w.y - 40); ctx.lineTo(w.x, w.y);
  ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.stroke();
  ctx.globalAlpha = 1; ctx.lineWidth = 1;
}

// ---------- dibujo de la ciudad ----------
function drawCity(t) {
  drawGround(t);
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

// ---------- dibujo del HQ ----------
function drawHQ(t) {
  drawInteriorGround();
  const objs = [];
  for (let y = 0; y < IR; y++) for (let x = 0; x < IC; x++) {
    if (itile[y * IC + x] === 5) objs.push({ d: x + y + 0.05, f: () => drawWallTile(x, y) });
  }
  for (const p of iprops) objs.push({ d: p.gx + p.gy + 0.05, f: () => drawIProp(p, t) });
  for (const n of inpcs) objs.push({ d: n.gx + n.gy, f: () => { const w = gridToWorld(n.gx, n.gy); drawSeatedAt(w, n, t); } });
  objs.push({ d: player.gx + player.gy, f: () => { const w = gridToWorld(player.gx, player.gy); drawAgent(w.x, w.y, player, t, cam.zoom); } });
  objs.sort((a, b) => a.d - b.d);
  for (const o of objs) o.f();
  drawMarkers(t);
}
function drawSeatedAt(w, n, t) { drawSeated(w.x, w.y, n, t); }

// ---------- loop principal ----------
let last = performance.now();
let miniT = 0;

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  G.tiempo += dt;

  // fundido
  if (G.fadeDir === 1) {
    G.fade = Math.min(1, G.fade + dt * 3);
    if (G.fade >= 1) { G.fadeDir = -1; if (G.fadeCb) { const cb = G.fadeCb; G.fadeCb = null; cb(); } }
  } else if (G.fadeDir === -1) {
    G.fade = Math.max(0, G.fade - dt * 3);
    if (G.fade <= 0) G.fadeDir = 0;
  }

  if (!G.iniciado) {
    ctx.fillStyle = '#05060f'; ctx.fillRect(0, 0, VW, VH);
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
    for (const n of inpcs) n.update(dt, inpcs);
  }
  buscarInteraccion();
  updateHUD();

  // zoom suave + overview
  if (consume('m')) {
    G.overview = !G.overview;
    zoomObjetivo = G.overview ? 0.62 : 1;
    sfx.ui();
  }
  if (consume('+') || consume('=')) zoomObjetivo = clamp(zoomObjetivo * 1.2, 0.62, 1.7);
  if (consume('-')) zoomObjetivo = clamp(zoomObjetivo / 1.2, 0.62, 1.7);
  if (consume('e')) interactuar();
  cam.zoom = lerp(cam.zoom, zoomObjetivo, dt * 6);

  // cámara sigue al jugador
  const pw = gridToWorld(player.gx, player.gy);
  cam.x = lerp(cam.x, pw.x, Math.min(1, dt * 5));
  cam.y = lerp(cam.y, pw.y - 10, Math.min(1, dt * 5));

  // --- draw ---
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#05060f';
  ctx.fillRect(0, 0, VW, VH);
  ctx.setTransform(cam.zoom, 0, 0, cam.zoom, VW / 2 - cam.x * cam.zoom, VH / 2 - cam.y * cam.zoom);
  ctx.imageSmoothingEnabled = false;

  if (G.modo === 'city') drawCity(G.tiempo); else drawHQ(G.tiempo);

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

  // vúltas al espacio de pantalla: HUD canvas-level (none)
  ctx.setTransform(1, 0, 0, 1, 0, 0);

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
    else { const pool = G.modo === 'city' ? npcs : inpcs; const n = pool.find(x => x.name === q.npc); if (!n) continue; tx = n.gx; ty = n.gy; }
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

// parámetros de depuración: ?tp=gx,gy (teleport) & ?auto=1 (saltar splash) & ?q=PID (aceptar misión)
try {
  const qs = new URLSearchParams(location.search);
  if (qs.get('tp')) {
    const p = qs.get('tp').split(',').map(Number);
    player.gx = p[0]; player.gy = p[1];
  }
  if (qs.get('auto')) {
    setTimeout(() => document.getElementById('btn-entrar').click(), 300);
    if (qs.get('q')) setTimeout(() => aceptarQuest(qs.get('q')), 1200);
  }
} catch (e) { }

// prevenir scroll con flechas ya en engine; guardar partida al salir
addEventListener('beforeunload', saveState);
