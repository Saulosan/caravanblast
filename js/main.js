function startFromTitle(){
  if(appState!=="title"||isScreenTransitionBlockingInput())return;
  beginScreenTransition(()=>{
    appState="intro";
    introSeqIdx=0;
    introSeqT=0;
    introLineChars=0;
    introBoostActive=true;
    introLineShown=[0,0,0,0,0,0];
    bgSpeedMult=4.8;
    bgSpeedTarget=4.8;
    stopVoice();
    playVoice("introFull");
  });
  consumeGamepadMenuPress();
}

function skipIntroToGame(){
  if(appState!=="intro"||isScreenTransitionBlockingInput())return;
  beginScreenTransition(()=>{
    stopVoice();
    appState="game";
    playBGM("stage1");
    bgSpeedMult=9.0;
    bgSpeedTarget=9.0;
    startPlayerArrival();
    introBoostActive=true;
  });
}

const PAUSE_MENU_ITEMS=[];
const OPTIONS_MENU_ITEMS=[];
const TITLE_MENU_ITEMS=["Start Caravan","Options","Sair"];
const END_MENU_ITEMS=["Restart Game","View Score"];

function setPauseDirty(){ pauseFrameDirty=true; }

function togglePause(){
  if(appState==="paused"){
    appState=pausedFromState||"game";
    pausedFromState="";
    refreshBezelGuide();
    return;
  }
  if(appState!=="game")return;
  stopAllLoopSfx();
  pausedFromState=appState;
  appState="paused";
  resetSettingsMenuNav();
  refreshBezelGuide();
}

function openOptionsMenu(returnState){
  optionsReturnState=returnState||"title";
  resetSettingsMenuNav();
  appState="options";
  refreshBezelGuide();
}

function closeOptionsMenu(){
  appState=optionsReturnState||"title";
  optionsReturnState="";
  refreshBezelGuide();
}

function pauseMenuMove(dir){settingsMenuMove(dir);}
function pauseMenuAdjust(dir){settingsMenuAdjust(dir);}
function pauseMenuConfirm(){settingsMenuConfirm();}

function updateTitle(dt){
  titleT+=dt;
  if(titleLogoZoomT<TITLE_LOGO_ZOOM_DUR)titleLogoZoomT+=dt;
  if(titleGpMsgT>0)titleGpMsgT=Math.max(0,titleGpMsgT-dt);

  if(!titleBGMStarted){
    playBGM("title");
    titleBGMStarted=true;
  }

  if(!titleVoicePlayed){
    playVoice("titlescreen");
    titleVoicePlayed=true;
  }
}

function updateIntro(dt){
  const t=getVoiceTime("introFull");
  const rps=58;

  if(t<1.5){
    introLineShown[0]=Math.min(INTRO_LINES[0].length,introLineShown[0]+Math.ceil(rps*dt));
  } else if(t<10.0){
    introLineShown[0]=INTRO_LINES[0].length;
    introLineShown[1]=Math.min(INTRO_LINES[1].length,introLineShown[1]+Math.ceil(rps*dt));
  } else if(t<11.0){
    introLineShown[0]=INTRO_LINES[0].length;
    introLineShown[1]=INTRO_LINES[1].length;
  } else if(t<15.0){
    introLineShown[0]=INTRO_LINES[0].length;
    introLineShown[1]=INTRO_LINES[1].length;
    introLineShown[2]=Math.min(INTRO_LINES[2].length,introLineShown[2]+Math.ceil(rps*dt));
  } else if(t<19.0){
    introLineShown[0]=INTRO_LINES[0].length;
    introLineShown[1]=INTRO_LINES[1].length;
    introLineShown[2]=INTRO_LINES[2].length;
    introLineShown[3]=Math.min(INTRO_LINES[3].length,introLineShown[3]+Math.ceil(rps*dt));
  } else if(t<28.0){
    introLineShown[0]=INTRO_LINES[0].length;
    introLineShown[1]=INTRO_LINES[1].length;
    introLineShown[2]=INTRO_LINES[2].length;
    introLineShown[3]=INTRO_LINES[3].length;
    introLineShown[4]=Math.min(INTRO_LINES[4].length,introLineShown[4]+Math.ceil(rps*dt));
  } else if(t<30.0){
    introLineShown[0]=INTRO_LINES[0].length;
    introLineShown[1]=INTRO_LINES[1].length;
    introLineShown[2]=INTRO_LINES[2].length;
    introLineShown[3]=INTRO_LINES[3].length;
    introLineShown[4]=INTRO_LINES[4].length;
    introLineShown[5]=Math.min(INTRO_LINES[5].length,introLineShown[5]+Math.ceil(rps*dt));
  } else {
    introLineShown=[INTRO_LINES[0].length,INTRO_LINES[1].length,INTRO_LINES[2].length,INTRO_LINES[3].length,INTRO_LINES[4].length,INTRO_LINES[5].length];
    skipIntroToGame();
  }
}

