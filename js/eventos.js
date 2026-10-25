// ============ ALICE CITY — Bus de eventos (pub/sub mínimo) ============
// Los sistemas emiten ('minar', 'contrato', 'zona', 'dialogo'…) y las tareas escuchan.
const oyentes = {};

export function on(evento, fn) {
  (oyentes[evento] ||= []).push(fn);
}

export function emitir(evento, dato = null) {
  for (const fn of oyentes[evento] || []) {
    try { fn(dato); } catch (e) { console.error('evento', evento, e); }
  }
}
