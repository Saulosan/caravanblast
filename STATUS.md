# Caravan Blast! — Status do Projeto

**Atualizado:** 10 Jun 2026 (fim da sprint Cursor)  
**Autor:** Saulo Santiago (SauloSan)  
**Motor:** HTML5 Canvas / JavaScript puro  
**Viewport:** 480×640 (TATE)  
**Spec de referência:** `caravan-blast-spec.pdf`  
**Cache:** `index.html` → `?v=25` (incrementar em todos os `<script>` e no CSS após mudanças)

---

## Visão geral

Shmup vertical em **Caravan Mode**: maximizar pontuação numa sessão com tempo limitado (timer regressivo ainda planejado). Derrotar o boss **Gracioli** antes do fim do tempo é o objetivo principal de uma run forte.

---

## Arquitetura (18 módulos)

| Arquivo | Função |
|---------|--------|
| `utils.js` | Geometria (`clamp`, `ang`, `rOvlp`, `cRHit`) |
| `config.js` | Constantes, colunas, bezels, filtros, boss/HUD/spritefont |
| `audio.js` | BGM, vozes, SFX, loops, fades, `AUDIO_VOL` |
| `assets.js` | Canvas, GIFs, spritesheets, BG, title logo, resize |
| `input.js` | Teclado + gamepad |
| `state.js` | Estado global, transições, FX, FPS, `resetGame()` |
| `player.js` | Movimento, animação, morte, integração com armas |
| **`weapons.js`** | **Tiros básicos (R/G/P), laser/míssil, cápsulas, debug J/H/K/L** |
| `enemies.js` | Templates, ondas, tiros, rajadas, sparks |
| `boss.js` | Boss Gracioli, laser, carga, morte, warning flow |
| `collision.js` | Colisões, laser block, míssil em área, intercept de tiros |
| `hud.js` | HUD lateral DOM (extra quando painéis visíveis) |
| `settings.js` | Menus pause/options em **subníveis** (sem abas) |
| `bezel.js` | Overlay bezel 16:9 |
| `postfx.js` | CRT, filtros, color bleeding |
| **`spritefont.js`** | Fonte bitmap basic-silver/orange/green (16×16) |
| `render.js` | Desenho, HUD in-game, menus, título, FPS |
| `main.js` | Loop, estados de app, fluxo de fase |

**Ordem de carregamento:** … → `collision.js` → `hud.js` → `settings.js` → `bezel.js` → `postfx.js` → **`spritefont.js`** → `render.js` → `main.js`

---

## Implementado nesta sprint ✅

### Sistema de armas e power-ups (`weapons.js`)
- [x] **3 tiros básicos** (vermelho / verde / roxo), 5 níveis cada, config data-driven (`scaleAt1`/`scaleAt5`, dano, rajadas/colunas)
- [x] **2 especiais** compartilhando uma barra: **Laser** (azul) + **Mísseis** (laranja)
- [x] **Cápsulas** alternando tipo básico (R→G→P) e especial (laser→míssil); spawn de teste a cada 30s
- [x] Pickup da **mesma cor** enche 50% da barra especial
- [x] Teclas debug (jogo e pause): **J** +level, **H** reset level, **K** cycle básico, **L** cycle especial
- [x] Roxo teleguiado com spread de alvo (`acquireSpreadTarget`)
- [x] Sons: red-machinegun, purple-homing, blue-laser (loop); míssil ainda usa placeholder (`blue-laser.mp3`)

### VFX de combate
- [x] **Hit sparks** no ponto exato de impacto tiro×inimigo
- [x] **Muzzle glow** (círculo semitransparente) atrás da nave ao atirar
- [x] Debris nas explosões (`expl()`)

### Mísseis (balanceamento atual)
- [x] Spawn alternado nas **asas** da nave
- [x] **`clearsBullets`:** tiros inimigos exigem **2 hits** de míssil/explosão (`BULLET_MISSILE_HITS`)
- [x] Explosão ao interceptar tiro = mesma VFX/dano em área que ao acertar inimigo
- [x] Dano rebalanceado: direto **1.15**, área **3.4**; dreno **0.88**/s
- [x] Contato com tiro dispara `missileExplode()` (não some silenciosamente)

