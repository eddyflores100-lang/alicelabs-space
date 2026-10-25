// ============ ALICE CITY — Billetera de Alicoins (ALC) ============
// Fuente única de verdad del saldo. Persistencia local + historial.
// La conversión ALC → Solana/USDC es el roadmap x402 de AliceLabs (panel Billetera, honesto).
import { emitir } from './eventos.js';

const KEY_SALDO = 'alice_monedas';      // compat con la v3
const KEY_HIST = 'alice_historial_v1';
const KEY_ADDR = 'alice_addr_v1';

function dirDemo() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789abcdefghijkmnopqrstuvwxyz';
  let s = 'ALX';
  for (let i = 0; i < 40; i++) s += A[(Math.random() * A.length) | 0];
  return s;
}

export function crearBilletera() {
  const estado = {
    balance: parseInt(localStorage.getItem(KEY_SALDO) || '0', 10) || 0,
    historial: JSON.parse(localStorage.getItem(KEY_HIST) || '[]'),
    addr: localStorage.getItem(KEY_ADDR) || dirDemo(),
  };
  if (!localStorage.getItem(KEY_ADDR)) localStorage.setItem(KEY_ADDR, estado.addr);

  const guardar = () => {
    localStorage.setItem(KEY_SALDO, String(estado.balance));
    localStorage.setItem(KEY_HIST, JSON.stringify(estado.historial.slice(0, 30)));
  };

  function registrar(signo, n, motivo) {
    estado.historial.unshift({ signo, n, motivo, ts: Date.now() });
    estado.historial = estado.historial.slice(0, 30);
  }

  function ganar(n, motivo = 'juego') {
    estado.balance += n;
    registrar('+', n, motivo);
    guardar();
    emitir('saldo', estado.balance);
    if (motivo === 'tienda') emitir('compra', n);
    return estado.balance;
  }

  function gastar(n, motivo = 'tienda') {
    if (estado.balance < n) return false;
    estado.balance -= n;
    registrar('−', n, motivo);
    guardar();
    emitir('saldo', estado.balance);
    if (motivo === 'tienda') emitir('compra', n);
    return true;
  }

  // gancho para la tarea "acumula 200 ALC"
  emitir('saldo', estado.balance);

  return {
    estado, ganar, gastar, guardar,
    get balance() { return estado.balance; },
  };
}

// singleton compartido por toda la ciudad
export const billetera = crearBilletera();
