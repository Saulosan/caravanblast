# Caravan Blast! - Estrutura Modular v2

## Como usar
1. Descompacte este ZIP na pasta do seu projeto
2. Mova seus assets para as pastas corretas:
   - GIFs  -> assets/sprites/
   - PNGs  -> assets/bg/
   - MP3s  -> assets/bgm/
3. Abra index.html no navegador (ou via Live Server)

## Arquivos JS (ordem de carregamento)
| Arquivo       | Responsabilidade                        |
|---------------|-----------------------------------------|
| utils.js      | clamp, ang, rOvlp, cRHit               |
| config.js     | constantes (VW, VH, SCALE, etc.)       |
| audio.js      | BGM, playBGM, stopBGM                  |
| assets.js     | canvas, ctx, gc[], bgLayers, initAssets|
| input.js      | teclado, gamepad                       |
| state.js      | variaveis globais, resetGame()         |
| player.js     | movimento, tiro, laser, dmgPlayer      |
| enemies.js    | ondas, spawn, update, kill             |
| boss.js       | spawn, update, morte, hitBoss          |
| collision.js  | deteccao de colisoes                   |
| hud.js        | update do HUD/UI                       |
| render.js     | todas as funcoes de draw               |
| main.js       | loop, update, combo, medalhas          |