### Vozes da barra especial
- [x] Laser: `laserdepleted` / `laserready`
- [x] Mísseis: `out-of-missiles.mp3` / `missiles-restocked.mp3`
- [x] Voz de “barra cheia” também ao recarregar via **medalhas** e cápsulas (`syncSpecialBarVoices`)

### Boss — laser e apresentação
- [x] Fase de **carga** (~1,55s) com orbes verdes sugados para a **boca** (`BOSS_MOUTH_Y_FRAC`)
- [x] Laser para imediatamente se o jogador morre; **permanece visível ~2s** após matar o jogador (`BOSS_LASER_DEATH_LINGER`)
- [x] Warning: scroll acelera até velocidade do intro (**9.0**) + riscos de velocidade; mantém na luta; só desacelera após explosão final do boss
- [x] Warning: escurecimento só numa **faixa** em torno do texto (não tela inteira)
- [x] Barra HP do boss deslocada (**16px** da borda) para não cortar no bezel

### HUD in-game (canvas, margem 16px)
- [x] **Vidas** com mini-ícones da nave
- [x] Barras compactas **Combo (C)** e **Especial (S)**
- [x] **Score** canto inferior direito
- [x] **Combo xN** canto superior direito
- [x] Linha **arma + nível + especial** (VM/VD/RX LvN · LASER/MISSEIS)
- [x] Barra de especial **também** embaixo da nave (extra durante combate)
- [x] HUD lateral DOM permanece como extra (score, medalhas, tempo, debug…) — oculto em modo bezel

### Spritefont (`assets/fonts/`)
- [x] Módulo `spritefont.js` — grade 10×12, células 16×16
- [x] Temas: **basic-silver** (normal), **basic-orange** (selecionado), **basic-green** (carregado, uso futuro)
- [x] Acentos PT e **Ç** mapeados; `%` corrigido na grade
- [x] Escala padrão de menu: **0.88** (sem “crescer” ao selecionar)
- [x] **Tela de título:** menu + rodapé + diálogo Sair
- [x] **Options / Pause:** textos via spritefont

### Menus (refatoração subníveis — sem abas)
- [x] **OPTIONS (título):** Gráficos → Audio → Gameplay → Voltar
- [x] **PAUSE:** Continuar → Gráficos → Audio → Gameplay → Voltar ao título
- [x] Entrar numa categoria abre lista da seção + **Voltar** no fim
- [x] **Esc** volta um nível; no root fecha pause/options
- [x] Removidas linhas de dica de controles no box
- [x] Removido debug de arma/teclas do rodapé do pause
- [x] **Overlay** (antes “Overlay Bezel”); **Voltar** no final da lista
- [x] Submenu **Ajustar Bezel** inalterado (dentro de Gráficos)

---

## Já implementado antes (ainda válido) ✅

### Fluxo e telas
- Loading terminal, título (logo + nave GIF), intro (`intro-full.mp3`), gameplay, warning, boss, win/game over
- Fade entre telas; gamepad na intro corrigido; “Controle conectado” ~4s no rodapé
- Confirmação **Sair** na tela de título

### Gráficos / post-FX / bezel
- Pause/options com fundo semi-transparente; scanlines, curva CRT, bleeding, filtros (DMG, VB, P&B, NES)
- Brilho/contraste via CSS no `#canvas-wrap`
- Bezel arcade 16:9, auto-alinhar, pan/escala, guia vermelha no submenu bezel
- Display FPS opcional in-game; sempre visível em pause/options

### Áudio
- BGM title/stage1/boss; vozes (engage, gameover, combo, warning boss, congratulations…)
- SFX: select, lasers, explosions, warning siren com fade
- Volumes finos em `AUDIO_VOL` + globais Músicas/Efeitos nos menus

### Inimigos, ondas, colunas
- Templates small/medA/medB/medC; 16 ondas; colunas A/B/C; anti-sobreposição de spawn
- Miniboss: rajada rotacionada com o sprite na saída; HP 72

