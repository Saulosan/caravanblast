function startFromTitle(){
  if(appState!=="title")return;
  appState="intro";
  introFlash=0;
  introFlashCount=0;
  introFlashOn=true;
}

function updateTitle(dt){
  titleT+=dt;
}

function updateIntro(dt){
  introFlash+=dt;
  if(introFlash>0.18){
    introFlash=0;
    introFlashCount++;
    introFlashOn=!introFlashOn;
    if(introFlashCount>=6){
      appState="game";
      playBGM("stage1");
      startPlayerArrival();
    }
  }
}

function onEnemyKilled(pts){
  score+=pts*comboX;
  if(!comboBossLock){
    comboKills++;
    comboT=COMBO_DUR;
    const nx=Math.min(10,1+Math.floor(comboKills/5));
    if(nx>comboX)comboX=nx;
  }
}

function onMedalCollected(){
  if(!comboBossLock){
    comboT=Math.min(COMBO_DUR,comboT+0.6);
  }
  if(laserCD>0){
    const pct=0.005+((comboX-1)/9)*0.245;
    laserCD=Math.max(0,laserCD-LASER_COOLDOWN*pct);
    laserEnergy=Math.min(LASER_MAX,(1-(laserCD/LASER_COOLDOWN))*LASER_MAX);
  }
}

function updCombo(dt){
  if(comboBossLock)return;
  comboT-=dt;
  if(comboT<=0){
    comboT=0;
    comboX=1;
    comboKills=0;
  }
}

function spawnMedal(x,y,n){
  n=n||1;
  for(let i=0;i<n;i++){
    G.medals.push({
      x,y,
      vx:(Math.random()-0.5)*80,
      vy:30+Math.random()*40,
      alive:true,
      a:Math.random()*Math.PI*2,
      att:false
    });
  }
}

function updMedals(dt){
  const px=G.player.x+G.player.w/2;
  const py=G.player.y+G.player.h/2;
  const cr=G.player.collectR;

  for(const m of G.medals){
    if(!m.alive)continue;
    m.a+=dt*3;

    const dx=px-m.x;
    const dy=py-m.y;
    const d=Math.hypot(dx,dy);

    if(d<cr||m.att){
      m.att=true;
      const spd=Math.max(600,d*10);
      const nd=Math.hypot(dx,dy)||1;
      m.vx=dx/nd*spd;
      m.vy=dy/nd*spd;
    } else {
      m.vy+=MEDAL_GRAVITY*dt;
    }

    m.x+=m.vx*dt;
    m.y+=m.vy*dt;

    if(m.att&&Math.hypot(px-m.x,py-m.y)<cr*0.4){
      m.alive=false;
      medals++;
      score+=500*comboX;
      onMedalCollected();
      expl(m.x,m.y,"#ffdd00");
    }

    if(!m.att&&m.y>VH+40)m.alive=false;
  }

  G.medals=G.medals.filter(m=>m.alive);
}

// ====================================
// RESPAWN + ARRIVAL
// ====================================
let playerRespawning=false;
let playerRespawnTimer=0;
const PLAYER_RESPAWN_DELAY=2.0;

function beginPlayerRespawn(){
  playerRespawning=true;
  playerRespawnTimer=PLAYER_RESPAWN_DELAY;

  const p=G.player;
  playerArriving=false;
  playerArrivalPhase=0;
  flgPlayerControl=0;
  p.inv=0;
  p.x=-200;
  p.y=VH+200;
}

function startPlayerArrival(){
  playerRespawning=false;
  playerArriving=true;
  playerArrivalPhase=0;
  flgPlayerControl=0;

  const p=G.player;
  p.x=VW/2-p.w/2;
  p.y=VH+80;
  p.inv=0;
  p.fire=0;
  laserUsing=false;

  setPlayerAnim("arriving");
}

function updPlayerRespawn(dt){
  if(!playerRespawning)return;
  playerRespawnTimer-=dt;
  if(playerRespawnTimer<=0){
    startPlayerArrival();
  }
}

function update(dt){
  if(gameOver)return;

  phaseT+=dt;
  syncPlayerSize();

  switch(stage){
    case 0:
      if(flgPlayerControl===1 && !playerArriving){
        G.spawnT-=dt;
        if(G.spawnT<=0){
          nextWave();
          G.spawnT=1.6+Math.random()*1.2;
        }
        if(phaseT>=BOSS_AT)doBossSkip();
      }
      break;

    case 1:
      bgSpeedTarget=3;
      comboBossLock=true;
      stage=2;
      warnT=WARN_DUR;
      break;

    case 2:
      warnT-=dt;
      warnB+=dt*5;
      if(warnT<=0){
        stage=3;
        spawnBoss();
      }
      break;

    case 3:
      updBoss(dt);
      break;
  }

  updPlayer(dt);
  updShots(dt);
  updLaser(dt);

  if(!playerRespawning){
    updEnemies(dt);

    for(const b of G.eBullets){
      if(!b.alive)continue;
      b.x+=b.vx*dt;
      b.y+=b.vy*dt;
      if(b.x<-30||b.x>VW+30||b.y<-30||b.y>VH+30)b.alive=false;
    }
    G.eBullets=G.eBullets.filter(b=>b.alive);

    if(flgPlayerControl===1 && !playerArriving){
      collisions();
    }
  } else {
    for(const b of G.eBullets){
      if(!b.alive)continue;
      b.x+=b.vx*dt;
      b.y+=b.vy*dt;
      if(b.x<-30||b.x>VW+30||b.y<-30||b.y>VH+30)b.alive=false;
    }
    G.eBullets=G.eBullets.filter(b=>b.alive);
  }

  for(const e of G.expl){
    e.life-=dt;
    e.r+=(e.mr-e.r)*14*dt;
    e.r2+=(e.mr2-e.r2)*10*dt;
  }
  G.expl=G.expl.filter(e=>e.life>0);

  updMedals(dt);
  updCombo(dt);
  updPlayerRespawn(dt);

  if(G.player.inv>0)G.player.inv-=dt;
  if(screenFlash>0)screenFlash=Math.max(0,screenFlash-dt*2.2);

  updHUD();
}

