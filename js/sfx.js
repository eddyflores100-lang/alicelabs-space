// ============ ALICE CITY — Sonidos sintetizados (sin archivos) ============
let ctx = null, activo = true;
function ac() {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function tono(freq, dur, tipo = 'sine', vol = .12, slide = 0) {
  if (!activo) return;
  const a = ac(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = tipo; o.frequency.value = freq;
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), a.currentTime + dur);
  g.gain.setValueAtTime(vol, a.currentTime);
  g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + dur);
  o.connect(g).connect(a.destination);
  o.start(); o.stop(a.currentTime + dur);
}
export const sfx = {
  click:   () => tono(660, .07, 'square', .06),
  moneda:  () => { tono(880, .09, 'square', .08); setTimeout(() => tono(1320, .12, 'square', .08), 70); },
  minar:   () => tono(220, .15, 'sawtooth', .1, -80),
  colocar: () => tono(330, .1, 'triangle', .12),
  romper:  () => tono(160, .18, 'sawtooth', .12, -60),
  victoria:() => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tono(f, .18, 'triangle', .12), i * 130)); },
  pop:     () => tono(520, .06, 'sine', .08, 200),
  toggle:  () => { activo = !activo; return activo; },
};