### Boss Gracioli (além dos itens desta sprint)
- Entrada, hitboxes, enrage, laser em arco, morte (explosões + nova + flash)
- Warning terminal verde ~9s; BGM boss delay ~5,5s

### Combo e medalhas
- Thresholds, queda -3, congelamento no boss, Maximum Combo Bonus
- Medalhas recarregam barra especial (combo-aware)

### Colisão laser
- Laser para no primeiro inimigo/boss hitbox; spark no impacto

---

## Parcialmente implementado 🟡

| Item | Feito | Falta |
|------|-------|-------|
| **Spritefont** | Título, options, pause | Gameplay HUD, intro, warning, game over/win, loading ainda em monospace/canvas default |
| **Armas (spec)** | 3 básicos + laser + míssil + cápsulas | Ajuste fino de balance; som dedicado do míssil; possivelmente mais especiais da spec |
| **Power-ups** | Cápsulas funcionais (test spawn 30s) | Spawn por ondas/inimigos; economia final de drops |
| **Mísseis vs tiros** | 2 hits, explosão completa | Tunar `BULLET_MISSILE_HITS` / dano após playtest extended |
| **Menus** | Subníveis Gráficos/Audio/Gameplay | Scroll se listas crescerem; gamepad **B** para voltar um nível (opcional) |
| **Timer Caravan** | Tempo crescente no HUD lateral | Modo **regressivo** 5/10 min + regras de sessão |
| **Combo** | Regras completas | FX visuais dedicados x10/x20 |
| **Bezel** | Arcade oficial | Mais artes; calibrar corte em ultrawide |
| **Settings** | Tudo in-memory | Persistir em `localStorage` |
| **Deploy** | Funciona local + OneDrive | GitHub Pages / servidor com cache headers |
| **Parallax** | 2 blits/camada, faixa mitigada | Validar em mais resoluções após mudanças de scroll no boss |

---

## Planejado (spec v0.3 e além) ⬜

### Gameplay / Caravan Mode
- [ ] Timer regressivo de sessão (5 ou 10 min configurável)
- [ ] Penalidades / bônus de tempo por performance
- [ ] `SessionStats` (precisão, no-miss streaks, etc.)
- [ ] Vida extra por skill / bônus secretos

### Conteúdo
- [ ] Inimigo `special` e variantes adicionais
- [ ] Bosses além do Gracioli
- [ ] Mais ondas + `WaveDefinition` + `bgChanges` por fase
- [ ] Mais overlays bezel em `BEZELS` (`config.js`)
- [ ] Power-ups amarrados ao design de fase (não só timer de teste)

### Engine / código
- [ ] Refatoração template/instance completa
- [ ] Movement engine genérica declarativa
- [ ] Shot engine genérica declarativa
- [ ] Fases de boss em dados (JSON), não hardcode
- [ ] Unificar HUD lateral DOM com spritefont (opcional)

### Polish / UI
- [ ] Spritefont em **todas** as telas de texto
- [ ] Uso de **basic-green** (ex.: confirmações, “pronto”, combo alto)
- [ ] Rank / high score persistido
- [ ] Replay ou ghost (spec futura)
- [ ] Mixagem final de áudio / compressão
- [ ] Arte bezel refinada 16:10 / ultrawide

### Boss (próximas iterações mencionadas)
- [ ] Mais refinamentos de padrões de tiro / fases declarativas
- [ ] Ajustes finos pós-playtest da carga do laser e da boca

---

## Roadmap sugerido (próximas sessões)

| Prioridade | Tarefa | Status |
|------------|--------|--------|
| 1 | Spritefont no HUD in-game, game over, intro, warning | ⬜ |
| 2 | Som real do míssil (`assets/sounds/`) | ⬜ |
| 3 | Power-ups ligados ao gameplay (drops, não só timer teste) | ⬜ |
| 4 | Timer regressivo Caravan Mode | ⬜ |
| 5 | Persistência de settings (`localStorage`) | ⬜ |
| 6 | FX combo x10/x20 | ⬜ |
| 7 | Mais ondas / conteúdo de fase | ⬜ |
| 8 | Deploy (GitHub Pages / saulosan.com.br/shmup) | ⬜ |
| — | Sistema de armas + VFX + míssil + boss apresentação | ✅ |
| — | HUD in-game + menus spritefont + subníveis | ✅ |

