let appState="loading",titleT=0;
let loadingProgress=0,loadingReady=false,loadingSpinT=0,loadingPromptT=0;
let loadingLinesShown=0,loadingLineT=0;
let pausedFromState="";
let pauseFrameDirty=true;
let optionsReturnState="";
let fxScanlinesOn=true,fxCurveOn=false;
let fxScanlinesIntensity=0.35,fxCurveIntensity=0.22;
let fxBleedOn=false,fxBleedIntensity=0.35;
let colorFilterIdx=0;
let fxBrightness=0.5,fxContrast=0.5;
let displayFpsOn=false;
let introFlash=0,introFlashCount=0,introFlashOn=false;
let introSeqIdx=0,introSeqT=0,introLineChars=0,introBoostActive=false;
let introLineShown=[0,0,0,0,0,0];
let titleMenuIdx=0,endMenuIdx=0,titleGpMsgT=0,titleLogoZoomT=0;
let titleExitConfirm=false,titleExitIdx=1;
let fpsDisplay=60;

let screenTrans={active:false,phase:"out",alpha:0,drawState:"loading",onMid:null};

function beginScreenTransition(onMid){
  if(screenTrans.active){
    if(onMid)onMid();
    return;
  }
  stopAllLoopSfx();
  screenTrans.active=true;
  screenTrans.phase="out";
  screenTrans.alpha=0;
  screenTrans.drawState=appState;
  screenTrans.onMid=onMid||null;
}

function updScreenTransition(dt){
  if(!screenTrans.active)return;
  if(screenTrans.phase==="out"){
    screenTrans.alpha=Math.min(1,screenTrans.alpha+dt*SCREEN_FADE_SPEED);
    if(screenTrans.alpha>=1){
      if(screenTrans.onMid)screenTrans.onMid();
      screenTrans.onMid=null;
      screenTrans.drawState=appState;
      screenTrans.phase="in";
    }
  }else{
    screenTrans.alpha=Math.max(0,screenTrans.alpha-dt*SCREEN_FADE_SPEED);
    if(screenTrans.alpha<=0)screenTrans.active=false;
  }
}

function getRenderState(){
  if(screenTrans.active&&screenTrans.phase==="out")return screenTrans.drawState;
  return appState;
}

function isScreenTransitionBlockingInput(){
  return screenTrans.active;
}
let score=0,medals=0,gameOver=false,lastT=0,phaseT=0,phaseElapsed=0;
let stage=0,warnT=0,warnB=0;
let warnDim=0,warnLineChars=[0,0];
let comboX=1,comboT=COMBO_DUR,comboKills=0,comboBossLock=false;
let laserEnergy=LASER_MAX,laserCD=0,laserUsing=false;
let screenFlash=0;
let maxComboBonusActive=false,maxComboBonusT=0;
const MAX_COMBO_BONUS_DUR=30.0;
const LOADING_LINE_STEP=0.9;
const INTRO_LINES=[
  "THE GALAXY IS AT WAR!",
  "The GORF Empire has already colonized hundreds of planets, draining their natural resources, enslaving their inhabitants, and spreading pure terror.",
  "Those who dare to oppose them are completely eradicated!",
  "The brave pilots of the Terran Federation are the last line of defense against GORF!",
  "In one final, suicidal caravan run, they have only minutes to smash through the empire's ultimate defenses, confront GORF face-to-face, and save the galaxy!",
  "WELCOME TO CARAVAN BLAST!"
];
let infiniteLives=false,invincible=false;
let bossDeathT=0,bossDeathPhase="",bossNova=0,bossFadeAlpha=1;
let bossDeathRot=0,bossDeathScale=1,bossNovaStartScale=1;

if(typeof endScreenResetLocked!=="undefined")endScreenResetLocked=false;
if(typeof endScreenResetTimer!=="undefined")endScreenResetTimer=0;

