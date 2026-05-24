let last = 0;
let loading = true;

let introT = 0;
let introFlashAcc = 0;

let bossStarted = false;
let bossWarn = false;

let playerRespawning = false;
let playerRespawnTimer = 0;
const PLAYER_RESPAWN_DELAY = 2.4;

function startFromTitle(){
  resetGame();
  syncPlayerSize();
  startPlayerArrival();

  appState = "intro";
  introT = 0;
  introFlashAcc = 0;
  introFlashOn = true;

  bossStarted = false;
  bossWarn = false;

  stopBGM();
  playBGM("stage1");
}

function backToTitle(){
  stopBGM();
  playBGM("title");
  appState = "title";
  titleT = 0;
}

function beginPlayerRespawn(){
  playerRespawning = true;
  playerRespawnTimer = PLAYER_RESPAWN_DELAY;

  const p = G.player;
  p.arriving = false;
  p.arrivalPhase = 0;
  p.inv = 999;
  p.x = -200;
  p.y = VH + 200;
}

function updPlayerRespawn(dt){
  if(!playerRespawning) return;

  playerRespawnTimer -= dt;
  if(playerRespawnTimer <= 0){
    playerRespawning = false;
    startPlayerArrival();
  }
}

function addKillCombo(isBoss = false){
  if(isBoss){
    comboBossLock = true;
    comboX = Math.max(comboX, 5);
    comboT = 999;
    return;
  }

  comboKills++;
  if(comboKills === 2) comboX = 2;
  else if(comboKills === 5) comboX = 3;
  else if(comboKills === 9) comboX = 4;
  else if(comboKills === 14) comboX = 5;

  comboT = COMBO_DUR;
}

function updCombo(dt){
  if(comboX > 1 && !comboBossLock){
    comboT -= dt;
    if(comboT <= 0){
      comboX = 1;
      comboKills = 0;
      comboT = 0;
    }
  }
}

function spawnMedal(x, y, big = false){
  G.medals.push({
    x: x,
    y: y,
    vx: (Math.random() * 2 - 1) * 22,
    vy: big ? -90 : -55,
    g: 260,
    a: 0,
    va: (Math.random() * 4 - 2),
    alive: true,
    att: false,
    r: big ? 10 : 8,
    val: big ? 300 : 100
  });
}

function updMedals(dt){
  const p = G.player;

  for(const m of G.medals){
    if(!m.alive) continue;

    m.a += m.va * dt;

    if(m.att){
      const tx = p.x + p.w / 2;
      const ty = p.y + p.h / 2;
      const dx = tx - m.x;
      const dy = ty - m.y;
      const d = Math.hypot(dx, dy) || 1;
      const sp = 260;
      m.vx = (dx / d) * sp;
      m.vy = (dy / d) * sp;
    } else {
      m.vy += m.g * dt;
    }

    m.x += m.vx * dt;
    m.y += m.vy * dt;

    if(!m.att){
      const dx = (p.x + p.w / 2) - m.x;
      const dy = (p.y + p.h / 2) - m.y;
      if(dx * dx + dy * dy < 46 * 46) m.att = true;
    }

    if(m.x < -20 || m.x > VW + 20 || m.y > VH + 20){
      m.alive = false;
      continue;
    }

    if(hitAABB(m.x - m.r, m.y - m.r, m.r * 2, m.r * 2, p.x, p.y, p.w, p.h)){
      m.alive = false;
      medals++;
      score += m.val * comboX;
    }
  }

  G.medals = G.medals.filter(m => m.alive);
}

function updPlay(dt){
  updLaser(dt);
  updPlayer(dt);
  updShots(dt);

  if(!playerRespawning){
    updEnemies(dt);
    updBoss(dt);
    updEnemyBullets(dt);
    checkCollisions();
  }

  updExpl(dt);
  updMedals(dt);
  updCombo(dt);
  updPlayerRespawn(dt);

  if(stage === 1 && !bossStarted && G.waveIdx >= WAVES.length){
    stage = 2;
    bossWarn = true;
    warnT = 0;
    warnB = 0;
    bgSpeedTarget = 1.8;
  }

  if(stage === 2 && bossWarn){
    warnT += dt;
    warnB += dt * 2.4;
    if(warnT >= BOSS_WARNING_SECS){
      bossWarn = false;
      bossStarted = true;
      startBoss();
    }
  }

  if(gameOver){
    appState = "gameover";
  }
}

function frame(ts){
  const dt = Math.min(0.033, (ts - last) / 1000 || 0);
  last = ts;

  if(loading){
    drawLoading();
    requestAnimationFrame(frame);
    return;
  }

  if(appState === "title"){
    titleT += dt;
    drawTitle(dt);
    updHUD();
    requestAnimationFrame(frame);
    return;
  }

  if(appState === "intro"){
    introT += dt;
    introFlashAcc += dt;
    if(introFlashAcc >= 0.35){
      introFlashAcc = 0;
      introFlashOn = !introFlashOn;
    }
    if(introT >= 1.2){
      appState = "play";
      stage = 1;
    }

    drawIntro(dt);
    updHUD();
    requestAnimationFrame(frame);
    return;
  }

  if(appState === "play"){
    updPlay(dt);
    drawBG(dt);
    drawShots();
    drawEnemies();
    drawBullets();
    if(G.boss) drawBoss(G.boss);
    drawPlayer();
    drawExpl();
    drawMedals();
    if(G.boss) drawBossHPBar(G.boss);
    drawComboPopup();
    drawWarning();
    drawScreenFlash();
    updHUD();
    requestAnimationFrame(frame);
    return;
  }

  if(appState === "win"){
    drawBG(dt);
    drawShots();
    drawEnemies();
    drawBullets();
    if(G.boss) drawBoss(G.boss);
    drawPlayer();
    drawExpl();
    drawMedals();
    drawWin();
    updHUD();
    requestAnimationFrame(frame);
    return;
  }

  if(appState === "gameover"){
    drawBG(dt);
    drawShots();
    drawEnemies();
    drawBullets();
    if(G.boss) drawBoss(G.boss);
    drawExpl();
    drawMedals();
    drawGO();
    updHUD();
    requestAnimationFrame(frame);
    return;
  }

  requestAnimationFrame(frame);
}

initAssets(() => {
  resize();
  syncPlayerSize();
  loading = false;
  playTitleBGM();
  requestAnimationFrame(frame);
});