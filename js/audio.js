// ── Volumes (ajuste fino por som) ─────────────────────────────────────────
const AUDIO_VOL={
  bgm:{
    title:0.7,
    stage1:0.7,
    boss:0.7
  },
  vox:{
    engage:1.0,
    introFull:1.0,
    gameover:1.0,
    comboup:1.0,
    combofinish:1.0,
    laserdepleted:1.0,
    laserready:1.0,
    outofmissiles:1.0,
    missilesrestocked:1.0,
    warningbossgracioli:1.0,
    congratulations:1.0,
    titlescreen:1.0
  },
  sfx:{
    select:0.45,
    greenLaser:0.2,
    blueLaser:0.8,
    redMachinegun:0.35,
    purpleHoming:0.35,
    missileLaunch:0.4,
    explosion1:0.35,
    explosion2:0.35,
    explosionFinal:0.75,
    warningSiren:0.15
  }
};

// ── Volumes globais (multiplicadores sobre AUDIO_VOL) ─────────────────────
let globalMusicVol=1;
let globalSfxVol=1;

function effectiveMusicVol(base){
  return clamp(base*globalMusicVol,0,1);
}

function effectiveSfxVol(base){
  return clamp(base*globalSfxVol,0,1);
}

function mkAudio(src,vol){
  const a=new Audio(src);
  a.preload="auto";
  if(vol!=null)a.volume=vol;
  return a;
}

const BGM={
  title:mkAudio("assets/bgm/title.mp3",AUDIO_VOL.bgm.title),
  stage1:mkAudio("assets/bgm/stage1.mp3",AUDIO_VOL.bgm.stage1),
  boss:mkAudio("assets/bgm/boss.mp3",AUDIO_VOL.bgm.boss)
};
BGM.title.loop=true;
BGM.stage1.loop=true;
BGM.boss.loop=true;

const VOX={
  engage:mkAudio("assets/voices/engage.mp3",AUDIO_VOL.vox.engage),
  introFull:mkAudio("assets/voices/intro-full.mp3",AUDIO_VOL.vox.introFull),
  gameover:mkAudio("assets/voices/gameover.mp3",AUDIO_VOL.vox.gameover),
  comboup:mkAudio("assets/voices/comboup.mp3",AUDIO_VOL.vox.comboup),
  combofinish:mkAudio("assets/voices/combofinish.mp3",AUDIO_VOL.vox.combofinish),
  laserdepleted:mkAudio("assets/voices/laserdepleted.mp3",AUDIO_VOL.vox.laserdepleted),
  laserready:mkAudio("assets/voices/laserready.mp3",AUDIO_VOL.vox.laserready),
  outofmissiles:mkAudio("assets/voices/out-of-missiles.mp3",AUDIO_VOL.vox.outofmissiles),
  missilesrestocked:mkAudio("assets/voices/missiles-restocked.mp3",AUDIO_VOL.vox.missilesrestocked),
  warningbossgracioli:mkAudio("assets/voices/warningbossgracioli.mp3",AUDIO_VOL.vox.warningbossgracioli),
  congratulations:mkAudio("assets/voices/congratulations.mp3",AUDIO_VOL.vox.congratulations),
  titlescreen:mkAudio("assets/voices/titlescreen.mp3",AUDIO_VOL.vox.titlescreen)
};

// PLACEHOLDER: o som do míssil ainda não foi definido. Usando blue-laser
// temporariamente — trocar "assets/sounds/blue-laser.mp3" pelo arquivo final.
const SFX_MISSILE_SRC="assets/sounds/blue-laser.mp3";

const SFX={
  select:mkAudio("assets/sounds/select.mp3",AUDIO_VOL.sfx.select),
  greenLaser:mkAudio("assets/sounds/green-laser.mp3",AUDIO_VOL.sfx.greenLaser),
  blueLaser:mkAudio("assets/sounds/blue-laser.mp3",AUDIO_VOL.sfx.blueLaser),
  redMachinegun:mkAudio("assets/sounds/red-machinegun.mp3",AUDIO_VOL.sfx.redMachinegun),
  purpleHoming:mkAudio("assets/sounds/purple-homing.mp3",AUDIO_VOL.sfx.purpleHoming),
  missileLaunch:mkAudio(SFX_MISSILE_SRC,AUDIO_VOL.sfx.missileLaunch),
  explosion1:mkAudio("assets/sounds/explosion-1.mp3",AUDIO_VOL.sfx.explosion1),
  explosion2:mkAudio("assets/sounds/explosion-2.mp3",AUDIO_VOL.sfx.explosion2),
  explosionFinal:mkAudio("assets/sounds/explosion-final.mp3",AUDIO_VOL.sfx.explosionFinal),
  warningSiren:mkAudio("assets/sounds/warning-siren.mp3",AUDIO_VOL.sfx.warningSiren)
};
SFX.greenLaser.loop=true;
SFX.blueLaser.loop=true;
SFX.redMachinegun.loop=true;
SFX.purpleHoming.loop=true;
SFX.missileLaunch.loop=true;
SFX.warningSiren.loop=true;

// loop de som genérico: keyed pelo próprio nome do SFX
const loopSfxOn={};
let warningSirenFading=false;
let warningSirenMul=1;

let currentBGM=null;
let currentVoice=null;
let bossBgmFadeActive=false;
let bossBgmVolMul=1;