function updateLoading(dt){
  loadingSpinT+=dt;
  loadingPromptT+=dt;
  loadingLineT+=dt;

  if(loadingLinesShown<4 && loadingLineT>=LOADING_LINE_STEP){
    loadingLineT=0;
    loadingLinesShown++;
  }

  if(loadingProgress<100){
    loadingProgress=Math.min(100,loadingProgress+36*dt);
    if(loadingProgress>=100)loadingReady=true;
  }
}

function onEnemyKilled(pts){
  const prevComboX=comboX;

  score+=pts*comboX*(maxComboBonusActive?2:1);
  if(!comboBossLock){
    comboKills++;
    comboT=COMBO_DUR;
    for(let x=10;x>=2;x--){
      if(comboKills>=COMBO_THRESHOLDS[x] && comboX<x){
        comboX=x;
        break;
      }
    }
    if(comboX>prevComboX)playVoice("comboup");
  }
}

function onMedalCollected(){
  if(!comboBossLock){
    comboT=Math.min(COMBO_DUR,comboT+0.6);
  }
  if(laserCD>0){
    const prevCD=laserCD;
    const prevEnergy=laserEnergy;
    const pct=0.005+((comboX-1)/9)*0.245;
    laserCD=Math.max(0,laserCD-LASER_COOLDOWN*pct);
    laserEnergy=Math.min(LASER_MAX,(1-(laserCD/LASER_COOLDOWN))*LASER_MAX);
    syncSpecialBarVoices(prevEnergy,prevCD);
  }
}

function updCombo(dt){
  if(comboBossLock || maxComboBonusActive)return;
  comboT-=dt;
  if(comboT<=0){
    const prevCombo=comboX;
    // Queda por timing: x1..x10 cai -3 (min x1); acima de x10 cai direto pra x9
    if(comboX>10){
      comboX=9;
      comboKills=COMBO_THRESHOLDS[9];
    } else {
      comboX=Math.max(1,comboX-3);
      comboKills=comboX===1?0:COMBO_THRESHOLDS[comboX];
    }
    comboT=COMBO_DUR;
    if(prevCombo>=2)playVoice("combofinish");
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
      score+=500*comboX*(maxComboBonusActive?2:1);
      onMedalCollected();
      expl(m.x,m.y,"#ffdd00");
    }

    if(!m.att&&m.y>VH+40)m.alive=false;
  }

  G.medals=G.medals.filter(m=>m.alive);
}

function updMaxComboBonus(dt){
  if(!maxComboBonusActive)return;
  maxComboBonusT-=dt;
  if(maxComboBonusT<=0){
    maxComboBonusT=0;
    maxComboBonusActive=false;
  }
}

let playerRespawning=false;
let playerRespawnTimer=0;
const PLAYER_RESPAWN_DELAY=2.0;