// botoes do gamepad que iniciam/reiniciam (borda de subida)
const gpMenuPrev={a:false,start:false,b:false};

function readGamepadMenu(){
  const gps=navigator.getGamepads();
  let gp=null;
  for(let i=0;i<gps.length;i++){
    if(gps[i]){
      gp=gps[i];
      break;
    }
  }
  if(!gp)return;

  const aNow=gp.buttons[0]?.pressed||false;
  const startNow=gp.buttons[9]?.pressed||false;
  const bNow=gp.buttons[1]?.pressed||false;

  const anyPressed=(aNow&&!gpMenuPrev.a)||(startNow&&!gpMenuPrev.start)||(bNow&&!gpMenuPrev.b);

  if(anyPressed){
    if(appState==="title")startFromTitle();
    else if(appState==="gameover")resetGame();
    else if(appState==="win")resetGame();
  }

  gpMenuPrev.a=aNow;
  gpMenuPrev.start=startNow;
  gpMenuPrev.b=bNow;
}

// ── SPLASH / AUDIO UNLOCK ────────────────────────────────────────────────────
let audioUnlocked=false;
let splashDone=false;

function drawSplash(){
  ctx.fillStyle="#000";
  ctx.fillRect(0,0,VW,VH);
  ctx.save();
  ctx.textAlign="center";
  ctx.font="bold 42px Georgia,serif";
  ctx.strokeStyle="#ff8800";
  ctx.lineWidth=5;
  ctx.strokeText("Caravan Blast!",VW/2,VH/2-40);
  const grad=ctx.createLinearGradient(0,VH/2-90,0,VH/2-10);
  grad.addColorStop(0,"#fff");
  grad.addColorStop(1,"#ff8800");
  ctx.fillStyle=grad;
  ctx.fillText("Caravan Blast!",VW/2,VH/2-40);
  const pulse=0.5+0.5*Math.sin(Date.now()*0.004);
  ctx.globalAlpha=pulse;
  ctx.fillStyle="#aaa";
  ctx.font="13px monospace";
  ctx.fillText("Clique ou aperte qualquer tecla para iniciar",VW/2,VH/2+20);
  ctx.globalAlpha=1;
  ctx.textAlign="left";
  ctx.restore();
}

function unlockAndStart(){
  if(splashDone)return;
  splashDone=true;
  audioUnlocked=true;
  playBGM("title");
  appState="title";
}

function ensureTitleBGM(){
  if(audioUnlocked)playBGM("title");
}

window.addEventListener("keydown",()=>{if(!splashDone)unlockAndStart();},false);
window.addEventListener("mousedown",()=>{if(!splashDone)unlockAndStart();},false);
window.addEventListener("touchstart",()=>{if(!splashDone)unlockAndStart();},{passive:true});

function loop(ts){
  const dt=Math.min((ts-lastT)/1000,.033);
  lastT=ts;
  ctx.imageSmoothingEnabled=false;

  readGamepad();
  readGamepadMenu();

  if(appState==="splash"){
    drawSplash();
  }
  else if(appState==="title"){
    updateTitle(dt);
    drawTitle(dt);
  }
  else if(appState==="intro"){
    updateIntro(dt);
    drawIntro(dt);
  }
  else if(appState==="gameover"){
    drawBG(dt);
    drawGO();
  }
  else if(appState==="win"){
    drawBG(dt);
    drawWin();
  }
  else {
    update(dt);
    drawBG(dt);
    if(G.boss)drawBossHPBar(G.boss);

    if(G.boss&&G.boss.entering){
      drawMedals();
      drawShots();
      drawEnemies();
      drawBullets();
      drawExpl();
      drawPlayer();
      drawBoss(G.boss);
    } else {
      if(G.boss)drawBoss(G.boss);
      drawMedals();
      drawShots();
      drawEnemies();
      drawBullets();
      drawExpl();
      drawPlayer();
    }

    drawScreenFlash();
    drawComboPopup();
    drawWarning();
  }

  requestAnimationFrame(loop);
}

let gameStarted=false;
function checkAndStart(){
  if(!gameStarted){
    gameStarted=true;
    appState="splash";
    resize();
    requestAnimationFrame(loop);
  }
}

(function loadingLoop(ts){
  lastT=ts||0;
  if(bgReady>=5&&gifReady>=TOTAL_GIFS){
    checkAndStart();
    return;
  }
  drawLoading();
  requestAnimationFrame(loadingLoop);
})();

initAssets(checkAndStart);