function applyGlobalVolumes(){
  for(const k in BGM){
    let v=AUDIO_VOL.bgm[k];
    if(BGM[k]===currentBGM&&k==="boss")v*=bossBgmVolMul;
    BGM[k].volume=effectiveMusicVol(v);
  }
  for(const k in VOX){
    VOX[k].volume=effectiveMusicVol(AUDIO_VOL.vox[k]);
  }
  for(const k in SFX){
    let mul=1;
    if(k==="warningSiren")mul=warningSirenMul;
    SFX[k].volume=effectiveSfxVol(AUDIO_VOL.sfx[k]*mul);
  }
}

function beginWarningSirenFade(){
  if(!loopSfxOn.warningSiren||warningSirenFading)return;
  warningSirenFading=true;
}

function updWarningSirenFade(dt){
  if(!warningSirenFading||!loopSfxOn.warningSiren)return;
  warningSirenMul=Math.max(0,warningSirenMul-dt/WARN_SIREN_FADE_DUR);
  SFX.warningSiren.volume=effectiveSfxVol(AUDIO_VOL.sfx.warningSiren*warningSirenMul);
  if(warningSirenMul<=0){
    warningSirenFading=false;
    warningSirenMul=1;
    syncLoopSfx("warningSiren",false);
  }
}

function forceStopWarningSiren(){
  warningSirenFading=false;
  warningSirenMul=1;
  syncLoopSfx("warningSiren",false);
}

function applyBossBGMVolume(){
  if(currentBGM===BGM.boss){
    currentBGM.volume=effectiveMusicVol(AUDIO_VOL.bgm.boss*bossBgmVolMul);
  }
}

function startBossBGMFade(){
  bossBgmFadeActive=true;
}

function updBossBGMFade(dt){
  if(!bossBgmFadeActive)return;
  if(bossBgmVolMul>BOSS_BGM_DEATH_VOL){
    bossBgmVolMul=Math.max(BOSS_BGM_DEATH_VOL,bossBgmVolMul-dt*BOSS_BGM_FADE_RATE);
    applyBossBGMVolume();
  }
}

function resetBossBGMFade(){
  bossBgmFadeActive=false;
  bossBgmVolMul=1;
}

function playBGM(key){
  const next=BGM[key]||null;
  if(currentBGM===next)return;

  if(currentBGM){
    currentBGM.pause();
    currentBGM.currentTime=0;
  }

  currentBGM=next;

  if(currentBGM){
    if(key==="boss"){
      resetBossBGMFade();
    }
    currentBGM.volume=effectiveMusicVol(AUDIO_VOL.bgm[key]*(key==="boss"?bossBgmVolMul:1));
    currentBGM.play().catch(()=>{});
  }
}

function stopBGM(){
  if(currentBGM){
    currentBGM.pause();
    currentBGM.currentTime=0;
    currentBGM=null;
  }
  resetBossBGMFade();
}

function stopVoice(){
  if(currentVoice){
    currentVoice.pause();
    currentVoice.currentTime=0;
    currentVoice=null;
  }
}

function playVoice(key){
  const a=VOX[key];
  if(!a)return;

  if(currentVoice&&currentVoice!==a){
    currentVoice.pause();
    currentVoice.currentTime=0;
  }

  currentVoice=a;
  a.volume=effectiveMusicVol(AUDIO_VOL.vox[key]);
  a.currentTime=0;
  a.play().catch(()=>{});
}

function isVoicePlaying(key){
  const a=VOX[key];
  if(!a)return false;
  return !a.paused&&!a.ended;
}

function getVoiceTime(key){
  const a=VOX[key];
  if(!a)return 0;
  return a.currentTime||0;
}

function playSelectSfx(){
  const a=SFX.select;
  if(!a)return;
  a.volume=effectiveSfxVol(AUDIO_VOL.sfx.select);
  a.currentTime=0;
  a.play().catch(()=>{});
}

function syncLoopSfx(name,on){
  const a=SFX[name];
  if(!a)return;
  if(name==="warningSiren"&&on){
    warningSirenFading=false;
    warningSirenMul=1;
  }
  a.volume=effectiveSfxVol(AUDIO_VOL.sfx[name]*(name==="warningSiren"?warningSirenMul:1));
  if(on&&!loopSfxOn[name]){
    a.currentTime=0;
    a.play().catch(()=>{});
    loopSfxOn[name]=true;
  }else if(!on&&loopSfxOn[name]){
    a.pause();
    a.currentTime=0;
    loopSfxOn[name]=false;
  }
}

function stopAllLoopSfx(){
  warningSirenFading=false;
  warningSirenMul=1;
  for(const n in SFX){
    if(SFX[n].loop)syncLoopSfx(n,false);
  }
}

function playExplosionSfx(){
  const pick=Math.random()<0.5?"explosion1":"explosion2";
  const s=SFX[pick].cloneNode();
  s.volume=effectiveSfxVol(AUDIO_VOL.sfx[pick]);
  s.play().catch(()=>{});
}

function playExplosionFinalSfx(){
  const a=SFX.explosionFinal;
  a.volume=effectiveSfxVol(AUDIO_VOL.sfx.explosionFinal);
  a.currentTime=0;
  a.play().catch(()=>{});
}

function preloadGameAudio(){
  for(const k in BGM){
    try{BGM[k].load();}catch(e){}
  }
  for(const k in VOX){
    try{VOX[k].load();}catch(e){}
  }
  for(const k in SFX){
    try{SFX[k].load();}catch(e){}
  }
}