let bossWarningVoicePlayed=false;
let bossMusicDelayTimer=0;
let bossMusicQueued=false;

let gameCompletedVoicePlayed=false;
let gameOverVoicePlayed=false;
let titleVoicePlayed=false;
let titleBGMStarted=false;

let endScreenResetLocked=false;
let endScreenResetTimer=0;
const END_SCREEN_RESET_DELAY=15.0;

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
  playVoice("engage");
}

function updPlayerRespawn(dt){
  if(!playerRespawning)return;
  playerRespawnTimer-=dt;
  if(playerRespawnTimer<=0){
    startPlayerArrival();
  }
}

function updateBossWarningMusicDelay(dt){
  if(!bossMusicQueued)return;
  bossMusicDelayTimer-=dt;
  if(bossMusicDelayTimer<=0){
    bossMusicQueued=false;
    playBGM("boss");
  }
}

function lockEndScreenReset(){
  endScreenResetLocked=true;
  endScreenResetTimer=END_SCREEN_RESET_DELAY;
}

function updateEndScreenResetLock(dt){
  if(!endScreenResetLocked)return;
  endScreenResetTimer-=dt;
  if(endScreenResetTimer<=0){
    endScreenResetTimer=0;
    endScreenResetLocked=false;
  }
}

function canResetFromEndScreen(){
  return !endScreenResetLocked;
}

function tryResetFromEndScreen(){
  if(appState!=="gameover" && appState!=="win")return;
  if(!canResetFromEndScreen())return;
  if(isScreenTransitionBlockingInput())return;
  beginScreenTransition(()=>{ resetGame(); });
}

function updBossWarning(dt){
  warnDim=Math.min(WARN_DIM_MAX,warnDim+dt*WARN_DIM_SPEED);
  if(warnLineChars[0]<WARN_LINES[0].length){
    warnLineChars[0]=Math.min(WARN_LINES[0].length,warnLineChars[0]+Math.ceil(WARN_TYPE_CPS*dt));
  }else if(warnLineChars[1]<WARN_LINES[1].length){
    warnLineChars[1]=Math.min(WARN_LINES[1].length,warnLineChars[1]+Math.ceil(WARN_TYPE_CPS*dt));
  }
}

function drawLoadingScreen(){
  drawBG(1/60);
  ctx.save();
  ctx.fillStyle="rgba(0,0,0,0.78)";
  ctx.fillRect(0,0,VW,VH);

  ctx.textAlign="left";
  ctx.font="14px monospace";
  ctx.fillStyle="#66ff66";
  const promptLines=[
    "C:\\\\SYS> Caravan Blast // Boot Sequence",
    "C:\\\\SYS> Caravan Blast e uma criacao de Saulo Santiago.",
    "C:\\\\SYS> Inicializando modulos de combate...",
    "C:\\\\SYS> Calibrando sistemas de nave e audio..."
  ];
  for(let i=0;i<promptLines.length;i++){
    const full=promptLines[i];
    const show=Math.max(0,Math.min(full.length,Math.floor((loadingProgress/100)*(full.length+14)-i*14)));
    const txt=full.slice(0,show);
    const y=126+i*24;
    ctx.fillText(txt,26,y);
    if(show<full.length || (Math.floor(loadingPromptT*2)%2===0 && i===promptLines.length-1)){
      const cw=ctx.measureText(txt).width;
      ctx.fillRect(26+cw+2,y-12,8,14);
    }
  }

  const cx=VW/2,cy=VH/2+12,r=18;
  const ang=loadingSpinT*4.8;
  ctx.lineWidth=3;
  ctx.strokeStyle="rgba(130,255,130,0.2)";
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle="#66ff66";
  ctx.beginPath();ctx.arc(cx,cy,r,ang,ang+Math.PI*1.45);ctx.stroke();
  ctx.font="bold 20px monospace";
  ctx.fillStyle="#a8ff9d";
  ctx.textAlign="center";
  ctx.fillText(Math.floor(loadingProgress)+"%",VW/2,VH/2+72);
  ctx.font="11px monospace";
  ctx.fillStyle="#6fcf66";
  ctx.fillText("loading",VW/2,VH/2+94);
  if(loadingReady){
    const pulse=0.55+0.45*Math.sin(loadingPromptT*5);
    ctx.globalAlpha=pulse;
    ctx.font="13px monospace";
    ctx.fillStyle="#bfffaf";
    ctx.fillText("Press any button to start",VW/2,VH-84);
    ctx.globalAlpha=1;
  }
  ctx.textAlign="left";
  ctx.restore();
}

