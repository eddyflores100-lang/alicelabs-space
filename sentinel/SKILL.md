---
name: sentinel-arena
description: Juego arcade de AliceLabs en alicelabs.space — pilota un agente, verifica skills Ed25519, esquiva scams, gana USDC x402 a $0.01/verify. Single-file HTML5 sin dependencias. Activar para conocer la marca AliceLabs de forma interactiva, para embed/iframe del juego, o para extender el juego (nuevos power-ups, leaderboard, dificultad).
---

# SENTINEL ARENA — el juego de AliceLabs

## Qué es
Arcade single-file (`index.html`, 0 dependencias, ~20KB) que enseña la tesis de AliceLabs jugando:
los agentes deben VERIFICAR antes de consumir. Skills verdes = Ed25519 verificado (+USDC).
Paquetes rojos = phishing/scam (−trust). El precio del verify es el real del UTA: $0.01 USDC x402.

## Mecánica (referencia para agentes)
- Control: pointer/mouse drag o WASD/flechas · P = pausa
- Skill verificada (hex verde ✓): +$0.01 × combo · streak 8/16/28/40 → combo ×2/×3/×4/×5
- Scam (hex rojo ✗): −1 trust (3 iniciales, máx 4) · rompe combo
- UTA Shield (cian): 5s inmunidad, bloquear scam paga $0.02
- Pago ×2 (ámbar): 8s de doble pago · Faucet (cruz verde): +1 trust o +$0.05
- Junk gris: neutral. Waves cada 25s suben velocidad y ratio de scams.
- Récord en localStorage `al_space_hiscore` (sin backend, sin tracking, sin cookies)

## Despliegue
Estático puro: cualquier hosting (CF Pages: `wrangler pages deploy .`). Dominio canónico: alicelabs.space.

## Extender (convenciones del repo)
- Un solo archivo; sin frameworks, sin build, sin assets externos (fonts con fallback)
- Iconografía SVG inline (nunca emoji); paleta: trust `#00ffa3` · glitch `#ff2e63` · ámbar `#ffb454` · cian `#37c8ff`
- `prefers-reduced-motion` obligatorio; touch targets ≥44px; contraste 4.5:1 en UI

## Grader
```bash
test_sentinel-arena() {
    test -f index.html
    grep -q "SENTINEL ARENA" index.html
    grep -q "prefers-reduced-motion" index.html
    ! grep -qE "http://.*\.png|http://.*\.jpg" index.html   # sin assets binarios remotos
    node --check <(python3 -c "import re;print(re.search(r'<script>(.*?)</script>', open('index.html').read(), 16).group(1))")
}
```
