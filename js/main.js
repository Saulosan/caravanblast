let last=0;
let loading=true;
let started=false;

let appState="title";
let titleT=0;
let introT=0;
let introFlashOn=true;
let introFlashAcc=0;
let introWaitInput=false;

let score=0;
let comboX=1;
let comboKills=0;
let comboT=0;
let comboBossLock=false;

let medals=0;
let medalsBest=0;

let laserEnergy=LASER_MAX;
let laserUsing=false;
let laserCD=0;

let stage=1;
let win=false;
let gameOver=false;

let warnB=0;
let warnT=0;
let bossStarted=false;
let bossWarn=true;

let bgmStarted=false;
let titleBgmStarted=false;

let invincible=false;
let infiniteLives=false;

let playerRespawning=false;
let playerRespawnTimer=0;
const PLAYER_RESPAWN_DELAY=2.4;

function resetGame(){
  score=0;
  comboX=1;
  comboKills=0;
  comboT=0;
  comboBossLock=false;

  medals=0;
  laserEnergy=LASER_MAX;
  laserUsing=false;
  laserCD=0;

  stage=1;
  win=false;
  gameOver=false;

  warnB=0;
  warnT=0;
  bossStarted=false;
  bossWarn=true;

  bgSpeedTarget=1;

  G.pShots.length=0;
  G.eBullets.length=0;
  G.enemies.length=0;
  G.expl.length=0;
  G.medals.length=0;

  G.wave.i=0;
  G.wave.t=0;
  G.wave.on=true;

  G.boss=null;

  playerRespawning=false;
  playerRespawnTimer=0;

  const p=G.player;
  p.lives=3;
  p.fire=0;
  p.inv=0;
  p.arriving=false;
  p.arrivalPhase=0;

  syncPlayerSize();
  startPlayerArrival();
}

function startIntro(){
  appState="intro";
  introT=0;
  introFlashOn=true;
  introFlashAcc=0;
  introWaitInput=false;
}

function beginPlayFromTitle(){
  resetGame();
  stopBGM();
  playStage1BGM();
  startIntro();
}

function backToTitle(){
  stopBGM();
  appState="title";
  titleT=0;
  started=false;
  loading=false;
  playTitleBGM();
  titleBgmStarted=true;
}

function handleTitleInput(){
  if(anyPressed()){
    titleBgmStarted=false;
    beginPlayFromTitle();
  }
}

function handleIntro(dt){
  introT+=dt;
  introFlashAcc+=dt;

  if(introFlashAcc>=0.35){
    introFlashAcc=0;
    introFlashOn=!introFlashOn;
  }

  if(introT>=1.2){
    appState="play";
  }
}

function updateCombo(dt){
  if(comboX>1&&!comboBossLock){
    comboT-=dt;
    if(comboT<=0){
      comboX=1;
      comboKills=0;
      comboT=0;
    }
  }
}

function spawnMedal(x,y,big=false){
  G.medals.push({
    x,y,
    vx:(Math.random()*2-1)*22,
    vy:big?-90:-55,
    g:260,
    a:0,
    va:(Math.random()*4-2),
    alive:true,
    att:false,
    r:big?10:8,
    val:big?300:100
  });
}

function updMedals(dt){
  const p=G.player;

  for(const m of G.medals){
    if(!m.alive) continue;

    m.a+=m.va*dt;

    if(m.att){
      const tx=p.x+p.w/2;
      const ty=p.y+p.h/2;
      const dx=tx-m.x;
      const dy=ty-m.y;
      const d=Math.hypot(dx,dy)||1;
      const sp=260;
      m.vx=(dx/d)*sp;
      m.vy=(dy/d)*sp;
    } else {
      m.vy+=m.g*dt;
    }

    m.x+=m.vx*dt;
    m.y+=m.vy*dt;

    if(!m.att){
      const dx=(p.x+p.w/2)-m.x;
      const dy=(p.y+p.h/2)-m.y;
      if(dx*dx+dy*dy<46*46)m.att=true;
    }

    if(m.x<-20||m.x>VW+20||m.y>VH+20)m.alive=false;

    if(hitAABB(m.x-m.r,m.y-m.r,m.r*2,m.r*2,p.x,p.y,p.w,p.h)){
      m.alive=false;
      medals++;
      medalsBest=Math.max(medalsBest,medals);
      score+=m.val*comboX;
    }
  }

  G.medals=G.medals.filter(m=>m.alive);
}