function update(dt){
  if(gameOver)return;

  phaseT+=dt;
  phaseElapsed+=dt;
  syncPlayerSize();

  switch(stage){
    case 0:
      if(flgPlayerControl===1 && !playerArriving){
        updWaveFlow(dt);
        if(phaseT>=BOSS_AT)doBossSkip(false);
      }
      break;

    case 1:
      comboBossLock=true;
      bossWarningVoicePlayed=false;
      bossMusicQueued=false;
      bossMusicDelayTimer=0;
      stage=2;
      warnT=WARN_DUR;
      warnDim=0;
      warnLineChars=[0,0];
      bgSpeedTarget=BOSS_BATTLE_BG_SPEED;
      stopBGM();
      break;

    case 2:
      updBossWarning(dt);
      bgSpeedTarget=BOSS_BATTLE_BG_SPEED;
      syncLoopSfx("warningSiren",true);
      if(!bossWarningVoicePlayed){
        playVoice("warningbossgracioli");
        bossWarningVoicePlayed=true;
        bossMusicQueued=true;
        bossMusicDelayTimer=BOSS_WARNING_BGM_DELAY;
      }
      warnT-=dt;
      if(warnT<=WARN_SIREN_FADE_DUR)beginWarningSirenFade();
      if(warnT<=0){
        forceStopWarningSiren();
        stage=3;
        spawnBoss();
      }
      break;

    case 3:
      bgSpeedTarget=BOSS_BATTLE_BG_SPEED;
      updBoss(dt);
      break;
  }

  updateBossWarningMusicDelay(dt);
  updWarningSirenFade(dt);
  updBossBGMFade(dt);

  updSpecial(dt);
  updPlayer(dt);
  // Tiro básico: suspenso quando o especial está ativo ou sem controle do jogador.
  updateBasicFire(dt, flgPlayerControl===1 && !playerArriving && !specialActive && !!K["KeyX"]);
  updShots(dt);

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

  for(const d of G.debris){
    if(!d.alive)continue;
    d.life-=dt;
    d.vy+=220*dt;
    d.x+=d.vx*dt;
    d.y+=d.vy*dt;
    d.rot+=d.vr*dt;
    if(d.life<=0 || d.y>VH+30)d.alive=false;
  }
  G.debris=G.debris.filter(d=>d.alive);

  updMedals(dt);
  updCapsules(dt);
  updSparks(dt);
  updMuzzleGlows(dt);
  updCombo(dt);
  updMaxComboBonus(dt);
  updStaggeredBursts(dt);
  updPlayerRespawn(dt);

  if(G.player.inv>0)G.player.inv-=dt;
  if(screenFlash>0)screenFlash=Math.max(0,screenFlash-dt*2.2);

  updHUD();
}

const gpMenuPrev={a:false,start:false,b:false};

function consumeGamepadMenuPress(){
  gpMenuPrev.a=true;
  gpMenuPrev.start=true;
  gpMenuPrev.b=true;
}

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

  if(anyPressed && appState==="loading"){
    unlockAndStart();
    consumeGamepadMenuPress();
  }

  gpMenuPrev.a=aNow;
  gpMenuPrev.start=startNow;
  gpMenuPrev.b=bNow;
}

let audioUnlocked=false;
let splashDone=false;
let fpsAccum=0,fpsFrames=0;

