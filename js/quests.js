// ============ ALICE CITY — Tareas con recompensas en Alicoins ============
// Trabajo → recompensa. Escuchan el bus de eventos; progreso persistente; reclamo manual.
import { on, emitir } from './eventos.js';
import { billetera } from './wallet.js';
import { sfx } from './sfx.js';

const KEY = 'alice_tareas_v1';

export const TAREAS = [
  { id: 't_min3',   ico: '⛏️', titulo: 'Turno de mina',        desc: 'Extrae 3 cristales en las Minas del Oeste',     meta: 3,   premio: 30, evento: 'minar' },
  { id: 't_con2',   ico: '📦', titulo: 'Repartidor confiable', desc: 'Completa 2 contratos del mercado',              meta: 2,   premio: 45, evento: 'contrato' },
  { id: 't_casa5',  ico: '🏗️', titulo: 'Obra en marcha',       desc: 'Coloca 5 piezas en tu parcela del norte',       meta: 5,   premio: 35, evento: 'construir' },
  { id: 't_vis4',   ico: '🗺️', titulo: 'Explorador urbano',    desc: 'Visita 4 zonas distintas de la ciudad',         meta: 4,   premio: 40, evento: 'zona' },
  { id: 't_soc3',   ico: '💬', titulo: 'Sociable',             desc: 'Habla con 3 agentes de la ciudad (E cerca)',    meta: 3,   premio: 25, evento: 'dialogo' },
  { id: 't_rel1',   ico: '😎', titulo: 'Descanso merecido',    desc: 'Relájate en un banco del Parque Sur',           meta: 1,   premio: 15, evento: 'relax' },
  { id: 't_dec1',   ico: '🧢', titulo: 'Estilo propio',        desc: 'Compra un accesorio en la tienda del editor',   meta: 1,   premio: 30, evento: 'compra' },
  { id: 't_ric200', ico: '🪙', titulo: 'Primera alcancía',     desc: 'Acumula 200 Alicoins en tu billetera',          meta: 200, premio: 60, evento: 'saldo' },
];

export function crearTareas() {
  const estado = JSON.parse(localStorage.getItem(KEY) || 'null') || {
    progreso: {}, reclamadas: {}, zonas: [],
  };
  const guardar = () => localStorage.setItem(KEY, JSON.stringify(estado));

  const lista = (id) => TAREAS.find(t => t.id === id);

  function progresar(id, n = 1) {
    const t = lista(id);
    if (!t || estado.reclamadas[id]) return;
    estado.progreso[id] = Math.min(t.meta, (estado.progreso[id] || 0) + n);
    if (estado.progreso[id] >= t.meta) {
      emitir('tareaLista', t);
      sfx.pop();
    }
    guardar();
  }

  // ----- suscripciones al bus -----
  for (const t of TAREAS) {
    if (t.evento === 'saldo') {
      on('saldo', (saldo) => {
        if (saldo >= t.meta) { estado.progreso[t.id] = t.meta; guardar(); }
      });
      // estado inicial (el evento de arranque puede haberse emitido antes de suscribir)
      if (billetera.balance >= t.meta) { estado.progreso[t.id] = t.meta; guardar(); }
    } else if (t.evento === 'zona') {
      on('zona', (nombre) => {
        if (!estado.zonas.includes(nombre)) {
          estado.zonas.push(nombre);
          progresar(t.id, 1);
        }
      });
    } else {
      on(t.evento, () => progresar(t.id, 1));
    }
  }

  function reclamables() {
    return TAREAS.filter(t => !estado.reclamadas[t.id] && (estado.progreso[t.id] || 0) >= t.meta);
  }

  function reclamar(id) {
    const t = lista(id);
    if (!t || estado.reclamadas[id] || (estado.progreso[id] || 0) < t.meta) return false;
    estado.reclamadas[id] = true;
    guardar();
    billetera.ganar(t.premio, `Tarea: ${t.titulo}`);
    sfx.victoria();
    emitir('tareaReclamada', t);
    return true;
  }

  return { estado, TAREAS, progresar, reclamables, reclamar, guardar };
}