const G={
  player:{x:VW/2-40,y:VH-120,w:80,h:80,spd:280,lMult:0.5,lives:3,inv:0,fire:0,hbr:6,collectR:104},
  pShots:[],eBullets:[],enemies:[],expl:[],debris:[],sparks:[],muzzleGlows:[],medals:[],capsules:[],
  boss:null,spawnT:1.5,waveIdx:0,killN:0
};

function resetGame(){
  stopBGM();
  stopVoice();
  score=0;medals=0;gameOver=false;phaseT=0;phaseElapsed=0;
  stage=0;warnT=0;warnB=0;
  warnDim=0;warnLineChars=[0,0];
  comboX=1;comboT=COMBO_DUR;comboKills=0;comboBossLock=false;
  maxComboBonusActive=false;maxComboBonusT=0;
  laserEnergy=LASER_MAX;laserCD=0;laserUsing=false;screenFlash=0;
  G.player.x=VW/2-40;G.player.y=VH-120;G.player.lives=3;G.player.inv=0;G.player.fire=0;
  G.pShots=[];G.eBullets=[];G.enemies=[];G.expl=[];G.debris=[];G.sparks=[];G.muzzleGlows=[];G.medals=[];G.capsules=[];
  G.boss=null;G.spawnT=1.5;G.waveIdx=0;G.killN=0;
  if(typeof resetWeapons==="function")resetWeapons();
  if(typeof resetWaveFlow==="function")resetWaveFlow();
  if(typeof staggeredBursts!=="undefined")staggeredBursts.length=0;
  bgSpeedMult=1;bgSpeedTarget=1;
  bossDeathT=0;bossDeathPhase="";bossNova=0;bossFadeAlpha=1;bossDeathRot=0;bossDeathScale=1;bossNovaStartScale=1;
  document.getElementById("boss-hp-wrap").style.display="none";

  titleT=0;
  loadingProgress=0;loadingReady=false;loadingSpinT=0;loadingPromptT=0;loadingLinesShown=0;loadingLineT=0;
  introFlash=0;
  introFlashCount=0;
  introFlashOn=false;
  introSeqIdx=0;introSeqT=0;introLineChars=0;introBoostActive=false;
  introLineShown=[0,0,0,0,0,0];

  if(typeof playerRespawning!=="undefined")playerRespawning=false;
  if(typeof playerRespawnTimer!=="undefined")playerRespawnTimer=0;
  if(typeof playerArriving!=="undefined")playerArriving=false;
  if(typeof playerArrivalPhase!=="undefined")playerArrivalPhase=0;
  if(typeof flgPlayerControl!=="undefined")flgPlayerControl=1;

  if(typeof bossWarningVoicePlayed!=="undefined")bossWarningVoicePlayed=false;
  if(typeof bossMusicDelayTimer!=="undefined")bossMusicDelayTimer=0;
  if(typeof bossMusicQueued!=="undefined")bossMusicQueued=false;
  if(typeof gameCompletedVoicePlayed!=="undefined")gameCompletedVoicePlayed=false;
  if(typeof gameOverVoicePlayed!=="undefined")gameOverVoicePlayed=false;
  if(typeof titleVoicePlayed!=="undefined")titleVoicePlayed=false;
  if(typeof titleBGMStarted!=="undefined")titleBGMStarted=false;
  if(typeof endScreenInputLockTimer!=="undefined")endScreenInputLockTimer=0;
  pausedFromState="";
  pauseFrameDirty=true;
  if(typeof resetSettingsMenuNav==="function")resetSettingsMenuNav();
  optionsReturnState="";
  titleMenuIdx=0;
  endMenuIdx=0;
  titleGpMsgT=0;
  titleLogoZoomT=0;
  titleExitConfirm=false;
  titleExitIdx=1;
  screenTrans={active:false,phase:"out",alpha:0,drawState:"loading",onMid:null};
  stopAllLoopSfx();
  resetBossBGMFade();

  appState="title";
}