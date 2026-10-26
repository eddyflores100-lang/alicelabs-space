// ============================================================
// ALICE CITY v6 — CONTROLES TÁCTILES
// Joystick virtual (izquierda) + botones E / M / zoom (derecha).
// En pantallas táctiles el menú y el chat se colapsan a botones.
// ============================================================
import { keys, pressKey } from './engine.js';

const esTactil = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window ||
  new URLSearchParams(location.search).has('touch');

export function initTouch() {
  // botones de UI móvil siempre disponibles en pantallas chicas
  if (esTactil || innerWidth < 760) document.body.classList.add('movil');
  if (!esTactil) {
    // escritorio: simulador de joystick para QA automatizado
    window.__touchSim = {
      on: (dir) => {
        const map = { up: ['w'], down: ['s'], left: ['a'], right: ['d'] };
        for (const k of ['w', 'a', 's', 'd']) keys[k] = false;
        if (dir) for (const k of map[dir] || []) keys[k] = true;
      }
    };
    return;
  }
  document.body.classList.add('touch');
  window.__esTouch = true;

  const ui = document.createElement('div');
  ui.id = 'touch-ui';
  ui.innerHTML = `
    <div id="joy"><div id="knob"></div></div>
    <div id="tbtns">
      <button class="tbtn big" data-k="e">E</button>
      <button class="tbtn" data-k="r" title="Convocar reunión">📣</button>
      <button class="tbtn" data-k="m">MAPA</button>
      <button class="tbtn mini" data-k="+">+</button>
      <button class="tbtn mini" data-k="-">−</button>
    </div>`;
  document.body.appendChild(ui);

  // ---- joystick ----
  const joy = document.getElementById('joy');
  const knob = document.getElementById('knob');
  const R = 42;                      // radio útil del knob
  let activo = false, jid = null;
  let lastKeys = new Set();

  function aplica(dx, dy) {
    // 8 direcciones en espacio de PANTALLA (arriba=W, derecha=D…)
    const ang = Math.atan2(dy, dx);
    const mag = Math.hypot(dx, dy);
    const set = new Set();
    if (mag > 12) {
      const deg = ang * 180 / Math.PI; // -180..180, 0=derecha, -90=arriba, 90=abajo
      if (deg > -157.5 && deg < -22.5) set.add('w');        // sector arriba
      if (deg > 22.5 && deg < 157.5) set.add('s');          // sector abajo
      if (deg > -67.5 && deg < 67.5) set.add('d');          // sector derecha
      if (deg < -112.5 || deg > 112.5) set.add('a');        // sector izquierda
      // diagonales: caen en dos sectores → dos teclas (w+d, d+s, s+a, a+w)
    }
    // apagar las que ya no van
    for (const k of lastKeys) if (!set.has(k)) keys[k] = false;
    for (const k of set) keys[k] = true;
    lastKeys = set;
    // knob visual
    const cl = Math.min(mag, R);
    const nx = mag ? Math.cos(ang) * cl : 0;
    const ny = mag ? Math.sin(ang) * cl : 0;
    knob.style.transform = `translate(${nx}px, ${ny}px)`;
  }

  function suelta() {
    activo = false; jid = null;
    for (const k of lastKeys) keys[k] = false;
    lastKeys = new Set();
    knob.style.transform = 'translate(0px, 0px)';
    joy.classList.remove('on');
  }

  joy.addEventListener('pointerdown', e => {
    activo = true; jid = e.pointerId;
    joy.setPointerCapture(e.pointerId);
    joy.classList.add('on');
    mueve(e);
    e.preventDefault();
  });
  function mueve(e) {
    if (!activo || e.pointerId !== jid) return;
    const r = joy.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    aplica(e.clientX - cx, e.clientY - cy);
    e.preventDefault();
  }
  joy.addEventListener('pointermove', mueve);
  joy.addEventListener('pointerup', suelta);
  joy.addEventListener('pointercancel', suelta);
  joy.addEventListener('lostpointercapture', suelta);

  // ---- botones de acción ----
  ui.querySelectorAll('.tbtn').forEach(b => {
    const k = b.dataset.k;
    const down = e => { pressKey(k, 220); b.classList.add('on'); e.preventDefault(); };
    const up = e => { b.classList.remove('on'); e.preventDefault(); };
    b.addEventListener('pointerdown', down);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('pointerleave', up);
  });

  // ---- toggles de paneles en móvil (menú / chat) ----
  const tgM = document.getElementById('tg-menu');
  const tgC = document.getElementById('tg-chat');
  if (tgM) tgM.addEventListener('click', () => {
    document.body.classList.toggle('menu-open');
    document.body.classList.remove('chat-open');
  });
  if (tgC) tgC.addEventListener('click', () => {
    document.body.classList.toggle('chat-open');
    document.body.classList.remove('menu-open');
  });

  // expuesto para QA automatizado
  window.__touchSim = { on: (dir) => { if (dir) aplica(dir === 'up' ? 0 : dir === 'right' ? 99 : dir === 'left' ? -99 : 0, dir === 'up' ? -99 : dir === 'down' ? 99 : 0); else suelta(); } };
}

function G_setTouchFlag() {
  window.__esTouch = true;
}