function updateFPS(dt){
  fpsAccum+=dt;
  fpsFrames++;
  if(fpsAccum>=0.35){
    fpsDisplay=Math.round(fpsFrames/fpsAccum);
    fpsAccum=0;
    fpsFrames=0;
  }
}

function unlockAndStart(){
  if(splashDone || !loadingReady || isScreenTransitionBlockingInput())return;
  splashDone=true;
  audioUnlocked=true;
  preloadGameAudio();
  beginScreenTransition(()=>{
    titleVoicePlayed=false;
    titleBGMStarted=false;
    appState="title";
  });
}

function titleMenuMove(dir){
  if(appState!=="title")return;
  if(titleExitConfirm){
    const prev=titleExitIdx;
    titleExitIdx=(titleExitIdx+dir+2)%2;
    if(titleExitIdx!==prev)playSelectSfx();
    return;
  }
  const prev=titleMenuIdx;
  titleMenuIdx=(titleMenuIdx+dir+TITLE_MENU_ITEMS.length)%TITLE_MENU_ITEMS.length;
  if(titleMenuIdx!==prev)playSelectSfx();
}

function titleMenuAdjust(dir){
  if(appState!=="title"||!titleExitConfirm||!dir)return;
  const prev=titleExitIdx;
  titleExitIdx=(titleExitIdx+dir+2)%2;
  if(titleExitIdx!==prev)playSelectSfx();
}

function titleMenuConfirm(){
  if(appState!=="title")return;
  if(titleExitConfirm){
    if(titleExitIdx===0)quitGame();
    else titleExitConfirm=false;
    return;
  }
  if(titleMenuIdx===0)startFromTitle();
  else if(titleMenuIdx===1)openOptionsMenu("title");
  else{
    titleExitConfirm=true;
    titleExitIdx=1;
    playSelectSfx();
  }
}

function titleMenuCancel(){
  if(appState!=="title")return;
  if(titleExitConfirm)titleExitConfirm=false;
}

function endMenuMove(dir){
  if(appState!=="gameover"&&appState!=="win")return;
  const prev=endMenuIdx;
  endMenuIdx=(endMenuIdx+dir+END_MENU_ITEMS.length)%END_MENU_ITEMS.length;
  if(endMenuIdx!==prev)playSelectSfx();
}

function endMenuConfirm(){
  if(appState!=="gameover"&&appState!=="win")return;
  if(endMenuIdx===0 && canResetFromEndScreen())tryResetFromEndScreen();
}

window.addEventListener("keydown",()=>{
  if(appState==="loading")unlockAndStart();
},false);

window.addEventListener("mousedown",()=>{
  if(appState==="loading")unlockAndStart();
},false);

window.addEventListener("touchstart",()=>{
  if(appState==="loading")unlockAndStart();
},{passive:true});

