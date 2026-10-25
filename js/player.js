// ============ ALICE CITY — Jugador: controles y cámara tercera persona ============
import * as THREE from 'three';
import { col } from './colisiones.js';

export function crearJugador(escena, camara, dom, personajeApi, spawn) {
  const estado = {
    activo: true,
    teclas: {},
    yaw: 0, pitch: .32, dist: 7.5,
    arrastrando: false, ux: 0, uy: 0,
    velocidadBase: 4.2,
    animo: 100,
    moviendose: false,
  };
  personajeApi.grupo.position.copy(spawn);
  escena.add(personajeApi.grupo);

  // teclado
  const down = (e) => {
    estado.teclas[e.code] = true;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(e.code)) e.preventDefault();
  };
  const up = (e) => { estado.teclas[e.code] = false; };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);

  // ratón: orbitar arrastrando
  dom.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    estado.arrastrando = true; estado.ux = e.clientX; estado.uy = e.clientY;
  });
  window.addEventListener('pointerup', () => { estado.arrastrando = false; });
  window.addEventListener('pointermove', (e) => {
    if (!estado.arrastrando) return;
    const dx = e.clientX - estado.ux, dy = e.clientY - estado.uy;
    estado.ux = e.clientX; estado.uy = e.clientY;
    estado.yaw -= dx * .0045;
    estado.pitch = Math.max(-.1, Math.min(1.15, estado.pitch + dy * .0035));
  });
  dom.addEventListener('wheel', (e) => {
    estado.dist = Math.max(3.2, Math.min(16, estado.dist + e.deltaY * .008));
    e.preventDefault();
  }, { passive: false });

  // táctil básico: mitad izquierda = mover, derecha = mirar
  const joystick = { activo: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0 };
  dom.addEventListener('touchstart', (e) => {
    for (const t of e.changedTouches) {
      if (t.clientX < window.innerWidth / 2 && !joystick.activo) {
        joystick.activo = true; joystick.id = t.identifier;
        joystick.ox = t.clientX; joystick.oy = t.clientY; joystick.dx = 0; joystick.dy = 0;
      }
    }
  }, { passive: true });
  dom.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joystick.id) {
        joystick.dx = (t.clientX - joystick.ox) / 60;
        joystick.dy = (t.clientY - joystick.oy) / 60;
      }
    }
  }, { passive: true });
  dom.addEventListener('touchend', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joystick.id) { joystick.activo = false; joystick.id = null; joystick.dx = 0; joystick.dy = 0; }
    }
  }, { passive: true });

  const frente = new THREE.Vector3();
  function update(dt, t, limites = null) {
    const pj = personajeApi;
    let mx = 0, mz = 0;
    if (estado.teclas['KeyW'] || estado.teclas['ArrowUp']) mz += 1;
    if (estado.teclas['KeyS'] || estado.teclas['ArrowDown']) mz -= 1;
    if (estado.teclas['KeyA'] || estado.teclas['ArrowLeft']) mx -= 1;
    if (estado.teclas['KeyD'] || estado.teclas['ArrowRight']) mx += 1;
    if (joystick.activo) { mx += joystick.dx; mz -= joystick.dy; }

    const corre = !!estado.teclas['ShiftLeft'] || !!estado.teclas['ShiftRight'];
    const vel = estado.velocidadBase * (corre ? 1.75 : 1);
    estado.moviendose = (mx !== 0 || mz !== 0);

    if (estado.activo && estado.moviendose) {
      // dirección relativa a la cámara
      frente.set(Math.sin(estado.yaw), 0, Math.cos(estado.yaw)).multiplyScalar(-1);
      const derecha = new THREE.Vector3(-frente.z, 0, frente.x);
      const dir = new THREE.Vector3()
        .addScaledVector(frente, mz)
        .addScaledVector(derecha, mx);
      if (dir.lengthSq() > 0) {
        dir.normalize();
        // colisión con deslizamiento por ejes + límites del mundo
        if (!estado.sentado) col.mover(pj.grupo.position, dir.x * vel * dt, dir.z * vel * dt, .45);
        const ang = Math.atan2(dir.x, dir.z);
        let dif = ang - pj.grupo.rotation.y;
        while (dif > Math.PI) dif -= 2 * Math.PI;
        while (dif < -Math.PI) dif += 2 * Math.PI;
        pj.grupo.rotation.y += dif * Math.min(1, dt * 10);
      }
      pj.update(t, true);
    } else {
      pj.update(t, false);
    }
    // altura del suelo (muelle del lago) salvo cuando está sentado
    if (!estado.sentado) pj.grupo.position.y = col.alto(pj.grupo.position.x, pj.grupo.position.z);

    // cámara en tercera persona
    const foco = pj.grupo.position.clone().add(new THREE.Vector3(0, 1.4, 0));
    const offset = new THREE.Vector3(
      Math.sin(estado.yaw) * Math.cos(estado.pitch),
      Math.sin(estado.pitch) + .25,
      Math.cos(estado.yaw) * Math.cos(estado.pitch)
    ).multiplyScalar(estado.dist);
    camara.position.copy(foco).add(offset);
    camara.lookAt(foco);
  }

  function seguir(posicion, suaviza = .04) {
    // cámara para modo observación de agentes
    const foco = posicion.clone().add(new THREE.Vector3(0, 1.3, 0));
    camara.position.lerp(foco.clone().add(new THREE.Vector3(3.4, 3.2, 3.4)), suaviza);
    camara.lookAt(foco);
  }

  return { estado, update, seguir, personaje: personajeApi };
}