function addKillCombo(isBoss=false){
  if(isBoss){
    comboBossLock=true;
    comboX=Math.max(comboX,5);
    comboT=999;
    return;
  }

  comboKills++;
  if(comboKills===2)comboX=2;
  else if(comboKills===5)comboX=3;
  else if(comboKills===9)comboX=4;
  else if(comboKills===14)comboX=5;

  comboT=COMBO_DUR;
}

function beginPlayerRespawn(){
  playerRespawning=true;
  playerRespawnTimer=PLAYER_RESPAWN_DELAY;

  const p=G.player;
  p.arriving=false;
  p.arrivalPhase=0;
  p.inv=999;
  p.x=-200;
  p.y=VH+200;
}

function updPlayerRespawn(dt){
  if(!playerRespawning) return;

  playerRespawnTimer-=dt;
  if(playerRespawnTimer<=0){
    playerRespawning=false;
    startPlayerArrival();
  }
}

function updPlay(dt){
  titleBgmStarted=false;

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
  updateCombo(dt);
  updPlayerRespawn(dt);

  if(stage===2&&bossWarn){
    warnT+=dt;
    warnB+=dt*2.4;
    if(warnT>=BOSS_WARNING_SECS){
      bossWarn=false;
      startBoss();
    }
  }

  if(!bossStarted&&!bossWarn&&stage===1&&G.wave.i>=WAVES.length){
    stage=2;
    bossWarn=true;
    warnT=0;
    warnB=0;
    bgSpeedTarget=1.8;
  }

  if(win){
    appState="win";
  }
}

function anyPressed(){
  for(const k in K){
    if(K[k]) return true;
  }
  if(gpAnyPressed()) return true;
  return false;
}

function frame(ts){
  const dt=Math.min(0.033,(ts-last)/1000||0);
  last=ts;

  if(loading){
    drawLoading();
    requestAnimationFrame(frame);
    return;
  }

  if(appState==="title"){
    titleT+=dt;
    drawTitle(dt);
    handleTitleInput();
    requestAnimationFrame(frame);
    return;
  }

  if(appState==="intro"){
    handleIntro(dt);
    drawIntro(dt);
    requestAnimationFrame(frame);
    return;
  }

  if(appState==="play"){
    updPlay(dt);
    drawBG(dt);
    drawShots();
    drawEnemies();
    drawBullets();
    if(G.boss)drawBoss(G.boss);
    drawPlayer();
    drawExpl();
    drawMedals();
    if(G.boss)drawBossHPBar(G.boss);
    drawComboPopup();
    drawWarning();
    drawScreenFlash();
    updHUD();
    requestAnimationFrame(frame);
    return;
  }

  if(appState==="win"){
    drawBG(dt);
    drawShots();
    drawEnemies();
    drawBullets();
    if(G.boss)drawBoss(G.boss);
    drawPlayer();
    drawExpl();
    drawMedals();
    drawWin();
    updHUD();
    if(anyPressed())backToTitle();
    requestAnimationFrame(frame);
    return;
  }

  if(appState==="gameover"){
    drawBG(dt);
    drawShots();
    drawEnemies();
    drawBullets();
    if(G.boss)drawBoss(G.boss);
    drawExpl();
    drawMedals();
    drawGO();
    updHUD();
    if(anyPressed())backToTitle();
    requestAnimationFrame(frame);
    return;
  }

  requestAnimationFrame(frame);
}

initAssets(()=>{
  resize();
  syncPlayerSize();
  loading=false;
  playTitleBGM();
  titleBgmStarted=true;
  requestAnimationFrame(frame);
});