function loop(ts){
  const dt=Math.min((ts-lastT)/1000,.033);
  lastT=ts;
  updateFPS(dt);
  ctx.imageSmoothingEnabled=false;

  updScreenTransition(dt);
  const rs=getRenderState();
  const freezeLogic=screenTrans.active&&screenTrans.phase==="out";

  readGamepad();
  readGamepadMenu();

  if(rs==="loading"){
    if(!freezeLogic)updateLoading(dt);
    drawLoadingScreen();
    drawScreenFade();
    applyPostFX();
    drawFPSIfNeeded();
    requestAnimationFrame(loop);
    return;
  }

  if(rs==="title"){
    if(!freezeLogic)updateTitle(dt);
    drawTitle(dt,TITLE_MENU_ITEMS,titleMenuIdx);
    drawScreenFade();
    applyPostFX();
    drawFPSIfNeeded();
    if(titleExitConfirm)drawTitleExitConfirm();
    requestAnimationFrame(loop);
    return;
  }
  if(rs==="options"){
    if(optionsReturnState==="title"){
      drawTitle(dt,TITLE_MENU_ITEMS,titleMenuIdx);
      applyPostFX();
      if(titleExitConfirm)drawTitleExitConfirm();
    }else if(optionsReturnState==="paused"){
      ctx.clearRect(0,0,VW,VH);
      ctx.drawImage(pausedCvs,0,0,VW,VH);
      applyPostFX();
    }else drawBG(dt);
    drawSettingsMenu(true);
    drawFPSIfNeeded();
    drawScreenFade();
    requestAnimationFrame(loop);
    return;
  }

  if(rs==="intro"){
    if(!freezeLogic)updateIntro(dt);
    drawIntro(dt);
    drawScreenFade();
    applyPostFX();
    drawFPSIfNeeded();
    requestAnimationFrame(loop);
    return;
  }

  if(rs==="gameover"){
    if(!freezeLogic){
      if(!gameOverVoicePlayed){
        playVoice("gameover");
        gameOverVoicePlayed=true;
        lockEndScreenReset();
      }
      updateEndScreenResetLock(dt);
    }
    drawBG(dt);
    drawGO(END_MENU_ITEMS,endMenuIdx);
    drawScreenFade();
    applyPostFX();
    drawFPSIfNeeded();
    requestAnimationFrame(loop);
    return;
  }

  if(rs==="win"){
    if(!freezeLogic){
      if(!gameCompletedVoicePlayed){
        playVoice("congratulations");
        gameCompletedVoicePlayed=true;
        lockEndScreenReset();
      }
      updateEndScreenResetLock(dt);
    }
    drawBG(dt);
    drawWin(END_MENU_ITEMS,endMenuIdx);
    drawScreenFade();
    applyPostFX();
    drawFPSIfNeeded();
    requestAnimationFrame(loop);
    return;
  }

  if(rs==="paused"){
    drawPausedFrame();
    drawScreenFade();
    requestAnimationFrame(loop);
    return;
  }

  if(!freezeLogic)update(dt);
  if(introBoostActive&&stage<2){
    if(phaseT<2.6)bgSpeedTarget=9.0;
    else bgSpeedTarget=Math.max(1,bgSpeedTarget-dt*2.8);
    if(bgSpeedTarget<=1.05)introBoostActive=false;
  }
  drawBG(dt);
  if(G.boss)drawBossHPBar(G.boss);

  if(G.boss&&G.boss.entering){
    drawMedals();
    drawCapsules();
    drawEnemies();
    drawShots();
    drawBullets();
    drawExpl();
    drawDebris();
    drawHitSparks();
    drawMuzzleGlows();
    drawPlayer();
    drawBoss(G.boss);
    drawBossChargeOrbs(G.boss);
  } else {
    if(G.boss)drawBoss(G.boss);
    if(G.boss)drawBossChargeOrbs(G.boss);
    drawMedals();
    drawCapsules();
    drawEnemies();
    drawShots();
    drawBullets();
    drawExpl();
    drawDebris();
    drawHitSparks();
    drawMuzzleGlows();
    drawPlayer();
  }

  drawScreenFlash();
  drawGameHUD();
  drawWarning();
  drawScreenFade();

  if(rs==="game"&&pausedCvs.width===VW&&pausedCvs.height===VH){
    pausedCtx.imageSmoothingEnabled=false;
    pausedCtx.drawImage(canvas,0,0,VW,VH);
  }else if(rs==="game"){
    pausedCvs.width=VW;
    pausedCvs.height=VH;
    pausedCtx.imageSmoothingEnabled=false;
    pausedCtx.drawImage(canvas,0,0,VW,VH);
  }

  applyPostFX();
  drawFPSIfNeeded();

  requestAnimationFrame(loop);
}

let gameStarted=false;
function checkAndStart(){
  if(!gameStarted){
    gameStarted=true;
    appState="loading";
    resize();
    requestAnimationFrame(loop);
  }
}

initAssets(checkAndStart);