---

## Constantes importantes (novas / alteradas)

| Constante | Onde | Uso |
|-----------|------|-----|
| `HUD_MARGIN`, `HUD_BAR_W/H` | `config.js` | HUD in-game |
| `BOSS_BATTLE_BG_SPEED` | `config.js` | Scroll rápido warning + boss |
| `BOSS_MOUTH_Y_FRAC`, `BOSS_LASER_CHARGE_DUR` | `config.js` | Boca do boss / carga laser |
| `BOSS_LASER_DEATH_LINGER` | `config.js` | Laser visível após matar jogador |
| `BULLET_MISSILE_HITS` | `config.js` | Resistência de tiros inimigos ao míssil |
| `WEAPONS`, `SPECIALS`, `POWERUP` | `weapons.js` | Balanceamento de armas |
| `SF_CELL`, `SF_THEMES` | `spritefont.js` | Fonte bitmap |
| `OPTIONS_ROOT_ITEMS`, `PAUSE_ROOT_ITEMS` | `settings.js` | Menus subnível |

---

## Assets esperados (`assets/`)

| Pasta | Arquivos principais |
|-------|---------------------|
| `sprites/` | player, inimigos, boss, tiros (tiro03/04), missile-orange, caps RGB/P/L/O, title, laser-spark |
| `fonts/` | **basic-silver.png**, **basic-orange.png**, **basic-green.png** |
| `bg/` | bg-fase-01 + layers a/b/c/d |
| `bgm/` | title, stage1, boss |
| `voices/` | laserdepleted, laserready, **out-of-missiles**, **missiles-restocked**, warningbossgracioli, … |
| `sounds/` | select, green/blue laser, red-machinegun, purple-homing, explosions, warning-siren |
| `bezels1080/` | arcade_bezel01.png |

---

## Controles

### Jogo
| Entrada | Ação |
|---------|------|
| Setas / analógico | Mover |
| X / A | Tiro básico |
| C / RT | Especial (laser ou míssil) |
| P / Start | Pause |
| J / H / K / L | Debug arma (nível / reset / cycle básico / cycle especial) |
| B | Debug ir ao boss (stage normal) |
| N / M | Debug vidas infinitas / invencível |

### Menus
| Entrada | Ação |
|---------|------|
| ↑/↓ | Navegar |
| ←/→ | Ajustar slider / toggle / cycle (dentro de submenus) |
| Enter / A | Confirmar / entrar categoria |
| Esc | Voltar um nível / fechar pause ou options |

---

## Bugs conhecidos / resolvidos (sprint atual)

| Problema | Status |
|----------|--------|
| Míssil destruía tiros sem VFX | ✅ Explosão completa + 2 hits |
| Míssil overpowered | ✅ Dano reduzido + 2 hits em tiros |
| Orbes do laser na boca errada | ✅ `bossMouthWorld()` |
| Laser sumia rápido ao matar jogador | ✅ Linger 2s |
| Voz errada ao esvaziar barra de míssil | ✅ Vozes por tipo |
| Voz “ready” não tocava com medalhas | ✅ `syncSpecialBarVoices` |
| `%` aparecia como `$` na spritefont | ✅ Grade linha 0 corrigida |
| Abas coladas / confusas | ✅ Menus subnível |
| Debug feio no pause | ✅ Removido |

---

## Notas técnicas

1. **Cache:** incrementar `?v=` em **todos** os scripts e CSS no `index.html` após mudanças (`?v=25` atual).
2. **Bezel:** HUD lateral some; HUD **in-game no canvas** continua visível.
3. **Armas:** toda lógica tunável em `weapons.js`; sprites registrados em `assets.js` / `index.html` (gif pool).
4. **Spritefont:** seleção = `theme:"orange"`; normal = `"silver"`; escala menu = **0.88**.
5. **OneDrive / file://:** preferir scripts estáticos com query string; Ctrl+F5 após deploy.

---

*Documento vivo — atualizar a cada sprint.*
